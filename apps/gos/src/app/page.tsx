import Link from "next/link";
import { ClipboardCheck, PackageSearch, ShoppingBag, Megaphone, Activity, CalendarCheck2, CalendarRange, HeartHandshake, GitBranch, Sun, ArrowUpRight, Banknote, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, CircleDollarSign, ClipboardList, ContactRound, FileText, Goal, LayoutDashboard, LogOut, Target, TrendingUp, Users, WalletCards, Settings2, BrainCircuit, BellRing, Bell, Sparkles, Calculator, FileCheck2, ListTodo, Gauge } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandMark } from "@kholil/ui";
import { calculateFinancialSummary } from "@kholil/business-core/finance";

const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const nav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Daily Business Briefing", href: "/daily-briefing", icon: Sun },
  { label: "Goals & Strategy", href: "/goals", icon: Target },
  { label: "CRM & Leads", href: "/leads", icon: ContactRound },
  { label: "Sales & Orders", href: "/orders", icon: WalletCards },
  { label: "Katalog Layanan", href: "/catalog", icon: PackageSearch },
  { label: "Produk & Resource", href: "/products", icon: ShoppingBag },
  { label: "Kampanye", href: "/campaigns", icon: Megaphone },
  { label: "Customers & Payments", href: "/customers", icon: CircleDollarSign },
  { label: "Projects", href: "/projects", icon: BriefcaseBusiness },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Finance", href: "/finance", icon: Banknote },
  { label: "KPI & Reports", href: "/reports", icon: ChartNoAxesCombined },
  { label: "Business Intelligence", href: "/analytics", icon: BrainCircuit },
  { label: "Sales Conversion & Profitability", href: "/sales-optimization", icon: TrendingUp },
  { label: "Business Decision Center", href: "/actions", icon: ListTodo },
  { label: "Daily Execution Tracker", href: "/execution", icon: CalendarCheck2 },
  { label: "Weekly Business Review", href: "/weekly-review", icon: CalendarRange },
  { label: "Monthly Review & Strategy", href: "/monthly-review", icon: Target },
  { label: "Client Retention & Recurring Revenue", href: "/retention", icon: HeartHandshake },
  { label: "Client Lifecycle & Upsell", href: "/lifecycle", icon: GitBranch },
  { label: "Revenue Forecast & Target Pacing", href: "/forecast", icon: Gauge },
  { label: "Reminders & Actions", href: "/reminders", icon: BellRing },
  { label: "Notification Center", href: "/notifications", icon: Bell },
  { label: "AI Business Assistant", href: "/assistant", icon: Sparkles },
  { label: "Revenue Growth Engine", href: "/revenue", icon: Calculator },
  { label: "Sales Pipeline & Proposals", href: "/proposals", icon: FileCheck2 },
  { label: "Customer & Orders", href: "/orders", icon: ClipboardCheck },
  { label: "Settings", href: "/settings", icon: Settings2 },
];

