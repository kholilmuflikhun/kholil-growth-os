import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const cadences = ["MONTHLY", "QUARTERLY", "YEARLY", "ONE_TIME"] as const;
const statuses = ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"] as const;
async function authorized() {
  const session = await getSession();
  return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
}
function dateValue(value: unknown) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date();
  const soon = new Date(now); soon.setDate(soon.getDate() + 30);
  const [plans, customers] = await Promise.all([
    prisma.customerCarePlan.findMany({ include: { customer: { select: { id: true, name: true, businessName: true, email: true, phone: true } } }, orderBy: [{ status: "asc" }, { nextContactAt: "asc" }, { nextRenewalAt: "asc" }], take: 1000 }),
    prisma.customer.findMany({ select: { id: true, name: true, businessName: true, email: true, phone: true }, orderBy: { name: "asc" }, take: 1000 }),
  ]);
  const active = plans.filter(p => p.status === "ACTIVE");
  const normalize = (p: typeof plans[number]) => ({
    ...p, amount: Number(p.amount),
    customer: p.customer,
    dueContact: p.status === "ACTIVE" && (!p.nextContactAt || p.nextContactAt <= now),
    dueRenewal: p.status === "ACTIVE" && Boolean(p.nextRenewalAt && p.nextRenewalAt <= soon),
    overdueRenewal: p.status === "ACTIVE" && Boolean(p.nextRenewalAt && p.nextRenewalAt < now),
  });
  const data = plans.map(normalize);
  const mrr = active.reduce((sum,p) => sum + Number(p.amount) / (p.cadence === "YEARLY" ? 12 : p.cadence === "QUARTERLY" ? 3 : p.cadence === "ONE_TIME" ? 0 : 1), 0);
  return NextResponse.json({
    data, customers,
    summary: {
      activePlans: active.length, totalPlans: plans.length, mrrEstimate: mrr, arrEstimate: mrr * 12,
      contactDue: data.filter(p => p.dueContact).length,
      renewalSoon: data.filter(p => p.dueRenewal).length,
      overdueRenewal: data.filter(p => p.overdueRenewal).length,
      upcoming: data.filter(p => p.status === "ACTIVE" && ((p.nextContactAt && p.nextContactAt <= soon) || (p.nextRenewalAt && p.nextRenewalAt <= soon))).length,
    },
  });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const customerId = typeof body?.customerId === "string" ? body.customerId : "";
  const serviceName = typeof body?.serviceName === "string" ? body.serviceName.trim() : "";
  const amount = Number(body?.amount);
  const cadence = typeof body?.cadence === "string" ? body.cadence : "MONTHLY";
  const startAt = body?.startAt ? dateValue(body.startAt) : new Date();
  const nextRenewalAt = dateValue(body?.nextRenewalAt);
  const nextContactAt = dateValue(body?.nextContactAt);
  const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 3000) : "";
  if (!customerId) return NextResponse.json({ error: "Pelanggan wajib dipilih." }, { status: 400 });
  if (serviceName.length < 2 || serviceName.length > 160) return NextResponse.json({ error: "Nama layanan harus 2–160 karakter." }, { status: 400 });
  if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999) return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
  if (!(cadences as readonly string[]).includes(cadence)) return NextResponse.json({ error: "Periode layanan tidak valid." }, { status: 400 });
  if (!startAt || nextRenewalAt === undefined || nextContactAt === undefined) return NextResponse.json({ error: "Format tanggal tidak valid." }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } });
  if (!customer) return NextResponse.json({ error: "Pelanggan tidak ditemukan." }, { status: 404 });
  const data = await prisma.customerCarePlan.create({ data: { customerId, serviceName, amount, cadence, startAt, nextRenewalAt, nextContactAt, notes: notes || null } });
  return NextResponse.json({ data: { ...data, amount: Number(data.amount) } }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID layanan pelanggan wajib diisi." }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.serviceName !== undefined) {
    if (typeof body.serviceName !== "string" || body.serviceName.trim().length < 2 || body.serviceName.trim().length > 160) return NextResponse.json({ error: "Nama layanan tidak valid." }, { status: 400 });
    data.serviceName = body.serviceName.trim();
  }
  if (body.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 999999999999) return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
    data.amount = amount;
  }
  if (body.cadence !== undefined) {
    if (typeof body.cadence !== "string" || !(cadences as readonly string[]).includes(body.cadence)) return NextResponse.json({ error: "Periode layanan tidak valid." }, { status: 400 });
    data.cadence = body.cadence;
  }
  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !(statuses as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 });
    data.status = body.status;
  }
  for (const field of ["startAt", "nextRenewalAt", "lastContactAt", "nextContactAt"] as const) {
    if (body[field] !== undefined) {
      const value = body[field] === null || body[field] === "" ? null : dateValue(body[field]);
      if (value === undefined) return NextResponse.json({ error: `Tanggal ${field} tidak valid.` }, { status: 400 });
      data[field] = value;
    }
  }
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 3000) || null : null;
  try {
    const updated = await prisma.customerCarePlan.update({ where: { id: body.id }, data: data as never });
    return NextResponse.json({ data: { ...updated, amount: Number(updated.amount) } });
  } catch { return NextResponse.json({ error: "Data layanan pelanggan tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  try { await prisma.customerCarePlan.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Data tidak ditemukan." }, { status: 404 }); }
}
