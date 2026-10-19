import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function parseWeek(value: string | null) {
  const parsed = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date();
  if (Number.isNaN(parsed.getTime())) return parseWeek(null);
  const monday = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const weekday = monday.getDay();
  monday.setDate(monday.getDate() - ((weekday + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const end = new Date(monday); end.setDate(end.getDate() + 7);
  const previousStart = new Date(monday); previousStart.setDate(previousStart.getDate() - 7);
  return { start: monday, end, previousStart, week: dateKey(monday) };
}
const sumAmount = (rows: Array<{ amount: unknown }>) => rows.reduce((sum, row) => sum + Number(row.amount), 0);
const pctChange = (current: number, previous: number) => previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / Math.abs(previous)) * 100;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !["OWNER", "ADMIN", "MANAGER"].includes(session.role)) {
    return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  }
  const params = new URL(request.url).searchParams;
  const { start, end, previousStart, week } = parseWeek(params.get("week"));
  const now = new Date();
  const [transactions, previousTransactions, newLeads, previousLeads, wonLeads, currentPipeline, content, executions, previousExecutions, openActions, overdueProjects, goal] = await Promise.all([
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: start, lt: end } }, select: { type: true, amount: true, category: true, occurredAt: true } }),
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: previousStart, lt: start } }, select: { type: true, amount: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { id: true, name: true, businessName: true, status: true, service: true, estimatedValue: true, createdAt: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: previousStart, lt: start } }, select: { id: true, status: true } }),
    prisma.lead.count({ where: { status: "WON", updatedAt: { gte: start, lt: end } } }),
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] } }, select: { status: true, estimatedValue: true, nextFollowUp: true } }),
    prisma.contentItem.findMany({ where: { OR: [{ publishedAt: { gte: start, lt: end } }, { plannedAt: { gte: start, lt: end } }] }, select: { id: true, title: true, channel: true, status: true, plannedAt: true, publishedAt: true } }),
    prisma.dailyExecution.findMany({ where: { activityDate: { gte: start, lt: end } }, select: { activity: true, category: true, revenueAmount: true, expenseAmount: true, minutesSpent: true, activityDate: true } }),
    prisma.dailyExecution.findMany({ where: { activityDate: { gte: previousStart, lt: start } }, select: { revenueAmount: true, expenseAmount: true, minutesSpent: true } }),
    prisma.actionItem.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, select: { id: true, title: true, priority: true, dueAt: true, status: true }, orderBy: [{ priority: "desc" }, { dueAt: "asc" }], take: 100 }),
    prisma.project.findMany({ where: { dueDate: { lt: now }, status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] } }, select: { id: true, name: true, dueDate: true, status: true }, orderBy: { dueDate: "asc" }, take: 20 }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: end }, endDate: { gte: start } }, orderBy: { updatedAt: "desc" } }),
  ]);

  const income = sumAmount(transactions.filter(t => t.type.toUpperCase() === "INCOME"));
  const expenses = sumAmount(transactions.filter(t => t.type.toUpperCase() === "EXPENSE"));
  const previousIncome = sumAmount(previousTransactions.filter(t => t.type.toUpperCase() === "INCOME"));
  const previousExpenses = sumAmount(previousTransactions.filter(t => t.type.toUpperCase() === "EXPENSE"));
  const previousExecutionRevenue = previousExecutions.reduce((s, e) => s + Number(e.revenueAmount), 0);
  const executionRevenue = executions.reduce((s, e) => s + Number(e.revenueAmount), 0);
  const executionExpenses = executions.reduce((s, e) => s + Number(e.expenseAmount), 0);
  const minutes = executions.reduce((s, e) => s + e.minutesSpent, 0);
  const previousMinutes = previousExecutions.reduce((s, e) => s + e.minutesSpent, 0);
  const activeDates = new Set(executions.map(e => dateKey(e.activityDate)));
  const previousLeadCount = previousLeads.length;
  const monthlyTarget = goal ? Number(goal.targetValue) : 5200000;
  const activeDaysTarget = goal?.activeDays || 26;
  const weeklyTarget = monthlyTarget / (30.4375 / 7);
  const pipelineValue = currentPipeline.reduce((s, lead) => s + Number(lead.estimatedValue || 0), 0);
  const statusCounts = currentPipeline.reduce<Record<string, number>>((acc, lead) => { acc[lead.status] = (acc[lead.status] || 0) + 1; return acc; }, {});
  const publishedContent = content.filter(c => c.publishedAt && c.publishedAt >= start && c.publishedAt < end);
  const plannedNotPublished = content.filter(c => c.plannedAt && c.plannedAt >= start && c.plannedAt < end && !c.publishedAt);
  const overdueActions = openActions.filter(a => a.dueAt && a.dueAt < now);
  const recommendations: Array<{ priority: "URGENT" | "HIGH" | "MEDIUM"; title: string; reason: string; action: string; href: string }> = [];
  if (income < weeklyTarget) recommendations.push({ priority: income === 0 ? "URGENT" : "HIGH", title: "Tutup gap pemasukan minggu ini", reason: `Pemasukan tercatat ${Math.round(income / Math.max(1, weeklyTarget) * 100)}% dari pace target mingguan ${Math.round(weeklyTarget).toLocaleString("id-ID")}.`, action: "Prioritaskan follow-up prospek hangat, penawaran dengan nilai jelas, dan minta keputusan pada proposal yang tertunda.", href: "/leads" });
  if (currentPipeline.length > 0 && currentPipeline.filter(l => !l.nextFollowUp || l.nextFollowUp <= now).length > 0) recommendations.push({ priority: "HIGH", title: "Jalankan follow-up CRM", reason: `${currentPipeline.filter(l => !l.nextFollowUp || l.nextFollowUp <= now).length} prospek aktif belum memiliki jadwal follow-up berikutnya atau sudah jatuh tempo.`, action: "Tentukan langkah berikutnya dan tanggal follow-up untuk setiap prospek aktif.", href: "/leads" });
  if (plannedNotPublished.length > 0) recommendations.push({ priority: "MEDIUM", title: "Selesaikan konten yang tertunda", reason: `${plannedNotPublished.length} konten terjadwal pada minggu ini belum memiliki tanggal publikasi.`, action: "Publikasikan atau jadwalkan ulang konten; prioritaskan konten portofolio, studi kasus, dan CTA layanan.", href: "/content" });
  if (overdueActions.length > 0) recommendations.push({ priority: "HIGH", title: "Bersihkan tindakan yang terlambat", reason: `${overdueActions.length} tindakan terbuka sudah melewati tenggat.`, action: "Selesaikan, jadwalkan ulang, atau tandai tidak relevan agar Action Center tetap dapat dipercaya.", href: "/actions" });
  if (overdueProjects.length > 0) recommendations.push({ priority: "HIGH", title: "Pulihkan proyek yang melewati tenggat", reason: `${overdueProjects.length} proyek aktif sudah melewati tanggal jatuh tempo.`, action: "Perbarui estimasi penyelesaian dan sampaikan status kepada pelanggan.", href: "/projects" });
  if (minutes === 0) recommendations.push({ priority: "MEDIUM", title: "Catat eksekusi, bukan hanya hasil", reason: "Belum ada durasi atau aktivitas yang tercatat pada tracker minggu ini.", action: "Catat aktivitas penjualan, produksi, konten, dan administrasi setiap hari agar evaluasi didukung data.", href: "/execution" });
  if (recommendations.length === 0) recommendations.push({ priority: "MEDIUM", title: "Pertahankan ritme dan evaluasi kualitas", reason: "Tidak ada sinyal risiko utama yang terdeteksi dari data yang tersedia.", action: "Tinjau sumber prospek dan jenis layanan yang paling menghasilkan, lalu gandakan aktivitas yang terbukti efektif.", href: "/analytics" });
  const priorityRank: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2 };
  recommendations.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

  const daily = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start); date.setDate(start.getDate() + index);
    const entries = executions.filter(e => dateKey(e.activityDate) === dateKey(date));
    const dayTransactions = transactions.filter(t => dateKey(t.occurredAt) === dateKey(date));
    return { date: dateKey(date), label: date.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit" }), revenue: sumAmount(dayTransactions.filter(t => t.type.toUpperCase() === "INCOME")), expenses: sumAmount(dayTransactions.filter(t => t.type.toUpperCase() === "EXPENSE")), activities: entries.length, minutes: entries.reduce((s,e) => s + e.minutesSpent, 0) };
  });
  const categoryRevenue = transactions.filter(t => t.type.toUpperCase() === "INCOME").reduce<Record<string, number>>((acc, t) => { acc[t.category] = (acc[t.category] || 0) + Number(t.amount); return acc; }, {});
  const topCategories = Object.entries(categoryRevenue).map(([category, amount]) => ({ category, amount })).sort((a,b) => b.amount-a.amount).slice(0, 5);
  return NextResponse.json({
    period: { week, start: dateKey(start), end: dateKey(new Date(end.getTime() - 86400000)), previousStart: dateKey(previousStart), previousEnd: dateKey(new Date(start.getTime() - 86400000)) },
    summary: {
      income, expenses, net: income - expenses, previousIncome, previousExpenses,
      incomeChange: pctChange(income, previousIncome), expenseChange: pctChange(expenses, previousExpenses),
      weeklyTarget, targetProgress: weeklyTarget > 0 ? Math.min(100, income / weeklyTarget * 100) : 0,
      leadCount: newLeads.length, previousLeadCount, wonLeads,
      pipelineCount: currentPipeline.length, pipelineValue, statusCounts,
      contentPublished: publishedContent.length, contentPlanned: content.filter(c => c.plannedAt && c.plannedAt >= start && c.plannedAt < end).length,
      executionCount: executions.length, activeDays: activeDates.size, minutes, previousMinutes,
      executionRevenue, executionExpenses, overdueActions: overdueActions.length, overdueProjects: overdueProjects.length,
    },
    daily, recommendations,
    newLeads: newLeads.map(l => ({ ...l, estimatedValue: l.estimatedValue ? Number(l.estimatedValue) : null })),
    content: content.map(c => ({ ...c, plannedAt: c.plannedAt?.toISOString() || null, publishedAt: c.publishedAt?.toISOString() || null })),
    overdueActions: overdueActions.slice(0, 8).map(a => ({ ...a, dueAt: a.dueAt?.toISOString() || null })),
    overdueProjects: overdueProjects.map(p => ({ ...p, dueDate: p.dueDate?.toISOString() || null })),
    topCategories,
  });
}
