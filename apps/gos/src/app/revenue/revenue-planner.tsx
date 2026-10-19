"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Calculator, RefreshCw, Target, TrendingUp, Users, Wallet } from "lucide-react";

type Service = { id: string; name: string; category: string; priceFrom: number | null; currency: string; slug: string };
type Snapshot = {
  generatedAt: string; month: string;
  finance: { income: number; expense: number; net: number };
  pipeline: { total: number; open: number; won: number; lost: number; estimatedValue: number; winRate: number | null };
  activeGoal: { name: string; metric: string; targetValue: number; activeDays: number; startDate: string; endDate: string } | null;
  services: Service[];
};
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const integer = (n: number) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(n);

export default function RevenuePlanner() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dailyTarget, setDailyTarget] = useState("200000");
  const [activeDays, setActiveDays] = useState("26");
  const [averageOrder, setAverageOrder] = useState("500000");
  const [conversion, setConversion] = useState("25");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/revenue", { cache: "no-store" }); setLoading(true); setError(""); 
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Gagal memuat data revenue.");
      setSnapshot(json);
      if (json.activeGoal?.targetValue) setDailyTarget(String(Math.round(json.activeGoal.targetValue / Math.max(1, json.activeGoal.activeDays))));
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data revenue."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timeout = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeout); }, [load]);

  const calc = useMemo(() => {
    const daily = Math.max(0, Number(dailyTarget) || 0);
    const days = Math.max(1, Math.min(31, Number(activeDays) || 1));
    const order = Math.max(1, Number(averageOrder) || 1);
    const rate = Math.max(1, Math.min(100, Number(conversion) || 1)) / 100;
    const monthly = daily * days;
    const orders = Math.ceil(monthly / order);
    const leads = Math.ceil(orders / rate);
    const dailyOrders = orders / days;
    return { daily, days, order, rate, monthly, orders, leads, dailyOrders, gap: snapshot ? Math.max(0, monthly - snapshot.finance.income) : monthly };
  }, [dailyTarget, activeDays, averageOrder, conversion, snapshot]);

  const progress = snapshot && calc.monthly > 0 ? Math.min(100, snapshot.finance.income / calc.monthly * 100) : 0;

  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-extrabold">Kalkulator target pendapatan</h2><p className="mt-1 text-sm text-zinc-500">Mulai dari target, lalu uji skenario harga rata-rata dan konversi.</p></div><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><RefreshCw className="mr-1 inline" size={15}/>Perbarui</button></div>
    <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={e => e.preventDefault()} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-2"><Calculator className="text-blue-500"/><h3 className="font-extrabold">Parameter skenario</h3></div>
        <label className="block text-sm font-semibold">Target pendapatan per hari aktif (Rp)<input type="number" min="0" step="10000" value={dailyTarget} onChange={e => setDailyTarget(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"/></label>
        <label className="block text-sm font-semibold">Hari aktif per bulan<input type="number" min="1" max="31" value={activeDays} onChange={e => setActiveDays(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"/></label>
        <label className="block text-sm font-semibold">Rata-rata nilai transaksi (Rp)<input type="number" min="1" step="25000" value={averageOrder} onChange={e => setAverageOrder(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"/></label>
        <label className="block text-sm font-semibold">Asumsi konversi prospek menjadi transaksi (%)<input type="number" min="1" max="100" value={conversion} onChange={e => setConversion(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-950"/></label>
        {snapshot?.activeGoal && <p className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">Target aktif database: {snapshot.activeGoal.name} ({money(snapshot.activeGoal.targetValue)}). Perubahan parameter di sini hanya simulasi dan tidak mengubah Goal.</p>}
        <p className="text-xs leading-5 text-zinc-500">Nilai rata-rata transaksi dan tingkat konversi adalah asumsi yang dapat Anda ubah. Ganti dengan data historis setelah cukup banyak transaksi tercatat.</p>
      </form>
      <div className="space-y-4">
        <article className="rounded-2xl bg-zinc-950 p-5 text-white"><div className="flex items-center gap-2 text-blue-400"><Target size={19}/><p className="text-sm font-bold">Target pendapatan bulanan</p></div><p className="mt-3 text-3xl font-extrabold">{money(calc.monthly)}</p><p className="mt-2 text-sm text-zinc-400">{money(calc.daily)} × {calc.days} hari aktif</p>{snapshot && <><div className="mt-5 flex justify-between text-xs text-zinc-400"><span>Pemasukan tercatat bulan ini</span><span>{progress.toFixed(1)}%</span></div><div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${progress}%` }}/></div><p className="mt-2 text-xs text-zinc-400">Tercatat {money(snapshot.finance.income)} · selisih target simulasi {money(calc.gap)}</p></>}</article>
        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><Wallet className="text-blue-500" size={19}/><p className="mt-3 text-sm text-zinc-500">Transaksi dibutuhkan</p><p className="mt-1 text-2xl font-extrabold">{integer(calc.orders)}</p><p className="mt-1 text-xs text-zinc-500">Sekitar {integer(calc.dailyOrders)} transaksi per hari aktif</p></article>
          <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><Users className="text-blue-500" size={19}/><p className="mt-3 text-sm text-zinc-500">Prospek yang dibutuhkan</p><p className="mt-1 text-2xl font-extrabold">{integer(calc.leads)}</p><p className="mt-1 text-xs text-zinc-500">Pada asumsi konversi {integer(calc.rate * 100)}%</p></article>
        </div>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><TrendingUp className="text-blue-500"/><h3 className="font-extrabold">Kondisi pipeline saat ini</h3></div>{loading ? <p className="mt-3 text-sm text-zinc-500">Memuat data...</p> : snapshot && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Prospek aktif", snapshot.pipeline.open],["Menang", snapshot.pipeline.won],["Kalah", snapshot.pipeline.lost],["Win rate historis", snapshot.pipeline.winRate === null ? "—" : `${snapshot.pipeline.winRate.toFixed(1)}%`]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 text-lg font-extrabold">{value}</p></div>)}</div>}<p className="mt-3 text-xs leading-5 text-zinc-500">Nilai pipeline estimasi: {money(snapshot?.pipeline.estimatedValue ?? 0)}. Estimasi prospek tidak sama dengan uang yang sudah diterima.</p><Link href="/leads" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-blue-600">Buka CRM <ArrowUpRight size={15}/></Link></article>
      </div>
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Layanan aktif yang terdaftar</h2><p className="mt-1 text-sm text-zinc-500">Daftar di bawah hanya menampilkan layanan berstatus ACTIVE di database.</p>{snapshot?.services.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{snapshot.services.map(service => <article key={service.id} className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/70"><p className="font-bold">{service.name}</p><p className="mt-1 text-xs text-zinc-500">{service.category}</p><p className="mt-3 text-sm font-extrabold text-blue-600">{service.priceFrom === null ? "Harga belum diatur" : `Mulai ${money(service.priceFrom)}`}</p></article>)}</div> : <div className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800/70">Belum ada layanan ACTIVE yang terdaftar. Lengkapi katalog layanan melalui database/admin tools sebelum mengandalkan ringkasan katalog ini.</div>}</section>
    <p className="text-xs leading-5 text-zinc-500">Simulasi ini memakai target pendapatan, bukan laba bersih. Biaya operasional, pajak, pembatalan, keterlambatan pembayaran, dan variasi nilai transaksi belum dihitung.</p>
  </div>;
}
