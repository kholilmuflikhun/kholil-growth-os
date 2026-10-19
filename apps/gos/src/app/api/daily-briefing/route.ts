import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
async function authorized() {
  const session = await getSession();
  return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
}
export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [incomeTodayRows, incomeMonthRows, expenseMonthRows, goal, leads, orders, projects, reminders, actions, content, carePlans, executions] = await Promise.all([
    prisma.financialTransaction.findMany({ where: { type: "INCOME", occurredAt: { gte: todayStart, lt: tomorrow } }, select: { amount: true } }),
    prisma.financialTransaction.findMany({ where: { type: "INCOME", occurredAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
    prisma.financialTransaction.findMany({ where: { type: "EXPENSE", occurredAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, OR: [{ nextFollowUp: null }, { nextFollowUp: { lte: tomorrow } }] }, orderBy: [{ nextFollowUp: "asc" }, { createdAt: "asc" }], take: 10, select: { id: true, name: true, businessName: true, service: true, estimatedValue: true, nextFollowUp: true, status: true } }),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, include: { payments: { select: { amount: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }], take: 100 }),
    prisma.project.findMany({ where: { status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] }, dueDate: { lt: tomorrow } }, orderBy: { dueDate: "asc" }, take: 10, select: { id: true, name: true, dueDate: true, status: true } }),
    prisma.reminder.findMany({ where: { status: "OPEN", dueAt: { lt: tomorrow } }, orderBy: { dueAt: "asc" }, take: 10, select: { id: true, title: true, description: true, dueAt: true, priority: true } }),
    prisma.actionItem.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, OR: [{ dueAt: null }, { dueAt: { lt: tomorrow } }] }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }], take: 15, select: { id: true, title: true, priority: true, dueAt: true, status: true, sourceUrl: true } }),
    prisma.contentItem.findMany({ where: { plannedAt: { gte: todayStart, lt: tomorrow }, publishedAt: null }, orderBy: { plannedAt: "asc" }, take: 10, select: { id: true, title: true, channel: true, plannedAt: true } }),
    prisma.customerCarePlan.findMany({ where: { status: "ACTIVE", OR: [{ nextContactAt: { lte: tomorrow } }, { nextRenewalAt: { lte: new Date(now.getTime() + 30 * 86400000) } }] }, include: { customer: { select: { name: true, businessName: true } } }, orderBy: [{ nextContactAt: "asc" }, { nextRenewalAt: "asc" }], take: 15 }),
    prisma.dailyExecution.findMany({ where: { activityDate: { gte: todayStart, lt: tomorrow } }, select: { minutesSpent: true, activity: true } }),
  ]);
  const incomeToday = incomeTodayRows.reduce((s, r) => s + Number(r.amount), 0);
  const incomeMonth = incomeMonthRows.reduce((s, r) => s + Number(r.amount), 0);
  const expensesMonth = expenseMonthRows.reduce((s, r) => s + Number(r.amount), 0);
  const monthlyTarget = goal ? Number(goal.targetValue) : 5200000;
  const dailyTarget = monthlyTarget / (goal?.activeDays || 26);
  const receivables = orders.map(o => ({ id: o.id, customerName: o.customerName, title: o.title, dueDate: o.dueDate, balance: Math.max(0, Number(o.amount) - o.payments.reduce((s, p) => s + Number(p.amount), 0)) })).filter(o => o.balance > 0.005 && (!o.dueDate || o.dueDate < tomorrow)).slice(0, 10);
  const recommendations: Array<{ priority: string; title: string; reason: string; action: string; href: string }> = [];
  if (incomeToday < dailyTarget) recommendations.push({ priority: incomeToday === 0 ? "HIGH" : "MEDIUM", title: "Kejar target pemasukan hari ini", reason: `Pemasukan hari ini ${money(incomeToday)} dari target pace ${money(dailyTarget)}.`, action: "Hubungi prospek terhangat, kirim penawaran yang relevan, dan minta keputusan dengan langkah berikutnya yang jelas.", href: "/leads" });
  if (leads.length) recommendations.push({ priority: "HIGH", title: "Lakukan follow-up prospek", reason: `${leads.length} prospek belum memiliki jadwal lanjutan atau perlu ditindaklanjuti hari ini.`, action: "Mulai dari prospek dengan nilai terbesar dan catat hasil kontak di CRM.", href: "/leads" });
  if (receivables.length) recommendations.push({ priority: "HIGH", title: "Tindak lanjuti piutang", reason: `${receivables.length} order memiliki saldo yang belum lunas dan perlu ditinjau.`, action: "Konfirmasi pembayaran dengan sopan dan catat pembayaran yang benar-benar diterima.", href: "/customers" });
  if (projects.length) recommendations.push({ priority: "HIGH", title: "Jaga komitmen penyelesaian proyek", reason: `${projects.length} proyek aktif mencapai atau melewati tenggat.`, action: "Periksa status, selesaikan pekerjaan kritis, atau komunikasikan revisi jadwal kepada pelanggan.", href: "/projects" });
  if (carePlans.length) recommendations.push({ priority: "MEDIUM", title: "Jaga pelanggan dan perpanjangan layanan", reason: `${carePlans.length} layanan berulang memiliki follow-up atau pembaruan yang mendekat.`, action: "Hubungi pelanggan sebelum masa layanan berakhir dan tawarkan kelanjutan yang sesuai.", href: "/retention" });
  if (content.length) recommendations.push({ priority: "MEDIUM", title: "Terbitkan konten terjadwal", reason: `${content.length} konten dijadwalkan hari ini belum tercatat dipublikasikan.`, action: "Publikasikan atau jadwalkan ulang, lalu catat status sebenarnya.", href: "/content" });
  if (!recommendations.length) recommendations.push({ priority: "MEDIUM", title: "Bangun aktivitas yang menghasilkan", reason: "Tidak ada risiko mendesak yang terdeteksi dari data yang tersedia.", action: "Pilih satu aktivitas penjualan, satu aktivitas produksi, dan satu aktivitas membangun kepercayaan melalui konten.", href: "/execution" });
  return NextResponse.json({ date: todayStart.toISOString(), summary: { incomeToday, dailyTarget, targetProgress: dailyTarget > 0 ? Math.min(100, incomeToday / dailyTarget * 100) : 0, incomeMonth, expensesMonth, netMonth: incomeMonth - expensesMonth, monthlyTarget, monthlyProgress: monthlyTarget > 0 ? Math.min(100, incomeMonth / monthlyTarget * 100) : 0, openLeads: leads.length, receivables: receivables.reduce((s, r) => s + r.balance, 0), overdueProjects: projects.length, dueCarePlans: carePlans.length, actionsDue: actions.length, executionMinutes: executions.reduce((s, e) => s + e.minutesSpent, 0) }, recommendations, leads: leads.map(l => ({ ...l, estimatedValue: l.estimatedValue == null ? null : Number(l.estimatedValue), nextFollowUp: l.nextFollowUp?.toISOString() || null })), receivables: receivables.map(r => ({ ...r, dueDate: r.dueDate?.toISOString() || null })), projects: projects.map(p => ({ ...p, dueDate: p.dueDate?.toISOString() || null })), reminders: reminders.map(r => ({ ...r, dueAt: r.dueAt.toISOString() })), actions: actions.map(a => ({ ...a, dueAt: a.dueAt?.toISOString() || null })), content: content.map(c => ({ ...c, plannedAt: c.plannedAt?.toISOString() || null })), carePlans: carePlans.map(p => ({ id: p.id, customer: p.customer, serviceName: p.serviceName, nextRenewalAt: p.nextRenewalAt?.toISOString() || null, nextContactAt: p.nextContactAt?.toISOString() || null, amount: Number(p.amount) })) });
}
export async function POST() {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const now = new Date(); const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()); const tomorrow = new Date(todayStart); tomorrow.setDate(tomorrow.getDate()+1);
  const [leads, orders, projects, reminders, goal, incomeRows] = await Promise.all([
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] }, OR: [{ nextFollowUp: null }, { nextFollowUp: { lte: tomorrow } }] }, take: 30 }),
    prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, include: { payments: { select: { amount: true } } }, take: 100 }),
    prisma.project.findMany({ where: { status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] }, dueDate: { lt: tomorrow } }, take: 20 }),
    prisma.reminder.findMany({ where: { status: "OPEN", dueAt: { lt: tomorrow } }, take: 20 }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
    prisma.financialTransaction.findMany({ where: { type: "INCOME", occurredAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lt: new Date(now.getFullYear(), now.getMonth()+1, 1) } }, select: { amount: true } }),
  ]);
  const candidates: Array<{ title: string; description: string; category: string; priority: string; status: string; dueAt: Date; sourceKey: string; sourceUrl: string }> = [];
  for (const l of leads) candidates.push({ title: `Briefing: follow-up ${l.businessName || l.name}`, description: `Tindak lanjuti ${l.name} terkait ${l.service}. Perbarui status dan jadwal berikutnya di CRM.`, category: "SALES", priority: l.nextFollowUp && l.nextFollowUp < now ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: l.nextFollowUp || todayStart, sourceKey: `daily-brief-lead-${l.id}-${todayStart.toISOString().slice(0,10)}`, sourceUrl: "/leads" });
  for (const o of orders) { const balance = Number(o.amount) - o.payments.reduce((s,p)=>s+Number(p.amount),0); if (balance > 0.005 && (!o.dueDate || o.dueDate < tomorrow)) candidates.push({ title: `Briefing: konfirmasi piutang ${o.customerName}`, description: `Order ${o.title}; saldo belum lunas ${money(balance)}. Verifikasi status dan catat pembayaran jika sudah diterima.`, category: "COLLECTION", priority: "HIGH", status: "OPEN", dueAt: o.dueDate || todayStart, sourceKey: `daily-brief-receivable-${o.id}-${todayStart.toISOString().slice(0,10)}`, sourceUrl: "/customers" }); }
  for (const p of projects) candidates.push({ title: `Briefing: periksa proyek ${p.name}`, description: "Tinjau progres, kendala, dan tanggal penyelesaian; beri kabar kepada pelanggan jika jadwal berubah.", category: "PROJECT", priority: "HIGH", status: "OPEN", dueAt: p.dueDate || todayStart, sourceKey: `daily-brief-project-${p.id}-${todayStart.toISOString().slice(0,10)}`, sourceUrl: "/projects" });
  for (const r of reminders) candidates.push({ title: `Briefing: ${r.title}`, description: r.description || "Tinjau dan selesaikan pengingat ini.", category: "OPERATIONS", priority: r.priority === "HIGH" ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: r.dueAt, sourceKey: `daily-brief-reminder-${r.id}-${todayStart.toISOString().slice(0,10)}`, sourceUrl: "/reminders" });
  if (goal) { const actual = incomeRows.reduce((s,r)=>s+Number(r.amount),0); const target = Number(goal.targetValue); if (actual < target) candidates.push({ title: "Briefing: tutup gap target pendapatan", description: `Target bulan ini ${money(target)}, pemasukan tercatat ${money(actual)}, gap ${money(target-actual)}. Fokus pada penawaran, follow-up, dan penagihan.`, category: "REVENUE", priority: target-actual > target*0.5 ? "HIGH" : "MEDIUM", status: "OPEN", dueAt: todayStart, sourceKey: `daily-brief-target-${now.getFullYear()}-${now.getMonth()+1}-${todayStart.toISOString().slice(0,10)}`, sourceUrl: "/forecast" }); }
  const result = candidates.length ? await prisma.actionItem.createMany({ data: candidates, skipDuplicates: true }) : { count: 0 };
  return NextResponse.json({ ok: true, created: result.count, message: result.count ? `${result.count} tindakan ditambahkan ke Action Center.` : "Tidak ada tindakan baru; tindakan briefing hari ini mungkin sudah dibuat." });
}
