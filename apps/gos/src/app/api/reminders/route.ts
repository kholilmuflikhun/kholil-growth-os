import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.reminder.findMany({ orderBy: [{ status: "asc" }, { dueAt: "asc" }] });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 1000) : "";
  const dueAt = body?.dueAt ? new Date(String(body.dueAt)) : null;
  const priority = typeof body?.priority === "string" ? body.priority : "MEDIUM";
  if (title.length < 3 || title.length > 180) return NextResponse.json({ error: "Judul pengingat harus 3–180 karakter." }, { status: 400 });
  if (!dueAt || Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: "Tanggal dan waktu pengingat wajib valid." }, { status: 400 });
  if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) return NextResponse.json({ error: "Prioritas tidak valid." }, { status: 400 });
  const data = await prisma.reminder.create({ data: { title, description: description || null, dueAt, priority } });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID pengingat tidak valid." }, { status: 400 });
  const data: { title?: string; description?: string | null; dueAt?: Date; priority?: string; status?: string } = {};
  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 180) return NextResponse.json({ error: "Judul tidak valid." }, { status: 400 });
    data.title = body.title.trim();
  }
  if (body.description !== undefined) data.description = typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 1000) : null;
  if (body.dueAt !== undefined) {
    const date = new Date(String(body.dueAt));
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Tanggal pengingat tidak valid." }, { status: 400 });
    data.dueAt = date;
  }
  if (body.priority !== undefined) {
    if (typeof body.priority !== "string" || !["LOW", "MEDIUM", "HIGH"].includes(body.priority)) return NextResponse.json({ error: "Prioritas tidak valid." }, { status: 400 });
    data.priority = body.priority;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !["OPEN", "DONE"].includes(body.status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    data.status = body.status;
  }
  try {
    const result = await prisma.reminder.update({ where: { id: body.id }, data });
    return NextResponse.json({ data: result });
  } catch { return NextResponse.json({ error: "Pengingat tidak ditemukan." }, { status: 404 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID pengingat wajib diisi." }, { status: 400 });
  try { await prisma.reminder.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Pengingat tidak ditemukan." }, { status: 404 }); }
}