export default async function Dashboard() {
  const session = await requireSession();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [goal, transactions, activeLeads, recentLeads, projects, recognizedRevenue, activeOrderValue, activeOrderPayments, paymentsReceived] = await Promise.all([
    prisma.goal.findFirst({ where: { status: "ACTIVE", startDate: { lte: now }, endDate: { gte: now } }, orderBy: { updatedAt: "desc" } }),
    prisma.financialTransaction.groupBy({ by: ["type", "classification"], where: { occurredAt: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
    prisma.lead.count({ where: { status: { notIn: ["WON", "LOST"] } } }),
    prisma.lead.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.project.count({ where: { status: { notIn: ["DONE", "COMPLETED", "CANCELLED"] } } }),
    prisma.order.aggregate({ where: { status: "DELIVERED", deliveredAt: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
    prisma.order.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { order: { is: { status: { not: "CANCELLED" } } } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { paidAt: { gte: monthStart, lt: nextMonth } }, _sum: { amount: true } }),
  ]);
  const snapshot = calculateFinancialSummary({
    recognizedRevenue: String(recognizedRevenue._sum.amount ?? 0),
    activeOrderValue: String(activeOrderValue._sum.amount ?? 0),
    activeOrderPayments: String(activeOrderPayments._sum.amount ?? 0),
    cashCollected: String(paymentsReceived._sum.amount ?? 0),
    transactionTotals: transactions.map(row => ({ type: row.type as "INCOME" | "EXPENSE", classification: row.classification, amount: String(row._sum.amount ?? 0) })),
  });
  const cashInflow = snapshot.cashInflow;
  const expenses = snapshot.cashOutflow;
  const metric = (goal?.metric || "RECOGNIZED_REVENUE").toUpperCase();
  const goalActual = metric.includes("NET_OPERATING_CONTRIBUTION") ? snapshot.grossProfit : metric.includes("NET_OPERATING") || metric.includes("PROFIT") || metric.includes("LABA") ? snapshot.netOperatingProfit : metric.includes("CASH") || metric.includes("KAS") ? snapshot.cashCollected : metric.includes("LEAD") ? activeLeads : snapshot.recognizedRevenue;
  const goalMetricLabel = metric.includes("NET_OPERATING_CONTRIBUTION") ? "Kontribusi setelah biaya langsung" : metric.includes("NET_OPERATING") || metric.includes("PROFIT") || metric.includes("LABA") ? "Laba operasional bersih" : metric.includes("CASH") || metric.includes("KAS") ? "Kas diterima" : metric.includes("LEAD") ? "Jumlah prospek aktif" : "Pendapatan yang diakui";
  const target = goal ? Number(goal.targetValue) : 0;
  const activeDays = goal?.activeDays ?? 0;
  const progress = target > 0 ? Math.min(100, goalActual / target * 100) : 0;
  const remaining = Math.max(0, target - goalActual);
  const statusLabels: Record<string, string> = { NEW: "Prospek baru", CONTACTED: "Dihubungi", QUALIFIED: "Terkualifikasi", DISCOVERY: "Konsultasi", PROPOSAL: "Proposal", NEGOTIATION: "Negosiasi", WON: "Menang", LOST: "Tidak lanjut" };
  const today = new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);

  return <div className="min-h-screen w-full lg:flex">
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 lg:block"><Link href="/" className="flex items-center gap-3"><BrandMark className="rounded-2xl" /><div><p className="font-extrabold">Kholil Growth</p><p className="text-xs text-zinc-500">Operating System</p></div></Link><nav className="mt-9 space-y-1">{nav.map(({ label, href, icon: Icon }, i) => <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${i === 0 ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}><Icon size={18}/>{label}</Link>)}</nav><div className="mt-10 rounded-2xl bg-zinc-950 p-4 text-white"><p className="text-xs font-bold text-blue-400">FOCUS HARI INI</p><p className="mt-2 text-sm font-bold">Ubah ide menjadi tindakan yang terukur.</p><p className="mt-2 text-xs leading-5 text-zinc-400">Hubungi prospek, kirim proposal, dan catat hasilnya.</p></div><p className="mt-8 text-xs text-zinc-400">Data langsung dari database</p></aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white/90 px-5 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 lg:px-8"><div><p className="text-xs capitalize text-zinc-500">{today}</p><h1 className="mt-1 text-xl font-extrabold">Ringkasan bisnis</h1></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-bold">{session.username}</p><p className="text-xs text-zinc-500">{session.email}</p></div><Link href="/settings" aria-label="Pengaturan akun" className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 dark:border-zinc-800"><Settings2 size={17}/></Link><form action="/api/auth/logout" method="post"><button aria-label="Keluar" className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 dark:border-zinc-800"><LogOut size={17}/></button></form><div className="grid h-10 w-10 place-items-center rounded-full bg-blue-100 font-extrabold text-blue-700">KM</div></div></header>
      <div className="mx-auto max-w-7xl space-y-7 p-5 lg:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-bold text-blue-600">OWNER DASHBOARD</p><h2 className="mt-1 text-2xl font-extrabold">Halo, {session.username} 👋</h2><p className="mt-2 text-sm text-zinc-500">Kelola prospek, keuangan, konten, dan pertumbuhan dalam satu workspace.</p></div><div className="flex gap-2"><Link href="/finance" className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-bold dark:border-zinc-800 dark:bg-zinc-900"><CalendarDays className="mr-2 inline" size={16}/>Laporan bulan ini</Link><Link href="/leads" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600">+ Tambah prospek</Link></div></div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30"><div className="flex items-start gap-3"><Activity className="mt-1 text-blue-600"/><div className="flex-1"><p className="font-bold">Data operasional</p><p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Ringkasan ini dihitung dari transaksi, prospek, proyek, dan target yang tersimpan. Belum ada data transaksi? Catat transaksi pertama di Finance agar angka pendapatan terisi.</p></div></div></div>
        <section aria-label="Indikator bisnis" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {[{ label: "Target bulan ini", value: money(target), sub: `${target > 0 && activeDays > 0 ? money(target / activeDays) : "—"} per hari aktif`, icon: Target }, { label: "Kas masuk tercatat", value: money(cashInflow), sub: "Arus kas masuk pada periode berjalan", icon: CircleDollarSign }, { label: "Prospek aktif", value: String(activeLeads), sub: "Belum menang atau ditutup", icon: Users }, { label: "Proyek berjalan", value: String(projects), sub: "Tidak termasuk selesai/batal", icon: BriefcaseBusiness }].map(({ label, value, sub, icon: Icon }) => <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><p className="text-sm text-zinc-500">{label}</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950"><Icon size={20}/></span></div><p className="mt-4 text-2xl font-extrabold tracking-tight">{value}</p><p className="mt-2 text-xs text-zinc-500">{sub}</p></article>)}
        </section>
        <section aria-label="Kinerja keuangan" className="space-y-3">
          <div><h3 className="font-extrabold">Kinerja keuangan bulan ini</h3><p className="mt-1 text-sm text-zinc-500">Pendapatan yang diakui berbeda dari kas yang diterima. Record lama yang belum diklasifikasikan tidak dihitung sebagai laba.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {[{label:"Pendapatan diakui",value:snapshot.recognizedRevenue},{label:"Kas diterima",value:snapshot.cashCollected},{label:"Piutang terbuka",value:snapshot.receivables},{label:"Laba kotor",value:snapshot.grossProfit},{label:"Laba operasional bersih",value:snapshot.netOperatingProfit}].map(item=><article key={item.label} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-xs leading-5 text-zinc-500">{item.label}</p><p className="mt-2 break-words text-lg font-extrabold">{money(item.value)}</p></article>)}
          </div>
        </section>
        <section aria-label="Aksi cepat" className="space-y-3">
          <div><h3 className="font-extrabold">Aksi cepat</h3><p className="mt-1 text-sm text-zinc-500">Langsung menuju pekerjaan yang paling sering digunakan.</p></div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[{ label: "Tambah prospek", description: "Catat calon pelanggan baru", href: "/leads", icon: ContactRound }, { label: "Catat transaksi", description: "Perbarui pemasukan atau biaya", href: "/finance", icon: Banknote }, { label: "Rencanakan konten", description: "Atur jadwal publikasi", href: "/content", icon: CalendarDays }, { label: "Tinjau KPI", description: "Periksa hasil dan target", href: "/reports", icon: ClipboardList }].map(({ label, description, href, icon: Icon }) => <Link href={href} key={label} className="group flex min-h-32 flex-col rounded-2xl border border-zinc-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-800"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50"><Icon size={19}/></span><span className="mt-3 text-sm font-extrabold">{label}</span><span className="mt-1 text-xs leading-5 text-zinc-500">{description}</span></Link>)}
          </div>
        </section>
        <section className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-start justify-between"><div><h3 className="font-extrabold">Kemajuan target</h3><p className="mt-1 text-sm text-zinc-500">{goal?.name || "Belum ada target aktif"}</p></div><TrendingUp className="text-blue-500"/></div><div className="mt-6 flex items-end justify-between"><div><p className="text-3xl font-extrabold">{money(goalActual)}</p><p className="mt-1 text-sm text-zinc-500">dari {target > 0 ? money(target) : "target belum diatur"} · {goalMetricLabel}</p></div><p className="font-extrabold text-blue-600">{target > 0 ? `${progress.toFixed(1)}%` : "—"}</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }}/></div><div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800"><div><p className="text-xs text-zinc-500">Target harian</p><p className="mt-1 font-bold">{target > 0 && activeDays > 0 ? money(target / activeDays) : "—"}</p></div><div><p className="text-xs text-zinc-500">Hari aktif target</p><p className="mt-1 font-bold">{activeDays > 0 ? `${activeDays} hari` : "—"}</p></div><div><p className="text-xs text-zinc-500">Sisa target</p><p className="mt-1 font-bold">{target > 0 ? money(remaining) : "—"}</p></div></div></article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><h3 className="font-extrabold">Ringkasan kas</h3><Banknote className="text-blue-500"/></div><p className="mt-5 text-xs text-zinc-500">Kas masuk bulan ini</p><p className="mt-1 text-xl font-extrabold text-emerald-600">{money(cashInflow)}</p><p className="mt-4 text-xs text-zinc-500">Pengeluaran bulan ini</p><p className="mt-1 text-xl font-extrabold text-red-600">{money(expenses)}</p><div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800"><p className="text-xs text-zinc-500">Selisih arus kas</p><p className={`mt-1 text-xl font-extrabold ${cashInflow-expenses >= 0 ? "text-blue-600" : "text-red-600"}`}>{money(cashInflow-expenses)}</p><Link href="/finance" className="mt-4 inline-flex items-center text-sm font-bold text-blue-600">Buka Finance <ArrowUpRight size={15}/></Link></div></article>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800"><div><h3 className="font-extrabold">Prospek terbaru</h3><p className="mt-1 text-sm text-zinc-500">Pantau tindak lanjut berikutnya</p></div><Link href="/leads" className="text-sm font-bold text-blue-600">Buka CRM <ArrowUpRight className="ml-1 inline" size={15}/></Link></div>{recentLeads.length === 0 ? <div className="p-8 text-center"><ContactRound className="mx-auto text-zinc-300" size={30}/><p className="mt-3 font-bold">Belum ada prospek</p><p className="mt-1 text-sm text-zinc-500">Tambahkan prospek pertama melalui CRM & Leads.</p><Link href="/leads" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white">Tambah prospek</Link></div> : <><div className="grid gap-3 p-3 sm:grid-cols-2 lg:hidden">{recentLeads.map(l => <Link key={l.id} href="/leads" className="rounded-xl border border-zinc-100 p-4 transition hover:border-blue-300 dark:border-zinc-800"><div className="flex items-start justify-between gap-3"><p className="font-bold">{l.businessName || l.name}</p><span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{statusLabels[l.status] || l.status}</span></div><p className="mt-2 text-sm text-zinc-500">{l.service || "Kebutuhan belum dicatat"}</p><p className="mt-3 text-sm font-extrabold">{l.estimatedValue ? money(Number(l.estimatedValue)) : "Nilai belum ditentukan"}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600">Buka CRM <ArrowUpRight size={13}/></span></Link>)}</div><div className="hidden overflow-x-auto lg:block"><table className="w-full text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-800/50"><tr><th className="px-5 py-3">Prospek</th><th className="px-5 py-3">Kebutuhan</th><th className="px-5 py-3">Nilai estimasi</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{recentLeads.map(l => <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-5 py-4 font-bold">{l.businessName || l.name}</td><td className="px-5 py-4 text-zinc-500">{l.service}</td><td className="px-5 py-4 font-semibold">{l.estimatedValue ? money(Number(l.estimatedValue)) : "Belum ditentukan"}</td><td className="px-5 py-4"><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{statusLabels[l.status] || l.status}</span></td></tr>)}</tbody></table></div></>}</section>
        <section className="grid gap-5 md:grid-cols-3">{[{ icon: Goal, t: "Goals & Strategy", d: "Atur target, inisiatif, dan evaluasi berkala.", href: "/goals" }, { icon: WalletCards, t: "Finance & Cashflow", d: "Catat pemasukan, biaya, dan pantau arus kas.", href: "/finance" }, { icon: ClipboardList, t: "KPI & Execution", d: "Ubah strategi menjadi tindakan yang terukur.", href: "/reports" }].map(({ icon: Icon, t, d, href }) => <Link href={href} key={t} className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-900"><Icon className="text-blue-500"/><h3 className="mt-4 font-extrabold">{t}</h3><p className="mt-2 text-sm leading-6 text-zinc-500">{d}</p></Link>)}</section>
      </div>
    </main>
  </div>;
}
