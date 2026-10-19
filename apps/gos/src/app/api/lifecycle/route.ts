import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const stages = ["IDEA", "CONTACTED", "PROPOSED", "WON", "LOST"] as const;
const priorities = ["LOW", "MEDIUM", "HIGH"] as const;
async function authorized() { const session = await getSession(); return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role)); }
function parseDate(value: unknown) { if (typeof value !== "string" || !value) return null; const d = new Date(value); return Number.isNaN(d.getTime()) ? undefined : d; }
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date(); const dormantBefore = new Date(now); dormantBefore.setDate(dormantBefore.getDate() - 90);
  const [customers, opportunities] = await Promise.all([
    prisma.customer.findMany({ include: { orders: { select: { id: true, title: true, amount: true, createdAt: true, status: true } }, payments: { select: { amount: true, paidAt: true } }, carePlans: { select: { id: true, serviceName: true, status: true, amount: true, nextRenewalAt: true, nextContactAt: true } } }, orderBy: { updatedAt: "desc" }, take: 1000 }),
    prisma.clientOpportunity.findMany({ include: { customer: { select: { id: true, name: true, businessName: true, phone: true, email: true } } }, orderBy: [{ stage: "asc" }, { nextFollowUpAt: "asc" }, { createdAt: "desc" }], take: 1000 }),
  ]);
  const customerData = customers.map(c => {
    const lastOrderAt = c.orders.reduce<Date | null>((latest, o) => !latest || o.createdAt > latest ? o.createdAt : latest, null);
    const lifetimePaid = c.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const activePlans = c.carePlans.filter(p => p.status === "ACTIVE");
    const flags: string[] = [];
    if (c.orders.length > 0 && activePlans.length === 0) flags.push("UPSELL_RETAINER");
    if (lastOrderAt && lastOrderAt < dormantBefore) flags.push("DORMANT");
    if (activePlans.some(p => p.nextRenewalAt && p.nextRenewalAt <= new Date(now.getTime() + 30 * 86400000))) flags.push("RENEWAL_SOON");
    if (activePlans.some(p => !p.nextContactAt || p.nextContactAt <= now)) flags.push("FOLLOW_UP");
    if (lifetimePaid >= 5000000) flags.push("HIGH_VALUE");
    return { id: c.id, name: c.name, businessName: c.businessName, email: c.email, phone: c.phone, orderCount: c.orders.length, activePlans: activePlans.length, lifetimePaid, lastOrderAt, flags, suggestedService: flags.includes("RENEWAL_SOON") ? "Perpanjangan layanan" : flags.includes("UPSELL_RETAINER") ? "Paket layanan bulanan / retainer" : flags.includes("DORMANT") ? "Paket reaktivasi pelanggan" : flags.includes("HIGH_VALUE") ? "Layanan pendamping / paket premium" : "Paket desain atau konten tambahan" };
  });
  const open = opportunities.filter(o => !["WON", "LOST"].includes(o.stage));
  return NextResponse.json({ customers: customerData, opportunities: opportunities.map(o => ({ ...o, estimatedValue: Number(o.estimatedValue) })), summary: { customers: customers.length, activeCustomers: customerData.filter(c => c.orderCount > 0).length, suggestedCustomers: customerData.filter(c => c.flags.length > 0).length, pipelineValue: open.reduce((s, o) => s + Number(o.estimatedValue), 0), dueFollowUps: opportunities.filter(o => !["WON", "LOST"].includes(o.stage) && o.nextFollowUpAt && o.nextFollowUpAt <= now).length, wonValue: opportunities.filter(o => o.stage === "WON").reduce((s, o) => s + Number(o.estimatedValue), 0) } });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const customerId = typeof body?.customerId === "string" ? body.customerId : "";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const serviceSuggested = typeof body?.serviceSuggested === "string" ? body.serviceSuggested.trim() : "";
  const estimatedValue = Number(body?.estimatedValue ?? 0); const priority = typeof body?.priority === "string" ? body.priority : "MEDIUM";
  const nextFollowUpAt = parseDate(body?.nextFollowUpAt); const notes = typeof body?.notes === "string" ? body.notes.trim().slice(0, 3000) : "";
  if (!customerId || title.length < 2 || title.length > 160 || serviceSuggested.length < 2 || serviceSuggested.length > 160) return NextResponse.json({ error: "Pelanggan, judul, dan layanan yang disarankan wajib diisi (2–160 karakter)." }, { status: 400 });
  if (!Number.isFinite(estimatedValue) || estimatedValue < 0 || estimatedValue > 999999999999) return NextResponse.json({ error: "Nilai peluang tidak valid." }, { status: 400 });
  if (!(priorities as readonly string[]).includes(priority) || nextFollowUpAt === undefined) return NextResponse.json({ error: "Prioritas atau tanggal tindak lanjut tidak valid." }, { status: 400 });
  const customer = await prisma.customer.findUnique({ where: { id: customerId }, select: { id: true } }); if (!customer) return NextResponse.json({ error: "Pelanggan tidak ditemukan." }, { status: 404 });
  const data = await prisma.clientOpportunity.create({ data: { customerId, title, serviceSuggested, estimatedValue, priority: priority as typeof priorities[number], nextFollowUpAt, notes: notes || null } });
  return NextResponse.json({ data: { ...data, estimatedValue: Number(data.estimatedValue) } }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID peluang wajib diisi." }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.stage !== undefined) { if (typeof body.stage !== "string" || !(stages as readonly string[]).includes(body.stage)) return NextResponse.json({ error: "Tahap peluang tidak valid." }, { status: 400 }); data.stage = body.stage; }
  if (body.priority !== undefined) { if (typeof body.priority !== "string" || !(priorities as readonly string[]).includes(body.priority)) return NextResponse.json({ error: "Prioritas tidak valid." }, { status: 400 }); data.priority = body.priority; }
  if (body.nextFollowUpAt !== undefined) { const d = body.nextFollowUpAt === null || body.nextFollowUpAt === "" ? null : parseDate(body.nextFollowUpAt); if (d === undefined) return NextResponse.json({ error: "Tanggal tindak lanjut tidak valid." }, { status: 400 }); data.nextFollowUpAt = d; }
  if (body.notes !== undefined) data.notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 3000) || null : null;
  try { const updated = await prisma.clientOpportunity.update({ where: { id: body.id }, data: data as never }); return NextResponse.json({ data: { ...updated, estimatedValue: Number(updated.estimatedValue) } }); } catch { return NextResponse.json({ error: "Peluang tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id"); if (!id) return NextResponse.json({ error: "ID wajib diisi." }, { status: 400 });
  try { await prisma.clientOpportunity.delete({ where: { id } }); return NextResponse.json({ ok: true }); } catch { return NextResponse.json({ error: "Peluang tidak ditemukan." }, { status: 404 }); }
}
