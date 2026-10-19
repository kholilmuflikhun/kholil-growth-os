import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function authorized() {
  const session = await getSession();
  return session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const rows = await prisma.financialTransaction.findMany({ include: { project: { select: { id: true, name: true } } }, orderBy: { occurredAt: "desc" }, take: 500 });
  return NextResponse.json({ data: rows });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || !["INCOME", "EXPENSE"].includes(String(body.type))) return NextResponse.json({ error: "Jenis transaksi tidak valid." }, { status: 400 });
  const type = String(body.type);
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const classification = typeof body.classification === "string" ? body.classification : (type === "INCOME" ? "OTHER_INCOME" : "OPERATING_EXPENSE");
  const allowedClassifications = type === "INCOME" ? ["OTHER_INCOME"] : ["DIRECT_COST", "OPERATING_EXPENSE", "OWNER_WITHDRAWAL", "TAX", "LOAN_PRINCIPAL", "ASSET_PURCHASE", "REFUND"];
  const amount = Number(body.amount);
  const occurredAt = new Date(String(body.occurredAt || ""));
  if (!allowedClassifications.includes(classification)) return NextResponse.json({ error: "Klasifikasi tidak sesuai dengan jenis transaksi. Pembayaran order harus dicatat melalui modul pembayaran." }, { status: 400 });
  if (category.length < 2 || category.length > 100) return NextResponse.json({ error: "Kategori wajib diisi (2–100 karakter)." }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000_000) return NextResponse.json({ error: "Nominal harus lebih dari nol." }, { status: 400 });
  if (Number.isNaN(occurredAt.getTime())) return NextResponse.json({ error: "Tanggal transaksi tidak valid." }, { status: 400 });
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";
  const reference = typeof body.reference === "string" ? body.reference.trim().slice(0, 120) : "";
  const projectId = typeof body.projectId === "string" && body.projectId ? body.projectId : null;
  if (projectId) {
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Proyek terkait tidak ditemukan." }, { status: 400 });
  }
  const row = await prisma.financialTransaction.create({
    data: { type, category, classification, amount, occurredAt, notes: notes || null, reference: reference || null, projectId },
    include: { project: { select: { id: true, name: true } } },
  });
  return NextResponse.json({ data: row }, { status: 201 });
}
