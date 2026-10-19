import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parseMonth(value: string | null) {
  const monthKey = value && /^\d{4}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 7);
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const previousStart = new Date(year, month - 2, 1);
  return { monthKey, start, end, previousStart };
}
function amount(rows: Array<{ amount: unknown }>) { return rows.reduce((sum, row) => sum + Number(row.amount), 0); }
function change(current: number, previous: number) { return previous === 0 ? (current > 0 ? 100 : 0) : (current - previous) / Math.abs(previous) * 100; }

async function authorized() {
  const session = await getSession();
  return Boolean(session && ["OWNER", "ADMIN", "MANAGER"].includes(session.role));
}
export async function GET(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const { monthKey, start, end, previousStart } = parseMonth(new URL(request.url).searchParams.get("month"));
  const now = new Date();
  const [transactions, previousTransactions, leads, previousLeads, activeLeads, wins, content, executions, kpis, actions, projects, orders, plan] = await Promise.all([
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: start, lt: end } }, select: { type: true, amount: true, category: true, occurredAt: true } }),
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: previousStart, lt: start } }, select: { type: true, amount: true } }),
    prisma.lead.findMany({ where: { createdAt: { gte: start, lt: end } }, select: { id: true, name: true, businessName: true, service: true, status: true, estimatedValue: true, createdAt: true } }),
    prisma.lead.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
    prisma.lead.findMany({ where: { status: { notIn: ["WON", "LOST"] } }, select: { estimatedValue: true, status: true, nextFollowUp: true } }),
    prisma.lead.count({ where: { status: "WON", updatedAt: { gte: start, lt: end } } }),
    prisma.contentItem.findMany({ where: { OR: [{ plannedAt: { gte: start, lt: end } }, { publishedAt: { gte: start, lt: end } }] }, select: { id: true, title: true, channel: true, status: true, plannedAt: true, publishedAt: true } }),
    prisma.dailyExecution.findMany({ where: { activityDate: { gte: start, lt: end } }, select: { activity: true, category: true, revenueAmount: true, expenseAmount: true, minutesSpent: true, activityDate: true } }),
    prisma.kPIResult.findMany({ where: { periodStart: { lt: end }, periodEnd: { gte: start } }, select: { name: true, target: true, actual: true, weight: true, periodStart: true, periodEnd: true } }),
    prisma.actionItem.findMany({ where: { status: { in: ["OPEN", "IN_PROGRESS"] }, dueAt: { lt: now } }, select: { id: true, title: true, priority: true, dueAt: true, status: true }, orderBy: { dueAt: "asc" }, take: 20 }),
    prisma.project.findMany({ where: { dueDate: { lt: now }, status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] } }, select: { id: true, name: true, status: true, dueDate: true }, orderBy: { dueDate: "asc" }, take: 20 }),
    prisma.order.findMany({ where: { status: { notIn: ["CANCELLED", "CANCELED"] } }, select: { id: true, title: true, customerName: true, amount: true, dueDate: true, status: true, payments: { select: { amount: true } } }, take: 500 }),
    prisma.monthlyPlan.findUnique({ where: { monthKey } }),
  ]);
  const income = amount(transactions.filter(t => t.type.toUpperCase() === "INCOME"));
  const expenses = amount(transactions.filter(t => t.type.toUpperCase() === "EXPENSE"));
  const prevIncome = amount(previousTransactions.filter(t => t.type.toUpperCase() === "INCOME"));
  const prevExpenses = amount(previousTransactions.filter(t => t.type.toUpperCase() === "EXPENSE"));
  const targetRevenue = plan ? Number(plan.revenueTarget) : 5200000;
  const targetLeads = plan?.leadTarget ?? 20;
  const targetContent = plan?.contentTarget ?? 12;
  const execRevenue = executions.reduce((sum,e) => sum + Number(e.revenueAmount), 0);
  const execCosts = executions.reduce((sum,e) => sum + Number(e.expenseAmount), 0);
  const minutes = executions.reduce((sum,e) => sum + e.minutesSpent, 0);
  const activeDays = new Set(executions.map(e => e.activityDate.toISOString().slice(0,10))).size;
  const pipelineValue = activeLeads.reduce((sum,l) => sum + Number(l.estimatedValue || 0), 0);
  const overdueFollowUps = activeLeads.filter(l => !l.nextFollowUp || l.nextFollowUp <= now).length;
  const published = content.filter(c => c.publishedAt && c.publishedAt >= start && c.publishedAt < end);
  const planned = content.filter(c => c.plannedAt && c.plannedAt >= start && c.plannedAt < end);
  const receivables = orders.map(o => ({ id:o.id, title:o.title, customerName:o.customerName, amount:Number(o.amount), paid:o.payments.reduce((sum,p)=>sum+Number(p.amount),0), dueDate:o.dueDate?.toISOString() || null, status:o.status }))
    .map(o => ({ ...o, outstanding: Math.max(0,o.amount-o.paid) })).filter(o => o.outstanding > 0).sort((a,b)=>b.outstanding-a.outstanding);
  const categories = transactions.filter(t=>t.type.toUpperCase()==="INCOME").reduce<Record<string,number>>((acc,t)=>{acc[t.category]=(acc[t.category]||0)+Number(t.amount);return acc;},{});
  const topCategories = Object.entries(categories).map(([category,value])=>({category,amount:value})).sort((a,b)=>b.amount-a.amount).slice(0,6);
  const kpiRows = kpis.map(k=>({name:k.name,target:Number(k.target),actual:Number(k.actual),weight:Number(k.weight),attainment:Number(k.target)>0?Number(k.actual)/Number(k.target)*100:0}));
  const weightedKpi = kpiRows.length ? kpiRows.reduce((sum,k)=>sum+Math.min(150,k.attainment)*k.weight,0)/Math.max(.0001,kpiRows.reduce((sum,k)=>sum+k.weight,0)) : null;
  const daysInMonth = new Date(end.getTime()-1).getDate();
  const elapsedDays = Math.max(1, Math.min(daysInMonth, now < start ? 0 : now >= end ? daysInMonth : now.getDate()));
  const paceTarget = targetRevenue * elapsedDays / daysInMonth;
  const recommendations: Array<{priority:"URGENT"|"HIGH"|"MEDIUM";title:string;reason:string;action:string;href:string}> = [];
  if (income < paceTarget) recommendations.push({priority: income === 0 ? "URGENT":"HIGH", title:"Pulihkan pace pemasukan", reason:`Pemasukan ${Math.round(income/Math.max(1,paceTarget)*100)}% dari target prorata ${Math.round(paceTarget).toLocaleString("id-ID")}.`, action:"Fokus pada prospek paling siap membeli, tindak lanjuti proposal terbuka, dan tawarkan paket layanan dengan lingkup serta harga yang jelas.", href:"/leads"});
  if (overdueFollowUps > 0) recommendations.push({priority:"HIGH",title:"Rapikan follow-up CRM",reason:`${overdueFollowUps} prospek aktif belum punya jadwal follow-up berikutnya atau sudah jatuh tempo.`,action:"Atur tanggal follow-up dan catat langkah berikutnya untuk setiap prospek aktif.",href:"/leads"});
  if (receivables.length > 0) recommendations.push({priority:"HIGH",title:"Tingkatkan arus kas melalui penagihan",reason:`Ada ${receivables.length} pesanan dengan sisa tagihan total ${Math.round(receivables.reduce((sum,o)=>sum+o.outstanding,0)).toLocaleString("id-ID")}.`,action:"Urutkan penagihan berdasarkan nominal dan tanggal jatuh tempo; rekam pembayaran melalui modul Payments.",href:"/orders"});
  if (projects.length > 0) recommendations.push({priority:"HIGH",title:"Selesaikan proyek terlambat",reason:`${projects.length} proyek melewati tanggal jatuh tempo.`,action:"Perbarui status proyek, konfirmasi jadwal baru, dan komunikasikan kepada pelanggan.",href:"/projects"});
  if (published.length < Math.min(targetContent, daysInMonth > 0 ? Math.ceil(targetContent * elapsedDays / daysInMonth) : targetContent)) recommendations.push({priority:"MEDIUM",title:"Tingkatkan konsistensi konten",reason:`${published.length} konten terpublikasi pada bulan ini, target ${targetContent}.`,action:"Prioritaskan konten portofolio, studi kasus, edukasi singkat, dan CTA menuju konsultasi.",href:"/content"});
  if (recommendations.length === 0) recommendations.push({priority:"MEDIUM",title:"Perkuat aktivitas yang terbukti berhasil",reason:"Tidak ada gap utama yang terdeteksi dari data yang tersedia.",action:"Tinjau kategori pemasukan teratas dan gandakan penawaran/aktivitas yang paling efektif.",href:"/analytics"});
  const daily = Array.from({length:daysInMonth},(_,i)=> {
    const date=new Date(start); date.setDate(i+1); const key=date.toISOString().slice(0,10);
    const dayTx=transactions.filter(t=>t.occurredAt.toISOString().slice(0,10)===key);
    const dayExec=executions.filter(e=>e.activityDate.toISOString().slice(0,10)===key);
    return {date:key, income:amount(dayTx.filter(t=>t.type.toUpperCase()==="INCOME")), expenses:amount(dayTx.filter(t=>t.type.toUpperCase()==="EXPENSE")), activityCount:dayExec.length};
  });
  return NextResponse.json({
    monthKey, summary:{income,expenses,net:income-expenses,prevIncome,prevExpenses,incomeChange:change(income,prevIncome),expenseChange:change(expenses,prevExpenses),targetRevenue,targetLeads,targetContent,elapsedDays,daysInMonth,paceTarget,revenueProgress:targetRevenue>0?income/targetRevenue*100:0,leadCount:leads.length,previousLeadCount:previousLeads,wonLeads:wins,pipelineCount:activeLeads.length,pipelineValue,overdueFollowUps,contentPublished:published.length,contentPlanned:planned.length,executionCount:executions.length,activeDays,minutes,executionRevenue:execRevenue,executionExpenses:execCosts,kpiCount:kpiRows.length,weightedKpi,overdueActions:actions.length,overdueProjects:projects.length,receivableCount:receivables.length,receivableTotal:receivables.reduce((sum,o)=>sum+o.outstanding,0)},
    daily,topCategories,kpis:kpiRows,leads:leads.map(l=>({...l,estimatedValue:l.estimatedValue?Number(l.estimatedValue):null})),receivables:receivables.slice(0,8),overdueActions:actions,overdueProjects:projects,plan:plan?{...plan,revenueTarget:Number(plan.revenueTarget)}:null,recommendations
  });
}
export async function PUT(request: Request) {
  if (!(await authorized())) return NextResponse.json({ error: "Tidak memiliki akses." }, { status: 401 });
  const body = await request.json().catch(()=>null) as Record<string,unknown>|null;
  const monthKey = typeof body?.monthKey==="string" && /^\d{4}-\d{2}$/.test(body.monthKey) ? body.monthKey : "";
  if (!monthKey) return NextResponse.json({error:"Periode bulan harus berformat YYYY-MM."},{status:400});
  const [year,month]=monthKey.split("-").map(Number);
  const start=new Date(year,month-1,1);
  const bounded=(key:string,max:number)=>typeof body?.[key]==="string" ? String(body[key]).trim().slice(0,max) || null : null;
  const revenueTarget=Number(body?.revenueTarget ?? 5200000);
  const leadTarget=Number(body?.leadTarget ?? 20);
  const contentTarget=Number(body?.contentTarget ?? 12);
  if(!Number.isFinite(revenueTarget)||revenueTarget<0||!Number.isInteger(leadTarget)||leadTarget<0||leadTarget>100000||!Number.isInteger(contentTarget)||contentTarget<0||contentTarget>100000) return NextResponse.json({error:"Target harus berupa angka valid dan tidak negatif."},{status:400});
  const plan=await prisma.monthlyPlan.upsert({where:{monthKey},create:{monthKey,monthStart:start,summary:bounded("summary",3000),wins:bounded("wins",3000),challenges:bounded("challenges",3000),focusOne:bounded("focusOne",500),focusTwo:bounded("focusTwo",500),focusThree:bounded("focusThree",500),revenueTarget,leadTarget,contentTarget},update:{summary:bounded("summary",3000),wins:bounded("wins",3000),challenges:bounded("challenges",3000),focusOne:bounded("focusOne",500),focusTwo:bounded("focusTwo",500),focusThree:bounded("focusThree",500),revenueTarget,leadTarget,contentTarget}});
  return NextResponse.json({plan});
}
