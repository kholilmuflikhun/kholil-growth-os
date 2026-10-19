import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Silakan login." }, { status: 401 });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [leads, proposals, transactions, projects, opportunities] = await Promise.all([
    prisma.lead.findMany({ select: { status: true, service: true, estimatedValue: true } }),
    prisma.proposal.findMany({ select: { status: true, order: { select: { id: true } } } }),
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: monthStart, lt: nextMonth } }, select: { type: true, category: true, amount: true, projectId: true } }),
    prisma.project.findMany({ select: { id: true, name: true, status: true, transactions: { select: { type: true, amount: true } }, orders: { select: { amount: true, status: true } } } }),
    prisma.clientOpportunity.findMany({ where: { stage: { in: ["IDEA", "CONTACTED", "PROPOSED"] } }, select: { estimatedValue: true, stage: true } }),
  ]);
  const won = leads.filter((l) => l.status === "WON").length;
  const closed = won + leads.filter((l) => l.status === "LOST").length;
  const proposalEligible = proposals.filter((p) => !["DRAFT", "CANCELLED"].includes(p.status.toUpperCase()));
  const proposalWon = proposals.filter((p) => Boolean(p.order) || ["WON", "ACCEPTED", "CONVERTED"].includes(p.status.toUpperCase())).length;
  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const categoryMap = new Map<string, { income: number; expense: number }>();
  for (const t of transactions) { const key = t.category?.trim() || "Tanpa kategori"; const v = categoryMap.get(key) ?? { income: 0, expense: 0 }; if (t.type === "INCOME") v.income += Number(t.amount); if (t.type === "EXPENSE") v.expense += Number(t.amount); categoryMap.set(key, v); }
  const projectProfit = projects.map((p) => { const revenue = p.transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0); const cost = p.transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0); const orderValue = p.orders.filter((o) => !["CANCELLED", "VOID"].includes(o.status.toUpperCase())).reduce((s, o) => s + Number(o.amount), 0); return { id: p.id, name: p.name, status: p.status, revenue: revenue || orderValue, cost, net: (revenue || orderValue) - cost }; }).sort((a, b) => b.net - a.net);
  return NextResponse.json({ generatedAt: now.toISOString(), period: { start: monthStart.toISOString(), endExclusive: nextMonth.toISOString() }, sales: { leadsTotal: leads.length, leadsWon: won, leadsLost: closed - won, leadWinRate: closed ? won / closed * 100 : null, proposalsEligible: proposalEligible.length, proposalsWon: proposalWon, proposalConversion: proposalEligible.length ? proposalWon / proposalEligible.length * 100 : null, openOpportunityValue: opportunities.reduce((s, o) => s + Number(o.estimatedValue), 0) }, finance: { income, expense, net: income - expense, categories: [...categoryMap.entries()].map(([category, v]) => ({ category, ...v, net: v.income - v.expense, marginPct: v.income > 0 ? (v.income - v.expense) / v.income * 100 : null })).sort((a, b) => b.net - a.net) }, projectProfit });
}
