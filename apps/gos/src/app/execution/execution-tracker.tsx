"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, Clock3, RefreshCw, Trash2, TrendingUp, Wallet } from "lucide-react";

type Entry = { id: string; activityDate: string; activity: string; category: string; outcome: string | null; revenueAmount: string | number; expenseAmount: string | number; minutesSpent: number; actionId: string | null; action?: { id: string; title: string; status: string } | null };
type ActionOption = { id: string; title: string };
type Summary = { revenue: number; expenses: number; net: number; minutes: number; entryCount: number; activeDays: number; targetMonthly: number; activeDaysTarget: number; dailyTarget: number; todayRevenue: number; todayGap: number; progress: number };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const categories = [{ value: "SALES", label: "Penjualan & follow-up" }, { value: "DELIVERY", label: "Produksi & delivery" }, { value: "CONTENT", label: "Konten & personal brand" }, { value: "ADMIN", label: "Administrasi" }, { value: "LEARNING", label: "Belajar & peningkatan skill" }, { value: "OTHER", label: "Lainnya" }];
export default function ExecutionTracker() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rows, setRows] = useState<Entry[]>([]);
  const [actions, setActions] = useState<ActionOption[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/execution?month=${encodeURIComponent(month)}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memuat tracker.");
      setRows(result.data); setActions(result.actions); setSummary(result.summary);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat tracker."); }
    finally { setLoading(false); }
  }, [month]);
  useEffect(() => { void load(); }, [load]);
  const totals = useMemo(() => ({ revenue: rows.reduce((s,r) => s + Number(r.revenueAmount),0), expenses: rows.reduce((s,r) => s + Number(r.expenseAmount),0), minutes: rows.reduce((s,r) => s + r.minutesSpent,0) }), [rows]);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/execution", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      activityDate: String(form.get("activityDate")), activity: String(form.get("activity")), category: String(form.get("category")), outcome: String(form.get("outcome") || ""),
      revenueAmount: Number(form.get("revenueAmount") || 0), expenseAmount: Number(form.get("expenseAmount") || 0), minutesSpent: Number(form.get("minutesSpent") || 0), actionId: String(form.get("actionId") || ""),
    }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal menyimpan aktivitas."); setBusy(false); return; }
    event.currentTarget.reset(); setNotice("Aktivitas berhasil dicatat."); setBusy(false); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus catatan aktivitas ini?")) return;
    const response = await fetch(`/api/execution?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal menghapus."); return; }
    setNotice("Catatan aktivitas dihapus."); await load();
  }
  return <div className="space-y-6">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label className="text-sm font-semibold">Periode tracker<input type="month" value={month} onChange={e => setMonth(e.target.value)} className="mt-2 block rounded-xl border border-zinc-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900"/></label><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={16}/>Muat ulang</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
    {summary && <><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
      { label: "Target harian", value: money(summary.dailyTarget), sub: `Sisa hari ini ${money(summary.todayGap)}`, icon: TrendingUp },
      { label: "Pemasukan tercatat", value: money(totals.revenue), sub: `${summary.progress.toFixed(1)}% dari target bulanan`, icon: Wallet },
      { label: "Biaya teratribusi", value: money(totals.expenses), sub: `Selisih ${money(totals.revenue-totals.expenses)}`, icon: Activity },
      { label: "Waktu eksekusi", value: `${Math.floor(totals.minutes/60)}j ${totals.minutes%60}m`, sub: `${summary.activeDays} hari aktif tercatat`, icon: Clock3 },
    ].map(({label,value,sub,icon:Icon}) => <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between"><p className="text-sm text-zinc-500">{label}</p><Icon className="text-blue-500" size={20}/></div><p className="mt-3 text-2xl font-extrabold">{value}</p><p className="mt-2 text-xs text-zinc-500">{sub}</p></article>)}</div>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center justify-between gap-4"><div><h2 className="font-extrabold">Progres target bulanan</h2><p className="mt-1 text-sm text-zinc-500">Target {money(summary.targetMonthly)} · {summary.activeDaysTarget} hari aktif</p></div><p className="text-lg font-extrabold text-blue-600">{summary.progress.toFixed(1)}%</p></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className="h-full rounded-full bg-blue-500 transition-all" style={{width:`${summary.progress}%`}}/></div><div className="mt-3 flex justify-between text-xs text-zinc-500"><span>Tercatat: {money(totals.revenue)}</span><span>Sisa: {money(Math.max(0,summary.targetMonthly-totals.revenue))}</span></div></section></>}
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2 xl:col-span-4"><h2 className="font-extrabold">Catat eksekusi harian</h2><p className="mt-1 text-sm text-zinc-500">Isi aktivitas, hasil, waktu, serta pemasukan/biaya yang dapat diatribusikan pada aktivitas tersebut.</p></div>
      <input required name="activity" minLength={3} maxLength={180} placeholder="Aktivitas, mis. Follow-up 5 prospek" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"/>
      <select name="category" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950">{categories.map(c=><option key={c.value} value={c.value}>{c.label}</option>)}</select>
      <input required type="date" name="activityDate" defaultValue={today()} className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input type="number" name="revenueAmount" min="0" step="1" defaultValue="0" placeholder="Pemasukan terkait (Rp)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input type="number" name="expenseAmount" min="0" step="1" defaultValue="0" placeholder="Biaya terkait (Rp)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input type="number" name="minutesSpent" min="0" max="1440" step="1" defaultValue="30" placeholder="Durasi (menit)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <select name="actionId" defaultValue="" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="">Tanpa tindakan terkait</option>{actions.map(a=><option key={a.id} value={a.id}>{a.title}</option>)}</select>
      <input name="outcome" maxLength={1200} placeholder="Hasil / tindak lanjut (opsional)" className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 md:col-span-2"/>
      <button disabled={busy} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-60 md:col-span-2 xl:col-span-4"><CheckCircle2 className="mr-1 inline" size={16}/>{busy ? "Menyimpan..." : "Simpan aktivitas"}</button>
    </form>
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"><div className="border-b border-zinc-100 p-5 dark:border-zinc-800"><h2 className="font-extrabold">Riwayat eksekusi</h2><p className="mt-1 text-sm text-zinc-500">Catatan periode {month}; hapus catatan yang salah input.</p></div>{loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat catatan...</p> : rows.length===0 ? <div className="p-8 text-center"><Activity className="mx-auto text-zinc-300" size={30}/><p className="mt-3 font-bold">Belum ada aktivitas</p><p className="mt-1 text-sm text-zinc-500">Mulai dengan mencatat satu aktivitas hari ini.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60"><tr>{["Tanggal / aktivitas","Kategori / tindakan","Hasil","Durasi","Pemasukan","Biaya",""].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800"><td className="px-4 py-4"><p className="font-bold">{new Date(r.activityDate).toLocaleDateString("id-ID")}</p><p className="mt-1 max-w-56 whitespace-normal">{r.activity}</p></td><td className="px-4 py-4"><p>{categories.find(c=>c.value===r.category)?.label || r.category}</p>{r.action && <p className="mt-1 text-xs text-blue-600">{r.action.title}</p>}</td><td className="max-w-52 whitespace-normal px-4 py-4 text-zinc-500">{r.outcome || "—"}</td><td className="px-4 py-4">{r.minutesSpent} mnt</td><td className="px-4 py-4 font-bold text-emerald-600">{money(Number(r.revenueAmount))}</td><td className="px-4 py-4 font-bold">{money(Number(r.expenseAmount))}</td><td className="px-4 py-4"><button onClick={()=>void remove(r.id)} aria-label="Hapus catatan" className="rounded-lg p-2 text-red-600 hover:bg-red-50"><Trash2 size={16}/></button></td></tr>)}</tbody></table></div>}</section>
    <p className="text-xs leading-5 text-zinc-500">Catatan penting: pemasukan dan biaya di tracker ini hanya untuk atribusi aktivitas, tidak otomatis membuat transaksi di Finance. Masukkan transaksi ke Finance secara terpisah untuk laporan keuangan resmi; hindari menjumlahkan kedua sumber agar tidak terjadi duplikasi.</p>
  </div>;
}
