import Link from "next/link";
import { ArrowLeft, ArrowUpRight, BadgeCheck, ChartNoAxesCombined, CircleDollarSign, Lightbulb, Target, TrendingUp, Wallet } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const pct = (n: number | null) => n === null ? "Belum cukup data" : `${n.toFixed(1)}%`;

export default async function SalesOptimizationPage() {
  await requireSession();
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [leads, proposals, orders, transactions, projects, opportunities] = await Promise.all([
    prisma.lead.findMany({ select: { id: true, name: true, service: true, status: true, estimatedValue: true, createdAt: true } }),
    prisma.proposal.findMany({ select: { id: true, title: true, amount: true, status: true, createdAt: true, order: { select: { id: true, status: true } } } }),
    prisma.order.findMany({ where: { createdAt: { gte: start, lt: next } }, select: { id: true, title: true, amount: true, status: true, customerName: true, createdAt: true, projectId: true } }),
    prisma.financialTransaction.findMany({ where: { occurredAt: { gte: start, lt: next } }, select: { type: true, category: true, amount: true, projectId: true, project: { select: { name: true } } } }),
    prisma.project.findMany({ select: { id: true, name: true, budget: true, status: true, transactions: { select: { type: true, amount: true } }, orders: { select: { amount: true, status: true } } } }),
    prisma.clientOpportunity.findMany({ where: { stage: { in: ["IDEA", "CONTACTED", "PROPOSED"] } }, select: { estimatedValue: true, stage: true, priority: true } }),
  ]);
  const won = leads.filter((x) => x.status === "WON").length;
  const lost = leads.filter((x) => x.status === "LOST").length;
  const closed = won + lost;
  const leadConversion = closed ? won / closed * 100 : null;
  const sentProposals = proposals.filter((p) => !["DRAFT", "CANCELLED"].includes(p.status));
  const proposalWon = proposals.filter((p) => Boolean(p.order) || ["WON", "ACCEPTED", "CONVERTED"].includes(p.status.toUpperCase())).length;
  const proposalConversion = sentProposals.length ? proposalWon / sentProposals.length * 100 : null;
  const income = transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
  const net = income - expense;
  const pipeline = opportunities.reduce((s, o) => s + Number(o.estimatedValue), 0);
  const categoryMap = new Map<string, { income: number; expense: number; count: number }>();
  for (const row of transactions) {
    const key = row.category?.trim() || "Tanpa kategori";
    const v = categoryMap.get(key) ?? { income: 0, expense: 0, count: 0 };
    if (row.type === "INCOME") v.income += Number(row.amount);
    if (row.type === "EXPENSE") v.expense += Number(row.amount);
    v.count += 1;
    categoryMap.set(key, v);
  }
  const categories = [...categoryMap.entries()].map(([name, v]) => ({ name, ...v, net: v.income - v.expense, margin: v.income > 0 ? (v.income - v.expense) / v.income * 100 : null })).sort((a, b) => b.net - a.net);
  const projectProfit = projects.map((p) => {
    const projectIncome = p.transactions.filter((t) => t.type === "INCOME").reduce((s, t) => s + Number(t.amount), 0);
    const projectCost = p.transactions.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + Number(t.amount), 0);
    const orderValue = p.orders.filter((o) => !["CANCELLED", "VOID"].includes(o.status.toUpperCase())).reduce((s, o) => s + Number(o.amount), 0);
    return { id: p.id, name: p.name, status: p.status, income: projectIncome || orderValue, cost: projectCost, net: (projectIncome || orderValue) - projectCost, budget: p.budget ? Number(p.budget) : null };
  }).sort((a, b) => b.net - a.net).slice(0, 8);
  const serviceMap = new Map<string, { count: number; value: number }>();
  for (const lead of leads) { const key = lead.service?.trim() || "Layanan belum ditentukan"; const v = serviceMap.get(key) ?? { count: 0, value: 0 }; v.count += 1; if (lead.status === "WON") v.value += Number(lead.estimatedValue ?? 0); serviceMap.set(key, v); }
  const services = [...serviceMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value || b.count - a.count).slice(0, 6);
  const insights: { title: string; body: string; tone: "good" | "watch" | "action" }[] = [];
  if (net < 0) insights.push({ title: "Biaya bulan ini melebihi pemasukan", body: `Selisih tercatat ${money(Math.abs(net))}. Tinjau biaya, harga paket, dan biaya proyek yang belum dialokasikan.`, tone: "action" });
  if (leadConversion !== null && leadConversion < 30) insights.push({ title: "Prioritaskan perbaikan konversi prospek", body: `Konversi prospek tertutup ${pct(leadConversion)}. Catat alasan kalah dan lakukan follow-up dengan kebutuhan yang spesifik.`, tone: "action" });
  if (proposalConversion !== null && proposalConversion < 40) insights.push({ title: "Audit proposal yang belum berhasil", body: `Konversi proposal tercatat ${pct(proposalConversion)}. Periksa kecocokan ruang lingkup, harga, bukti portofolio, dan tindak lanjut.`, tone: "watch" });
  if (categories.some((c) => c.income > 0 && c.margin !== null && c.margin < 20)) insights.push({ title: "Periksa kategori dengan margin rendah", body: "Ada kategori transaksi dengan margin tercatat di bawah 20%. Pastikan biaya langsung dan biaya revisi tercatat sebelum mengubah harga.", tone: "watch" });
  if (!insights.length) insights.push({ title: "Pertahankan pencatatan dan uji prioritas layanan", body: "Belum ada sinyal kuat dari data yang tersedia. Bandingkan keuntungan proyek dan konversi per layanan sebelum menambah biaya pemasaran.", tone: "good" });
  const cards = [
    { label: "Pendapatan tercatat bulan ini", value: money(income), detail: "Dari transaksi bertipe pemasukan", Icon: CircleDollarSign },
    { label: "Biaya tercatat bulan ini", value: money(expense), detail: "Dari transaksi bertipe pengeluaran", Icon: Wallet },
    { label: "Selisih pendapatan-biaya", value: money(net), detail: "Bukan laba akuntansi final", Icon: ChartNoAxesCombined },
    { label: "Pipeline peluang terbuka", value: money(pipeline), detail: "Estimasi, bukan kas masuk", Icon: Target },
  ];
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><TrendingUp size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM · PHASE 29</p><h1 className="mt-1 text-3xl font-extrabold">Sales Conversion & Profitability Optimization</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Hubungkan data prospek, proposal, order, transaksi, dan proyek untuk menentukan tindakan penjualan. Kesimpulan dibatasi pada data yang benar-benar tercatat.</p></div></header>
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({label,value,detail,Icon})=><article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><Icon size={20} className="text-blue-500"/><p className="mt-3 text-xs text-zinc-500">{label}</p><p className="mt-1 text-xl font-extrabold">{value}</p><p className="mt-1 text-xs text-zinc-500">{detail}</p></article>)}</section>
    <section className="grid gap-5 md:grid-cols-2"><article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Konversi penjualan</h2><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Prospek tertutup</p><p className="mt-1 text-2xl font-extrabold">{closed}</p><p className="text-xs text-zinc-500">{won} menang · {lost} kalah</p></div><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Win rate prospek</p><p className="mt-1 text-2xl font-extrabold">{pct(leadConversion)}</p><p className="text-xs text-zinc-500">Menang ÷ menang+kalah</p></div><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Proposal terkirim/aktif</p><p className="mt-1 text-2xl font-extrabold">{sentProposals.length}</p></div><div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Konversi proposal</p><p className="mt-1 text-2xl font-extrabold">{pct(proposalConversion)}</p><p className="text-xs text-zinc-500">Proposal terhubung order atau berstatus menang</p></div></div></article>
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><Lightbulb className="text-blue-500" size={20}/><h2 className="font-extrabold">Rekomendasi tindakan</h2></div><div className="mt-4 space-y-3">{insights.map((x)=><div key={x.title} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><div className="flex items-center gap-2"><BadgeCheck className={x.tone==="good"?"text-emerald-600":"text-blue-500"} size={17}/><p className="font-bold">{x.title}</p></div><p className="mt-2 text-sm leading-6 text-zinc-500">{x.body}</p></div>)}</div></article></section>
    <section className="grid gap-5 xl:grid-cols-2"><article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Kategori transaksi bulan ini</h2><p className="mt-1 text-sm text-zinc-500">Margin dihitung dari transaksi kategori yang sama, bukan biaya penuh per layanan.</p><div className="mt-4 space-y-3">{categories.length ? categories.map((c)=><div key={c.name} className="border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{c.name}</p><p className="mt-1 text-xs text-zinc-500">Masuk {money(c.income)} · Biaya {money(c.expense)} · {c.count} transaksi</p></div><div className="text-right"><p className={`font-bold ${c.net<0?"text-red-600":"text-emerald-600"}`}>{money(c.net)}</p><p className="text-xs text-zinc-500">Margin {pct(c.margin)}</p></div></div></div>) : <p className="text-sm text-zinc-500">Belum ada transaksi bulan ini.</p>}</div></article>
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Profitabilitas proyek</h2><p className="mt-1 text-sm text-zinc-500">Menggunakan transaksi yang ditautkan ke proyek; jika tidak ada pemasukan proyek, nilai order dipakai sebagai proksi.</p><div className="mt-4 space-y-3">{projectProfit.length ? projectProfit.map((p)=><div key={p.id} className="border-b border-zinc-100 pb-3 last:border-0 dark:border-zinc-800"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{p.name}</p><p className="mt-1 text-xs text-zinc-500">{p.status} · Pemasukan/proksi {money(p.income)} · Biaya tercatat {money(p.cost)}</p></div><p className={`font-bold ${p.net<0?"text-red-600":"text-emerald-600"}`}>{money(p.net)}</p></div></div>) : <p className="text-sm text-zinc-500">Belum ada proyek untuk dianalisis.</p>}</div></article></section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Layanan dengan sinyal permintaan</h2><p className="mt-1 text-sm text-zinc-500">Berdasarkan jumlah prospek dan total nilai estimasi pada prospek berstatus menang; bukan margin layanan.</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{services.length ? services.map((s)=><div key={s.name} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><p className="font-bold">{s.name}</p><p className="mt-2 text-sm text-zinc-500">{s.count} prospek</p><p className="mt-1 text-sm font-extrabold">Nilai menang: {money(s.value)}</p></div>) : <p className="text-sm text-zinc-500">Belum ada data prospek.</p>}</div></section>
    <div className="flex flex-wrap gap-2"><Link href="/leads" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white">Perbarui CRM</Link><Link href="/proposals" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-700">Tinjau proposal</Link><Link href="/orders" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-700">Tinjau pesanan</Link><Link href="/finance" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-700">Perbarui biaya dan pemasukan</Link><Link href="/analytics" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-700">Business Intelligence <ArrowUpRight className="ml-1 inline" size={15}/></Link></div>
    <p className="text-xs leading-5 text-zinc-500">Batasan: margin kategori hanya menghitung transaksi berkategori sama. Profit proyek menghitung transaksi yang ditautkan ke proyek dan dapat menggunakan nilai order sebagai proksi pendapatan. Untuk keputusan harga final, catat seluruh biaya langsung, waktu kerja, revisi, dan overhead.</p>
  </div></main>;
}
