import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statuses = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"] as const;
async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.proposal.findMany({
    include: { lead: { select: { id: true, name: true, businessName: true, contact: true, service: true, status: true } } },
    orderBy: [{ createdAt: "desc" }],
    take: 500,
  });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === "string" ? body.leadId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const amount = Number(body?.amount);
  const validUntil = body?.validUntil ? new Date(String(body.validUntil)) : null;
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 2000) : "";
  if (!leadId) return NextResponse.json({ error: "Prospek wajib dipilih." }, { status: 400 });
  if (title.length < 3 || title.length > 180) return NextResponse.json({ error: "Judul penawaran harus 3–180 karakter." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) return NextResponse.json({ error: "Nilai penawaran harus lebih dari nol." }, { status: 400 });
  if (validUntil && Number.isNaN(validUntil.getTime())) return NextResponse.json({ error: "Tanggal berlaku tidak valid." }, { status: 400 });
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, status: true } });
  if (!lead) return NextResponse.json({ error: "Prospek tidak ditemukan." }, { status: 404 });
  const data = await prisma.proposal.create({
    data: { leadId, title, amount, validUntil, notes: notes || null },
    include: { lead: { select: { id: true, name: true, businessName: true, contact: true, service: true, status: true } } },
  });
  if (lead.status !== "WON" && lead.status !== "LOST") {
    await prisma.lead.update({ where: { id: leadId }, data: { status: "PROPOSAL", estimatedValue: amount } });
  }
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID penawaran tidak valid." }, { status: 400 });
  const data: { title?: string; amount?: number; status?: string; sentAt?: Date | null; validUntil?: Date | null; notes?: string | null } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 180) return NextResponse.json({ error: "Judul tidak valid." }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) return NextResponse.json({ error: "Nilai penawaran tidak valid." }, { status: 400 });
    data.amount = amount;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !statuses.includes(body.status as typeof statuses[number])) return NextResponse.json({ error: "Status penawaran tidak valid." }, { status: 400 });
    data.status = body.status;
    if (body.status === "SENT" && body.sentAt === undefined) data.sentAt = new Date();
  }
  for (const field of ["sentAt", "validUntil"] as const) {
    if (body[field] !== undefined) {
      const value = body[field] ? new Date(String(body[field])) : null;
      if (value && Number.isNaN(value.getTime())) return NextResponse.json({ error: `Tanggal ${field} tidak valid.` }, { status: 400 });
      data[field] = value;
    }
  }
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim().slice(0, 2000) : null;
  try {
    const proposal = await prisma.proposal.update({
      where: { id: body.id }, data,
      include: { lead: { select: { id: true, name: true, businessName: true, contact: true, service: true, status: true } } },
    });
    if (proposal.status === "ACCEPTED" && proposal.lead.status !== "WON") {
      await prisma.lead.update({ where: { id: proposal.leadId }, data: { status: "NEGOTIATION", estimatedValue: proposal.amount } });
    }
    if (proposal.status === "REJECTED" && proposal.lead.status === "PROPOSAL") {
      await prisma.lead.update({ where: { id: proposal.leadId }, data: { status: "NEGOTIATION" } });
    }
    return NextResponse.json({ data: proposal });
  } catch { return NextResponse.json({ error: "Penawaran tidak ditemukan atau gagal diperbarui." }, { status: 404 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID penawaran wajib diisi." }, { status: 400 });
  try { await prisma.proposal.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Penawaran tidak ditemukan." }, { status: 404 }); }
}
