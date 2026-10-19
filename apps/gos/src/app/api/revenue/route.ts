import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateFinancialSummary } from "@kholil/business-core/finance";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [transactionGroups, leadGroups, goal, services, recognizedRevenue, activeOrderValue, activeOrderPayments, paymentsReceived] = await Promise.all([
    prisma.financialTransaction.groupBy({ by: ["type", "classification"], where: { occurredAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true }, _sum: { estimatedValue: true } }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
    prisma.service.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true, category: true, priceFrom: true, currency: true, slug: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], take: 200 }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: start, lt: end } }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { order: { is: { status: { not: "CANCELLED" } } } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: start, lt: end } }, _sum: { amount: true } }),
  ]);
  const snapshot = calculateFinancialSummary({
    recognizedRevenue: String(recognizedRevenue._sum.amount ?? 0),
    activeOrderValue: String(activeOrderValue._sum.amount ?? 0),
    activeOrderPayments: String(activeOrderPayments._sum.amount ?? 0),
    cashCollected: String(paymentsReceived._sum.amount ?? 0),
    transactionTotals: transactionGroups.map(row => ({ type: row.type as "INCOME" | "EXPENSE", classification: row.classification, amount: String(row._sum.amount ?? 0) })),
  });
  const count = (status: string) => leadGroups.find(group => group.status === status)?._count._all ?? 0;
  const openStatuses = leadGroups.filter(group => !["WON", "LOST"].includes(group.status));
  const open = openStatuses.reduce((sum, group) => sum + group._count._all, 0);
  const won = count("WON"); const lost = count("LOST");
  const estimatedPipeline = openStatuses.reduce((sum, group) => sum + Number(group._sum.estimatedValue ?? 0), 0);
  const winRate = won + lost > 0 ? won / (won + lost) * 100 : null;
  return NextResponse.json({
    generatedAt: now.toISOString(), month: start.toISOString().slice(0, 7),
    finance: {
      ...snapshot,
      // Backward-compatible names are explicitly cash-flow values, not profit.
      income: snapshot.cashInflow, expense: snapshot.cashOutflow, net: snapshot.netCashFlow,
      reportingPeriodStart: start.toISOString(), reportingPeriodEnd: end.toISOString(),
      definitions: { recognizedRevenue: "Nilai order berstatus DELIVERED dengan tanggal serah-terima dalam periode", cashCollected: "Pembayaran pelanggan yang diterima dalam periode", receivables: "Sisa nilai order aktif setelah seluruh pembayaran tercatat", grossProfit: "Pendapatan yang diakui dikurangi biaya langsung", netOperatingProfit: "Laba kotor ditambah pendapatan lain, dikurangi beban operasional dan refund; tidak termasuk pajak, penarikan pemilik, pokok pinjaman, atau pembelian aset" },
    },
    pipeline: { total: leadGroups.reduce((sum, group) => sum + group._count._all, 0), open, won, lost, estimatedValue: estimatedPipeline, winRate },
    activeGoal: goal ? { id: goal.id, name: goal.name, metric: goal.metric, targetValue: Number(goal.targetValue), activeDays: goal.activeDays, startDate: goal.startDate, endDate: goal.endDate } : null,
    services: services.map(service => ({ ...service, priceFrom: service.priceFrom === null ? null : Number(service.priceFrom) })),
  }, { headers: { "Cache-Control": "no-store" } });
}
