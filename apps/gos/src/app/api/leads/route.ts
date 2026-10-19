import { NextResponse } from "next/server";
import { LeadStatus } from "@kholil/database/client";
import { leadSchema } from "@kholil/validation/lead";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getRequestAddress } from "@/lib/rate-limit";
import { normalizeCampaignSlug } from "@kholil/business-core/attribution";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}

export async function POST(request: Request) {
  // Manual creation is allowed only to authenticated staff. Public intake is
  // accepted only server-to-server with a shared secret.
  const session = await getSession();
  const staffAllowed = Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
  const expectedSecret = process.env.PUBLIC_LEAD_API_SECRET;
  if (!staffAllowed) {
    if (process.env.NODE_ENV === "production" && !expectedSecret) {
      console.error("PUBLIC_LEAD_API_SECRET is missing; public lead intake is disabled.");
      return NextResponse.json({ error: "Formulir sedang belum tersedia. Silakan hubungi melalui WhatsApp." }, { status: 503 });
    }
    if (expectedSecret && request.headers.get("x-public-lead-secret") !== expectedSecret) {
      return NextResponse.json({ error: "Permintaan tidak dapat diverifikasi." }, { status: 401 });
    }
  }
  if (!staffAllowed) {
    try {
      const ip = getRequestAddress(request, request.headers.get("x-public-client-ip"));
      const rate = await checkRateLimit({ namespace: "public-lead", identifier: ip, limit: 5, windowMs: 15 * 60 * 1000 });
      if (!rate.allowed) return NextResponse.json({ error: "Terlalu banyak permintaan dari jaringan ini. Silakan coba lagi nanti." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.resetAt.getTime() - Date.now()) / 1000))) } });
    } catch (error) {
      console.error("Public lead rate limit unavailable", error);
      return NextResponse.json({ error: "Formulir sementara tidak tersedia." }, { status: 503 });
    }
  }
  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 16_384) return NextResponse.json({ error: "Ukuran formulir terlalu besar." }, { status: 413 });
  let body: unknown = null;
  try { body = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 }); }
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Data belum valid.", details: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const campaignSlug = normalizeCampaignSlug(parsed.data.utmCampaign);
    const campaign = !staffAllowed && campaignSlug ? await prisma.campaign.findUnique({ where: { slug: campaignSlug }, select: { id: true } }).catch(() => null) : null;
    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name, contact: parsed.data.contact,
        businessName: parsed.data.businessName || null, service: parsed.data.service,
        message: parsed.data.message, source: staffAllowed ? "manual" : "public-website",
        consentedAt: staffAllowed ? null : new Date(), consentVersion: staffAllowed ? null : "contact-form-v1",
        sourceUrl: parsed.data.sourceUrl || null, utmSource: parsed.data.utmSource || null,
        utmMedium: parsed.data.utmMedium || null, utmCampaign: parsed.data.utmCampaign || null,
        campaignId: campaign?.id ?? null,
        owner: staffAllowed ? session?.username ?? null : null,
        activities: { create: { type: staffAllowed ? "Lead dibuat manual" : "Lead masuk dari website", note: staffAllowed ? "Prospek ditambahkan oleh tim internal." : "Permintaan konsultasi diterima dari website publik.", createdBy: staffAllowed ? session?.username ?? null : "public-website" } },
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, leadId: lead.id, createdAt: lead.createdAt }, { status: 201 });
  } catch (error) {
    console.error("Lead persistence failed", error);
    return NextResponse.json({ error: "Permintaan belum dapat disimpan. Silakan coba lagi." }, { status: 503 });
  }
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const leads = await prisma.lead.findMany({ include: { activities: { orderBy: { createdAt: "desc" }, take: 50 } }, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json({ data: leads });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown; estimatedValue?: unknown; nextFollowUp?: unknown; probability?: unknown; owner?: unknown; lostReason?: unknown; message?: unknown } | null;
  if (!body || typeof body.id !== "string") return NextResponse.json({ error: "ID prospek tidak valid." }, { status: 400 });
  const data: { status?: LeadStatus; estimatedValue?: number | null; nextFollowUp?: Date | null; probability?: number; owner?: string | null; lostReason?: string | null; message?: string } = {};
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !Object.values(LeadStatus).includes(body.status as LeadStatus)) {
      return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    }
    data.status = body.status as LeadStatus;
    if (body.probability === undefined) {
      const defaultProbability: Record<string, number> = { NEW: 10, CONTACTED: 25, QUALIFIED: 50, DISCOVERY: 50, PROPOSAL: 70, NEGOTIATION: 85, WON: 100, LOST: 0 };
      data.probability = defaultProbability[body.status];
    }
  }
  if (body.probability !== undefined) {
    const probability = Number(body.probability);
    if (!Number.isInteger(probability) || probability < 0 || probability > 100) return NextResponse.json({ error: "Probabilitas harus berupa bilangan bulat 0–100." }, { status: 400 });
    data.probability = probability;
  }
  if (body.owner !== undefined) {
    if (body.owner !== null && (typeof body.owner !== "string" || body.owner.length > 120)) return NextResponse.json({ error: "Penanggung jawab tidak valid." }, { status: 400 });
    data.owner = typeof body.owner === "string" && body.owner.trim() ? body.owner.trim() : null;
  }
  if (body.lostReason !== undefined) {
    if (body.lostReason !== null && (typeof body.lostReason !== "string" || body.lostReason.length > 1000)) return NextResponse.json({ error: "Alasan tidak lanjut tidak valid." }, { status: 400 });
    data.lostReason = typeof body.lostReason === "string" && body.lostReason.trim() ? body.lostReason.trim() : null;
  }
  if (body.message !== undefined) {
    if (typeof body.message !== "string" || body.message.length > 3000) return NextResponse.json({ error: "Catatan tidak valid." }, { status: 400 });
    data.message = body.message.trim();
  }
  if (body.estimatedValue !== undefined) {
    const value = body.estimatedValue === "" || body.estimatedValue === null ? null : Number(body.estimatedValue);
    if (value !== null && (!Number.isFinite(value) || value < 0)) return NextResponse.json({ error: "Nilai estimasi tidak valid." }, { status: 400 });
    data.estimatedValue = value;
  }
  if (body.nextFollowUp !== undefined) {
    const date = body.nextFollowUp ? new Date(String(body.nextFollowUp)) : null;
    if (date && Number.isNaN(date.getTime())) return NextResponse.json({ error: "Tanggal follow-up tidak valid." }, { status: 400 });
    data.nextFollowUp = date;
  }
  try {
    const before = await prisma.lead.findUnique({ where: { id: body.id }, select: { status: true, estimatedValue: true, nextFollowUp: true, probability: true } });
    const lead = await prisma.lead.update({ where: { id: body.id }, data });
    const changes: string[] = [];
    if (data.status && before?.status !== data.status) changes.push(`Tahap berubah: ${before?.status ?? "-"} → ${data.status}`);
    if (data.estimatedValue !== undefined) changes.push(`Nilai peluang diperbarui: ${data.estimatedValue ?? 0}`);
    if (data.nextFollowUp !== undefined) changes.push(`Jadwal follow-up diperbarui: ${data.nextFollowUp?.toISOString() ?? "dihapus"}`);
    if (data.probability !== undefined && before?.probability !== data.probability) changes.push(`Probabilitas diperbarui: ${data.probability}%`);
    if (changes.length) await prisma.leadActivity.create({ data: { leadId: lead.id, type: "Pembaruan CRM", note: changes.join("; "), createdBy: (await getSession())?.username ?? "staff" } });
    const refreshed = await prisma.lead.findUnique({ where: { id: lead.id }, include: { activities: { orderBy: { createdAt: "desc" }, take: 50 } } });
    return NextResponse.json({ data: refreshed ?? lead });
  } catch {
    return NextResponse.json({ error: "Prospek tidak ditemukan atau gagal diperbarui." }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID prospek wajib diisi." }, { status: 400 });
  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Prospek tidak ditemukan." }, { status: 404 });
  }
}
