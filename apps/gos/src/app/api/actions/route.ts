import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const statuses = ["OPEN", "IN_PROGRESS", "DONE", "IGNORED"] as const;
const categories = ["GENERAL", "SALES", "COLLECTION", "PROJECT", "REVENUE", "OPERATIONS"] as const;

async function authorized() {
  const session = await getSession();
  return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date();
  const [data, totalOpen, overdue, completed] = await Promise.all([
    prisma.actionItem.findMany({ orderBy: [{ status: "asc" }, { priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }], take: 300 }),
    prisma.actionItem.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    prisma.actionItem.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, dueAt: { lt: now } } }),
    prisma.actionItem.count({ where: { status: "DONE" } }),
  ]);
  return NextResponse.json({ data, summary: { totalOpen, overdue, completed } });
}

export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (body?.action === "generate") {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [leads, orders, projects, reminders, goal, incomeRows] = await Promise.all([
      prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, OR: [{ nextFollowUp: null }, { nextFollowUp: { lte: now } }] }, orderBy: [{ nextFollowUp: "asc" }, { createdAt: "asc" }], take: 40 }),
      prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, include: { payments: { select: { amount: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], take: 100 }),
      prisma.project.findMany({ where: { status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] }, dueDate: { lt: now } }, orderBy: { dueDate: "asc" }, take: 30 }),
      prisma.reminder.findMany({ where: { status: "OPEN", dueAt: { lt: now } }, orderBy: { dueAt: "asc" }, take: 30 }),
      prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
      prisma.financialTransaction.findMany({ where: { type: "INCOME", occurredAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
    ]);
    const candidates: Array<{ title: string; description: string; category: string; priority: string; status: string; dueAt: Date | null; sourceKey: string; sourceUrl: string | null; updatedAt: Date }> = [];
    for (const lead of leads) candidates.push({ title: `Follow-up prospek: ${lead.businessName || lead.name}`, description: `Hubungi ${lead.name} (${lead.contact}) terkait ${lead.service}. Status CRM: ${lead.status}. ${lead.message.slice(0, 240)}`, category: "SALES", priority: lead.nextFollowUp && lead.nextFollowUp < now ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: lead.nextFollowUp || now, sourceKey: `lead-followup-${lead.id}`, sourceUrl: "/leads", updatedAt: now });
    for (const order of orders) {
      const paid = order.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const balance = Number(order.amount) - paid;
      if (balance <= 0.005) continue;
      if (order.dueDate && order.dueDate > now) continue;
      candidates.push({ title: `Tagih piutang: ${order.customerName}`, description: `Order “${order.title}” memiliki sisa tagihan ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(balance)}. Hubungi pelanggan dan catat pembayaran melalui menu Customers & Payments.`, category: "COLLECTION", priority: order.dueDate && order.dueDate < now ? "URGENT" : "HIGH", status: "OPEN", dueAt: order.dueDate || now, sourceKey: `receivable-${order.id}`, sourceUrl: "/customers", updatedAt: now });
    }
    for (const project of projects) candidates.push({ title: `Evaluasi proyek terlambat: ${project.name}`, description: `Tenggat proyek sudah lewat (${project.dueDate ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(project.dueDate) : "tanpa tanggal"}). Perbarui progres, kendala, dan tanggal penyelesaian.`, category: "PROJECT", priority: "HIGH", status: "OPEN", dueAt: project.dueDate, sourceKey: `project-overdue-${project.id}`, sourceUrl: "/projects", updatedAt: now });
    for (const reminder of reminders) candidates.push({ title: `Selesaikan pengingat: ${reminder.title}`, description: reminder.description || "Pengingat sudah melewati tenggat. Selesaikan atau perbarui jadwalnya.", category: "OPERATIONS", priority: reminder.priority === "HIGH" ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: reminder.dueAt, sourceKey: `reminder-${reminder.id}`, sourceUrl: "/reminders", updatedAt: now });
    if (goal) {
      const actual = incomeRows.reduce((sum, row) => sum + Number(row.amount), 0);
      const target = Number(goal.targetValue);
      if (target > actual) candidates.push({ title: "Kejar target pemasukan bulan ini", description: `Target “${goal.name}” ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(target)}; pemasukan tercatat ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(actual)}. Selisih ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(target - actual)}. Prioritaskan penawaran, follow-up, dan penagihan.`, category: "REVENUE", priority: target - actual > target * 0.5 ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: nextMonth, sourceKey: `revenue-target-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, sourceUrl: "/revenue", updatedAt: now });
    }
    const result = candidates.length ? await prisma.actionItem.createMany({ data: candidates, skipDuplicates: true }) : { count: 0 };
    return NextResponse.json({ ok: true, generated: result.count, candidates: candidates.length, message: result.count ? `${result.count} tindakan baru dibuat.` : "Tidak ada tindakan baru. Tindakan terkait mungkin sudah pernah dibuat." });
  }
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim().slice(0, 1500) : "";
  const category = typeof body?.category === "string" ? body.category : "GENERAL";
  const priority = typeof body?.priority === "string" ? body.priority : "MEDIUM";
  const dueAt = body?.dueAt ? new Date(String(body.dueAt)) : null;
  if (title.length < 3 || title.length > 180) return NextResponse.json({ error: "Judul tindakan harus 3–180 karakter." }, { status: 400 });
  if (!(categories as readonly string[]).includes(category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  if (!(priorities as readonly string[]).includes(priority)) return NextResponse.json({ error: "Prioritas tidak valid." }, { status: 400 });
  if (body?.dueAt && (!dueAt || Number.isNaN(dueAt.getTime()))) return NextResponse.json({ error: "Tanggal tenggat tidak valid." }, { status: 400 });
  const data = await prisma.actionItem.create({ data: { title, description: description || null, category, priority, dueAt } });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID tindakan tidak valid." }, { status: 400 });
  const data: { title?: string; description?: string | null; category?: string; priority?: string; status?: string; dueAt?: Date | null; completedAt?: Date | null } = {};
  if (body.title !== undefined) { if (typeof body.title !== "string" || body.title.trim().length < 3 || body.title.trim().length > 180) return NextResponse.json({ error: "Judul tidak valid." }, { status: 400 }); data.title = body.title.trim(); }
  if (body.description !== undefined) data.description = typeof body.description === "string" && body.description.trim() ? body.description.trim().slice(0, 1500) : null;
  if (body.category !== undefined) { if (typeof body.category !== "string" || !(categories as readonly string[]).includes(body.category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 }); data.category = body.category; }
  if (body.priority !== undefined) { if (typeof body.priority !== "string" || !(priorities as readonly string[]).includes(body.priority)) return NextResponse.json({ error: "Prioritas tidak valid." }, { status: 400 }); data.priority = body.priority; }
  if (body.status !== undefined) { if (typeof body.status !== "string" || !(statuses as readonly string[]).includes(body.status)) return NextResponse.json({ error: "Status tidak valid." }, { status: 400 }); data.status = body.status; data.completedAt = body.status === "DONE" ? new Date() : null; }
  if (body.dueAt !== undefined) { if (body.dueAt === null || body.dueAt === "") data.dueAt = null; else { const date = new Date(String(body.dueAt)); if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Tanggal tenggat tidak valid." }, { status: 400 }); data.dueAt = date; } }
  try { const result = await prisma.actionItem.update({ where: { id: body.id }, data }); return NextResponse.json({ data: result }); }
  catch { return NextResponse.json({ error: "Tindakan tidak ditemukan." }, { status: 404 }); }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID tindakan wajib diisi." }, { status: 400 });
  try { await prisma.actionItem.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Tindakan tidak ditemukan." }, { status: 404 }); }
}
