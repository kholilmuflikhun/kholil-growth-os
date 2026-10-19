import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.kPIResult.findMany({ orderBy: [{ periodStart: "desc" }, { createdAt: "desc" }], take: 500 });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const target = Number(body?.target); const actual = Number(body?.actual); const weight = Number(body?.weight);
  const periodStart = new Date(String(body?.periodStart || "")); const periodEnd = new Date(String(body?.periodEnd || ""));
  if (name.length < 3 || name.length > 120) return NextResponse.json({ error: "Nama KPI harus 3–120 karakter." }, { status: 400 });
  if (![target, actual, weight].every(Number.isFinite) || target < 0 || actual < 0 || weight <= 0 || weight > 1) return NextResponse.json({ error: "Target/aktual harus ≥ 0 dan bobot dalam rentang > 0 sampai 1 (100%)." }, { status: 400 });
  if (Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime()) || periodEnd < periodStart) return NextResponse.json({ error: "Periode KPI tidak valid." }, { status: 400 });
  const data = await prisma.kPIResult.create({ data: { name, target, actual, weight, periodStart, periodEnd } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID KPI wajib diisi." }, { status: 400 });
  try { await prisma.kPIResult.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Catatan KPI tidak ditemukan." }, { status: 404 }); }
}
