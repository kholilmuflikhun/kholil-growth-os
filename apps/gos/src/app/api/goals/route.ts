import { NextResponse } from "next/server";
import { Prisma } from "@kholil/database/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const data = await prisma.goal.findMany({ orderBy: [{ status: "asc" }, { startDate: "desc" }] });
  return NextResponse.json({ data });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const metric = typeof body?.metric === "string" ? body.metric.trim() : "";
  const targetValue = Number(body?.targetValue);
  const startDate = new Date(String(body?.startDate || ""));
  const endDate = new Date(String(body?.endDate || ""));
  const activeDays = Number(body?.activeDays);
  if (name.length < 3 || name.length > 120) return NextResponse.json({ error: "Nama target harus 3–120 karakter." }, { status: 400 });
  if (metric.length < 2 || metric.length > 80) return NextResponse.json({ error: "Metrik target harus 2–80 karakter." }, { status: 400 });
  if (!Number.isFinite(targetValue) || targetValue <= 0 || targetValue > 1_000_000_000_000) return NextResponse.json({ error: "Nilai target harus lebih dari nol." }, { status: 400 });
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) return NextResponse.json({ error: "Rentang tanggal tidak valid." }, { status: 400 });
  if (!Number.isInteger(activeDays) || activeDays < 1 || activeDays > 31) return NextResponse.json({ error: "Hari aktif harus antara 1–31." }, { status: 400 });
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 1000) : "";
  const data = await prisma.goal.create({ data: { name, metric, targetValue, startDate, endDate, activeDays, status: "ACTIVE", description: description || null } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID target tidak valid." }, { status: 400 });
  const data: Prisma.GoalUpdateInput = {};
  if (body.name !== undefined) {
    if (typeof body.name !== "string" || body.name.trim().length < 3 || body.name.trim().length > 120) return NextResponse.json({ error: "Nama target tidak valid." }, { status: 400 });
    data.name = body.name.trim();
  }
  if (body.metric !== undefined) {
    if (typeof body.metric !== "string" || body.metric.trim().length < 2 || body.metric.trim().length > 80) return NextResponse.json({ error: "Metrik target tidak valid." }, { status: 400 });
    data.metric = body.metric.trim();
  }
  if (body.status !== undefined) {
    if (!["ACTIVE", "PAUSED", "COMPLETED", "CANCELLED"].includes(String(body.status))) return NextResponse.json({ error: "Status target tidak valid." }, { status: 400 });
    data.status = String(body.status);
  }
  if (body.targetValue !== undefined) {
    const value = Number(body.targetValue);
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Nilai target tidak valid." }, { status: 400 });
    data.targetValue = value;
  }
  try {
    const goal = await prisma.goal.update({ where: { id: body.id }, data });
    return NextResponse.json({ data: goal });
  } catch {
    return NextResponse.json({ error: "Target tidak ditemukan." }, { status: 404 });
  }
}
