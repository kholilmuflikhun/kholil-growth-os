import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role) ? session : null;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await authorized();
  if (!session) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const { id } = await context.params;
  const activities = await prisma.leadActivity.findMany({ where: { leadId: id }, orderBy: { createdAt: "desc" }, take: 100 });
  return NextResponse.json({ data: activities });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await authorized();
  if (!session) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as { type?: unknown; note?: unknown; dueAt?: unknown } | null;
  if (!body || typeof body.type !== "string" || body.type.trim().length < 2 || body.type.length > 80 || typeof body.note !== "string" || body.note.trim().length < 2 || body.note.length > 3000) {
    return NextResponse.json({ error: "Jenis aktivitas dan catatan wajib diisi." }, { status: 400 });
  }
  const type = body.type.trim();
  const note = body.note.trim();
  let dueAt: Date | null = null;
  if (body.dueAt) {
    dueAt = new Date(String(body.dueAt));
    if (Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "Tanggal tindak lanjut tidak valid." }, { status: 400 });
  }
  try {
    const activity = await prisma.$transaction(async tx => {
      const lead = await tx.lead.findUnique({ where: { id }, select: { id: true } });
      if (!lead) throw new Error("LEAD_NOT_FOUND");
      const created = await tx.leadActivity.create({ data: { leadId: id, type, note, dueAt, createdBy: session.username } });
      if (dueAt) await tx.lead.update({ where: { id }, data: { nextFollowUp: dueAt } });
      return created;
    });
    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "LEAD_NOT_FOUND") return NextResponse.json({ error: "Prospek tidak ditemukan." }, { status: 404 });
    return NextResponse.json({ error: "Aktivitas gagal disimpan." }, { status: 500 });
  }
}
