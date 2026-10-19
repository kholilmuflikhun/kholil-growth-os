import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const categories = ["SALES", "DELIVERY", "CONTENT", "ADMIN", "LEARNING", "OTHER"] as const;
async function authorized() {
  const session = await getSession();
  return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
}
function monthBounds(value: string | null) {
  const month = value && /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
  const [year, m] = month.split("-").map(Number);
  return { month, start: new Date(year, m - 1, 1), end: new Date(year, m, 1) };
}
export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const { month, start, end } = monthBounds(new URL(request.url).searchParams.get("month"));
  const [entries, goal, actionOptions] = await Promise.all([
    prisma.dailyExecution.findMany({ where: { activityDate: { gte: start, lt: end } }, include: { action: { select: { id: true, title: true, status: true } } }, orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }], take: 500 }),
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: new Date(end.getTime() - 1) }, endDate: { gte: start } }, orderBy: { updatedAt: "desc" } }),
    prisma.actionItem.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } }, select: { id: true, title: true }, orderBy: { dueAt: "asc" }, take: 100 }),
  ]);
  const revenue = entries.reduce((sum, row) => sum + Number(row.revenueAmount), 0);
  const expenses = entries.reduce((sum, row) => sum + Number(row.expenseAmount), 0);
  const minutes = entries.reduce((sum, row) => sum + row.minutesSpent, 0);
  const targetMonthly = goal ? Number(goal.targetValue) : 5200000;
  const activeDays = goal?.activeDays || 26;
  const dailyTarget = targetMonthly / Math.max(1, activeDays);
  const todayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const dayEntries = entries.filter(row => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(row.activityDate) === todayKey);
  const todayRevenue = dayEntries.reduce((sum, row) => sum + Number(row.revenueAmount), 0);
  const activeDates = new Set(entries.filter(row => row.minutesSpent > 0 || row.activity.trim()).map(row => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" }).format(row.activityDate)));
  return NextResponse.json({ month, data: entries, actions: actionOptions, summary: { revenue, expenses, net: revenue - expenses, minutes, entryCount: entries.length, activeDays: activeDates.size, targetMonthly, activeDaysTarget: activeDays, dailyTarget, todayRevenue, todayGap: Math.max(0, dailyTarget - todayRevenue), progress: targetMonthly > 0 ? Math.min(100, revenue / targetMonthly * 100) : 0 } });
}
export async function POST(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const activity = typeof body?.activity === "string" ? body.activity.trim() : "";
  const category = typeof body?.category === "string" ? body.category : "SALES";
  const outcome = typeof body?.outcome === "string" ? body.outcome.trim().slice(0, 1200) : null;
  const date = body?.activityDate ? new Date(String(body.activityDate)) : new Date();
  const revenueAmount = Number(body?.revenueAmount ?? 0);
  const expenseAmount = Number(body?.expenseAmount ?? 0);
  const minutesSpent = Number(body?.minutesSpent ?? 0);
  const actionId = typeof body?.actionId === "string" && body.actionId ? body.actionId : null;
  if (activity.length < 3 || activity.length > 180) return NextResponse.json({ error: "Aktivitas harus 3–180 karakter." }, { status: 400 });
  if (!(categories as readonly string[]).includes(category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  if (Number.isNaN(date.getTime()) || !Number.isFinite(revenueAmount) || !Number.isFinite(expenseAmount) || !Number.isInteger(minutesSpent) || revenueAmount < 0 || expenseAmount < 0 || minutesSpent < 0 || minutesSpent > 1440) return NextResponse.json({ error: "Tanggal, nominal, atau durasi tidak valid." }, { status: 400 });
  if (actionId) {
    const action = await prisma.actionItem.findUnique({ where: { id: actionId }, select: { id: true } });
    if (!action) return NextResponse.json({ error: "Tindakan terkait tidak ditemukan." }, { status: 400 });
  }
  const data = await prisma.dailyExecution.create({ data: { activity, category, outcome: outcome || null, activityDate: new Date(date.getFullYear(), date.getMonth(), date.getDate()), revenueAmount, expenseAmount, minutesSpent, actionId }, include: { action: { select: { id: true, title: true, status: true } } } });
  return NextResponse.json({ data }, { status: 201 });
}
export async function PATCH(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (typeof body?.id !== "string" || !body.id) return NextResponse.json({ error: "ID aktivitas wajib diisi." }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.activity !== undefined) {
    if (typeof body.activity !== "string" || body.activity.trim().length < 3 || body.activity.trim().length > 180) return NextResponse.json({ error: "Aktivitas harus 3–180 karakter." }, { status: 400 });
    data.activity = body.activity.trim();
  }
  if (body.outcome !== undefined) data.outcome = typeof body.outcome === "string" ? body.outcome.trim().slice(0, 1200) || null : null;
  for (const key of ["revenueAmount", "expenseAmount", "minutesSpent"] as const) {
    if (body[key] !== undefined) {
      const value = Number(body[key]);
      if (!Number.isFinite(value) || value < 0 || (key === "minutesSpent" && (!Number.isInteger(value) || value > 1440))) return NextResponse.json({ error: `Nilai ${key} tidak valid.` }, { status: 400 });
      data[key] = value;
    }
  }
  if (body.category !== undefined) {
    if (typeof body.category !== "string" || !(categories as readonly string[]).includes(body.category)) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
    data.category = body.category;
  }
  if (body.activityDate !== undefined) {
    const date = new Date(String(body.activityDate));
    if (Number.isNaN(date.getTime())) return NextResponse.json({ error: "Tanggal tidak valid." }, { status: 400 });
    data.activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }
  try { return NextResponse.json({ data: await prisma.dailyExecution.update({ where: { id: body.id }, data }) }); }
  catch { return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 }); }
}
export async function DELETE(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID aktivitas wajib diisi." }, { status: 400 });
  try { await prisma.dailyExecution.delete({ where: { id } }); return NextResponse.json({ ok: true }); }
  catch { return NextResponse.json({ error: "Aktivitas tidak ditemukan." }, { status: 404 }); }
}
