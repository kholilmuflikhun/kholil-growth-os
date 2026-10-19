import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
const statuses = ["IDEA", "DRAFT", "IN_REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.contentItem.findMany({ include: { campaign: { select: { id: true, name: true, slug: true } } }, orderBy: [{ plannedAt: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const channel = typeof body?.channel === "string" ? body.channel.trim() : "";
  const status = typeof body?.status === "string" ? body.status : "IDEA";
  const plannedAt = body?.plannedAt ? new Date(String(body.plannedAt)) : null;
  const campaignId = typeof body?.campaignId === "string" && body.campaignId ? body.campaignId : null;
  if (campaignId && !(await prisma.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))) return NextResponse.json({ error: "Kampanye tidak ditemukan." }, { status: 400 });
  if (title.length < 3 || title.length > 180) return NextResponse.json({ error: "Judul konten harus 3–180 karakter." }, { status: 400 });
  if (!["Instagram", "TikTok", "Facebook", "Threads", "LinkedIn", "Website", "YouTube", "Lainnya"].includes(channel)) return NextResponse.json({ error: "Kanal konten tidak valid." }, { status: 400 });
  if (!statuses.includes(status)) return NextResponse.json({ error: "Status konten tidak valid." }, { status: 400 });
  if (plannedAt && Number.isNaN(plannedAt.getTime())) return NextResponse.json({ error: "Tanggal publikasi tidak valid." }, { status: 400 });
  const data = await prisma.contentItem.create({ data: { title, channel, status, plannedAt, campaignId } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID konten tidak valid." }, { status: 400 });
  const data: { title?: string; channel?: string; status?: string; plannedAt?: Date | null; publishedAt?: Date | null; campaignId?: string | null; reach?: number; impressions?: number; engagement?: number; clicks?: number; attributedLeads?: number; attributedRevenue?: number | null } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 180) return NextResponse.json({ error: "Judul konten tidak valid." }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.channel !== undefined) {
    if (typeof body.channel !== "string" || !["Instagram", "TikTok", "Facebook", "Threads", "LinkedIn", "Website", "YouTube", "Lainnya"].includes(body.channel)) return NextResponse.json({ error: "Kanal konten tidak valid." }, { status: 400 });
    data.channel = body.channel;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !statuses.includes(body.status)) return NextResponse.json({ error: "Status konten tidak valid." }, { status: 400 });
    data.status = body.status;
    if (body.status === "PUBLISHED") data.publishedAt = new Date();
  }
  if (body.plannedAt !== undefined) {
    const value = body.plannedAt ? new Date(String(body.plannedAt)) : null;
    if (value && Number.isNaN(value.getTime())) return NextResponse.json({ error: "Tanggal rencana tidak valid." }, { status: 400 });
    data.plannedAt = value;
  }
  if (body.campaignId !== undefined) {
    if (body.campaignId !== null && typeof body.campaignId !== "string") return NextResponse.json({ error: "Kampanye tidak valid." }, { status: 400 });
    if (typeof body.campaignId === "string" && !(await prisma.campaign.findUnique({ where: { id: body.campaignId }, select: { id: true } }))) return NextResponse.json({ error: "Kampanye tidak ditemukan." }, { status: 400 });
    data.campaignId = body.campaignId as string | null;
  }
  for (const field of ["reach", "impressions", "engagement", "clicks", "attributedLeads"] as const) {
    if (body[field] !== undefined) { const value = Number(body[field]); if (!Number.isInteger(value) || value < 0 || value > 1_000_000_000) return NextResponse.json({ error: `Metrik ${field} harus bilangan bulat non-negatif.` }, { status: 400 }); data[field] = value; }
  }
  if (body.attributedRevenue !== undefined) { const value = body.attributedRevenue === null || body.attributedRevenue === "" ? null : Number(body.attributedRevenue); if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000)) return NextResponse.json({ error: "Pendapatan teratribusi tidak valid." }, { status: 400 }); data.attributedRevenue = value; }
  try { const result = await prisma.contentItem.update({ where: { id: body.id }, data, include: { campaign: { select: { id: true, name: true, slug: true } } } }); return NextResponse.json({ data: result }); }
  catch { return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID konten wajib diisi." }, { status: 400 });
  try { await prisma.contentItem.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Konten tidak ditemukan." }, { status: 404 }); }
}
