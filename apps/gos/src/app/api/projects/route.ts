import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.project.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const status = typeof body?.status === "string" ? body.status : "PLANNING";
  const budget = body?.budget === "" || body?.budget == null ? null : Number(body.budget);
  const dueDate = body?.dueDate ? new Date(String(body.dueDate)) : null;
  if (name.length < 3 || name.length > 160) return NextResponse.json({ error: "Nama proyek harus 3–160 karakter." }, { status: 400 });
  if (!["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"].includes(status)) return NextResponse.json({ error: "Status proyek tidak valid." }, { status: 400 });
  if (budget !== null && (!Number.isFinite(budget) || budget < 0 || budget > 1_000_000_000_000)) return NextResponse.json({ error: "Anggaran tidak valid." }, { status: 400 });
  if (dueDate && Number.isNaN(dueDate.getTime())) return NextResponse.json({ error: "Tanggal deadline tidak valid." }, { status: 400 });
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim().slice(0, 160) : "";
  const data = await prisma.project.create({ data: { name, status, budget, dueDate, customerName: customerName || null } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID proyek tidak valid." }, { status: 400 });
  const data: { name?: string; status?: string; budget?: number | null; dueDate?: Date | null; customerName?: string | null } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 3 || body.name.trim().length > 160) return NextResponse.json({ error: "Nama proyek tidak valid." }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !["PLANNING", "IN_PROGRESS", "REVIEW", "COMPLETED", "CANCELLED"].includes(body.status)) return NextResponse.json({ error: "Status proyek tidak valid." }, { status: 400 });
    data.status = body.status;
  }
  if (body.budget !== undefined) {
    const value = body.budget === "" || body.budget === null ? null : Number(body.budget);
    if (value !== null && (!Number.isFinite(value) || value < 0 || value > 1_000_000_000_000)) return NextResponse.json({ error: "Anggaran tidak valid." }, { status: 400 });
    data.budget = value;
  }
  if (body.dueDate !== undefined) {
    const value = body.dueDate ? new Date(String(body.dueDate)) : null;
    if (value && Number.isNaN(value.getTime())) return NextResponse.json({ error: "Deadline tidak valid." }, { status: 400 });
    data.dueDate = value;
  }
  if (body.customerName !== undefined) data.customerName = typeof body.customerName === "string" && body.customerName.trim() ? body.customerName.trim().slice(0,160) : null;
  try {
    const result = await prisma.project.update({ where: { id: body.id }, data });
    return NextResponse.json({ data: result });
  } catch { return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID proyek wajib diisi." }, { status: 400 });
  try { await prisma.project.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Proyek tidak ditemukan." }, { status: 404 }); }
}
