import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const money = (value: unknown) => Number(value ?? 0);
const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const monthLabel = (date: Date) => new Intl.DateTimeFormat("id-ID", { month: "short", year: "2-digit" }).format(date);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });

  const now = new Date();
  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const sixMonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const [transactions, leads, customers, orders, payments, opportunities, carePlans, goal] = await Promise.all([
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: sixMonthsStart, lt: nextMonth } }, select: { type: true, category: true, amount: true, occurredAt: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: sixMonthsStart, lt: nextMonth } }, select: { status: true, createdAt: true, estimatedValue: true } }),
    prisma.customer.findMany({ select: { id: true, name: true, createdAt: true, payments: { select: { amount: true, paidAt: true } }, orders: { select: { id: true, amount: true, createdAt: true, status: true } } } }),
    prisma.order.findMany({ where: { createdAt: { gte: sixMonthsStart, lt: nextMonth } }, select: { amount: true, status: true, createdAt: true } }),
    prisma.payment.findMany({ where: { paidAt: { gte: sixMonthsStart, lt: nextMonth } }, select: { amount: true, paidAt: true } }),
    prisma.clientOpportunity.findMany({ where: { createdAt: { gte: sixMonthsStart, lt: nextMonth } }, select: { stage: true, estimatedValue: true, priority: true, createdAt: true } }),
    prisma.customerCarePlan.findMany({ where: { status: "ACTIVE" }, select: { amount: true, cadence: true } }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" }, select: { targetValue: true, activeDays: true } }),
  ]);

  const trend = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = monthKey(date);
    const rows = transactions.filter((row) => monthKey(row.occurredAt) === key);
    return { month: key, label: monthLabel(date), income: rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + money(r.amount), 0), expense: rows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + money(r.amount), 0) };
  });
  const current = trend[trend.length - 1];
  const previous = trend[trend.length - 2];
  const changePct = previous.income > 0 ? ((current.income - previous.income) / previous.income) * 100 : null;
  const categoryMap = new Map<string, { income: number; expense: number }>();
  for (const row of transactions) {
    const category = row.category || "Tanpa kategori";
    const item = categoryMap.get(category) ?? { income: 0, expense: 0 };
    if (row.type === "INCOME") item.income += money(row.amount);
    if (row.type === "EXPENSE") item.expense += money(row.amount);
    categoryMap.set(category, item);
  }
  const categories = [...categoryMap.entries()].map(([category, values]) => ({ category, ...values, net: values.income - values.expense })).sort((a, b) => b.income + b.expense - (a.income + a.expense)).slice(0, 8);
  const leadStatuses = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"].map((status) => ({ status, count: leads.filter((lead) => lead.status === status).length, estimatedValue: leads.filter((lead) => lead.status === status).reduce((s, lead) => s + money(lead.estimatedValue), 0) }));
  const customerValue = customers.map((customer) => ({ id: customer.id, name: customer.name, paid: customer.payments.reduce((s, payment) => s + money(payment.amount), 0), orders: customer.orders.length, latestOrder: customer.orders.reduce<Date | null>((latest, order) => !latest || order.createdAt > latest ? order.createdAt : latest, null) })).sort((a, b) => b.paid - a.paid).slice(0, 5);
  const mrr = carePlans.reduce((sum, plan) => sum + (plan.cadence === "MONTHLY" ? money(plan.amount) : plan.cadence === "QUARTERLY" ? money(plan.amount) / 3 : plan.cadence === "YEARLY" ? money(plan.amount) / 12 : 0), 0);
  const won = leads.filter((lead) => lead.status === "WON").length;
  const closed = leads.filter((lead) => lead.status === "WON" || lead.status === "LOST").length;
  const target = goal ? money(goal.targetValue) : 5_200_000;
  const insights: { level: "good" | "watch" | "action"; title: string; detail: string }[] = [];
  if (changePct !== null) insights.push(changePct >= 0 ? { level: "good", title: "Pendapatan meningkat", detail: `Pendapatan tercatat ${changePct.toFixed(1)}% dibanding bulan sebelumnya.` } : { level: "action", title: "Pendapatan menurun", detail: `Pendapatan tercatat turun ${Math.abs(changePct).toFixed(1)}%; tinjau sumber transaksi dan aktivitas penjualan.` });
  if (current.income < target) insights.push({ level: "watch", title: "Target bulan ini belum tercapai", detail: `Selisih terhadap target ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(target - current.income)}. Prioritaskan prospek hangat dan follow-up yang jatuh tempo.` });
  if (closed >= 3 && won / closed < 0.3) insights.push({ level: "action", title: "Periksa konversi prospek", detail: "Rasio kemenangan prospek tertutup masih di bawah 30%. Evaluasi kualifikasi, penawaran, harga, dan kecepatan follow-up." });
  if (!insights.length) insights.push({ level: "good", title: "Pertahankan momentum", detail: "Belum ada sinyal peringatan yang kuat dari data tercatat. Lanjutkan pencatatan dan tinjau tren secara berkala." });
  return NextResponse.json({ generatedAt: now.toISOString(), target, activeDays: goal?.activeDays ?? 26, summary: { currentIncome: current.income, currentExpense: current.expense, currentNet: current.income - current.expense, previousIncome: previous.income, changePct, targetProgress: target > 0 ? current.income / target * 100 : 0, mrr, customers: customers.length, activeCustomers: customers.filter((c) => c.orders.some((o) => o.status !== "CANCELLED")).length, orders: orders.length, paidInPeriod: payments.reduce((s, p) => s + money(p.amount), 0), leadWinRate: closed ? won / closed * 100 : null, pipelineValue: opportunities.filter((o) => !["WON", "LOST"].includes(o.stage)).reduce((s, o) => s + money(o.estimatedValue), 0) }, trend, categories, leadStatuses, topCustomers: customerValue, insights });
}
