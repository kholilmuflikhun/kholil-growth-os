import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [dueReminders, leads, incomeRows, expenseRows, goal, publishedContent, overdueFollowUps] = await Promise.all([
    prisma.reminder.findMany({
      where: { status: "OPEN", dueAt: { lt: tomorrow } },
      orderBy: [{ priority: "desc" }, { dueAt: "asc" }],
      take: 50,
    }),
    prisma.lead.findMany({
      where: { status: { notIn: ["WON", "LOST"] } },
      select: { id: true, name: true, businessName: true, service: true, status: true, estimatedValue: true, nextFollowUp: true, createdAt: true },
      orderBy: [{ nextFollowUp: "asc" }, { createdAt: "asc" }],
      take: 100,
    }),
    prisma.financialTransaction.findMany({ where: { type: "INCOME", occurredAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
    prisma.financialTransaction.findMany({ where: { type: "EXPENSE", occurredAt: { gte: monthStart, lt: nextMonth } }, select: { amount: true } }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
    prisma.contentItem.count({ where: { status: "PUBLISHED", publishedAt: { gte: monthStart, lt: nextMonth } } }),
    prisma.lead.count({ where: { status: { notIn: ["WON", "LOST"] }, nextFollowUp: { lt: now } } }),
  ]);

  const income = incomeRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const expense = expenseRows.reduce((sum, row) => sum + Number(row.amount), 0);
  const target = goal ? Number(goal.targetValue) : null;
  const remaining = target === null ? null : Math.max(0, target - income);
  const highValueLeads = [...leads]
    .filter(lead => lead.estimatedValue !== null)
    .sort((a, b) => Number(b.estimatedValue) - Number(a.estimatedValue))
    .slice(0, 5);

  const actions: Array<{ priority: "HIGH" | "MEDIUM" | "LOW"; title: string; reason: string; href: string }> = [];
  const overdueReminders = dueReminders.filter(item => item.dueAt < now);
  if (overdueReminders.length) actions.push({
    priority: "HIGH", title: `Selesaikan ${overdueReminders.length} pengingat yang terlambat`,
    reason: "Tindakan yang lewat tenggat berisiko menghambat follow-up dan penyelesaian proyek.",
    href: "/reminders",
  });
  if (overdueFollowUps > 0) actions.push({
    priority: "HIGH", title: `Follow-up ${overdueFollowUps} prospek yang sudah jatuh tempo`,
    reason: "Prospek aktif dengan tanggal tindak lanjut di masa lalu perlu ditinjau dan dihubungi.",
    href: "/leads",
  });
  if (target !== null && remaining !== null && remaining > 0) actions.push({
    priority: income === 0 ? "HIGH" : "MEDIUM", title: `Kejar sisa target ${money(remaining)}`,
    reason: `Pemasukan tercatat bulan ini ${money(income)} dari target ${money(target)}. Prioritaskan penawaran yang paling dekat ke keputusan.`,
    href: "/analytics",
  });
  if (leads.length === 0) actions.push({
    priority: "HIGH", title: "Bangun pipeline prospek baru",
    reason: "Belum ada prospek aktif. Mulai dari jaringan yang relevan, rekomendasi pelanggan, atau konten dengan CTA yang jelas.",
    href: "/leads",
  });
  if (publishedContent === 0) actions.push({
    priority: "MEDIUM", title: "Terbitkan konten dengan CTA yang terukur",
    reason: "Belum ada konten berstatus Published bulan ini. Uji konten portofolio, studi kasus, atau penawaran jasa yang spesifik.",
    href: "/content",
  });
  if (expense > income) actions.push({
    priority: "MEDIUM", title: "Tinjau pengeluaran bulan ini",
    reason: `Pengeluaran tercatat ${money(expense)} dan pemasukan ${money(income)}. Periksa biaya dan status penagihan sebelum menambah komitmen baru.`,
    href: "/finance",
  });
  if (actions.length === 0) actions.push({
    priority: "LOW", title: "Jalankan review pertumbuhan mingguan",
    reason: "Periksa konversi prospek, transaksi yang benar-benar diterima, hasil konten, dan proyek yang mendekati tenggat.",
    href: "/analytics",
  });

  const followUps = leads
    .filter(lead => lead.nextFollowUp && lead.nextFollowUp < tomorrow)
    .slice(0, 8)
    .map(lead => ({
      id: lead.id, name: lead.name, businessName: lead.businessName,
      service: lead.service, status: lead.status,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
      nextFollowUp: lead.nextFollowUp,
    }));

  return NextResponse.json({
    generatedAt: now.toISOString(),
    user: { username: session.username },
    metrics: {
      income, expense, net: income - expense, target, remaining,
      openLeads: leads.length, overdueFollowUps,
      remindersDue: dueReminders.length, publishedContent,
    },
    actions: actions.slice(0, 8),
    followUps,
    highValueLeads: highValueLeads.map(lead => ({
      id: lead.id, name: lead.name, businessName: lead.businessName,
      service: lead.service, status: lead.status,
      estimatedValue: Number(lead.estimatedValue),
    })),
  });
}
