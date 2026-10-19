"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Target, Check } from "lucide-react";

type Goal = { id: string; name: string; metric: string; targetValue: string | number; startDate: string; endDate: string; activeDays: number; status: string; description: string | null };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
export default function GoalsManager() {
  const [goals, setGoals] = useState<Goal[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const load = useCallback(async () => { setLoading(true); setError(""); try { const r = await fetch("/api/goals", { cache: "no-store" }); const j = await r.json(); if (!r.ok) throw new Error(j.error || "Gagal memuat target."); setGoals(j.data); } catch(e) { setError(e instanceof Error ? e.message : "Gagal memuat target."); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice(""); const f = new FormData(e.currentTarget);
    const r = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: f.get("name"), metric: f.get("metric"), targetValue: f.get("targetValue"), startDate: f.get("startDate"), endDate: f.get("endDate"), activeDays: f.get("activeDays"), description: f.get("description") }) });
    const j = await r.json(); if (!r.ok) { setError(j.error || "Gagal membuat target."); return; } e.currentTarget.reset(); setNotice("Target berhasil dibuat."); await load();
  }
  async function change(id: string, status: string) {
    const r = await fetch("/api/goals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) }); const j = await r.json();
    if (!r.ok) { setError(j.error || "Gagal memperbarui status."); return; }
    setGoals(old => old.map(g => g.id === id ? { ...g, status } : g)); setNotice("Status target diperbarui.");
  }
  return <div className="space-y-6">
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2">
      <div className="md:col-span-2"><h2 className="font-extrabold">Buat target baru</h2><p className="mt-1 text-sm text-zinc-500">Contoh: target pendapatan, target jumlah klien, atau target produksi.</p></div>
      <input required minLength={3} name="name" placeholder="Nama target *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input required name="metric" minLength={2} maxLength={80} placeholder="Metrik, mis. Pendapatan (Rp) *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <input required name="targetValue" type="number" min="1" placeholder="Nilai target *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <label className="text-xs font-semibold text-zinc-500">Tanggal mulai<input required name="startDate" type="date" defaultValue={new Date().toISOString().slice(0,10)} className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <label className="text-xs font-semibold text-zinc-500">Tanggal selesai<input required name="endDate" type="date" defaultValue={new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString().slice(0,10)} className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <label className="text-xs font-semibold text-zinc-500">Hari aktif<input required name="activeDays" type="number" min="1" max="31" defaultValue="26" className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <input name="description" maxLength={1000} placeholder="Catatan strategi (opsional)" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <button className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white md:col-span-2">Simpan target</button>
    </form>
    <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Daftar target</h2><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={15}/>Muat ulang</button></div>
    {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat target...</p> : goals.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700"><Target className="mx-auto text-zinc-400" size={30}/><p className="mt-3 font-bold">Belum ada target di database</p><p className="mt-1 text-sm text-zinc-500">Gunakan formulir di atas untuk membuat target operasional pertama.</p></div> : <div className="grid gap-3 md:grid-cols-2">{goals.map(g => <article key={g.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-start justify-between gap-3"><div><h3 className="font-extrabold">{g.name}</h3><p className="mt-1 text-xs text-zinc-500">{new Date(g.startDate).toLocaleDateString("id-ID")} – {new Date(g.endDate).toLocaleDateString("id-ID")}</p></div><select aria-label={`Status target ${g.name}`} value={g.status} onChange={e => void change(g.id, e.target.value)} className="rounded-lg border bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950">{[["ACTIVE","Aktif"],["PAUSED","Jeda"],["COMPLETED","Selesai"],["CANCELLED","Dibatalkan"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><p className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">{g.metric}</p><p className="mt-1 text-2xl font-extrabold text-blue-600">{money(Number(g.targetValue))}</p><p className="mt-1 text-xs text-zinc-500">Rata-rata {money(Number(g.targetValue) / Math.max(1,g.activeDays))} per hari aktif · {g.activeDays} hari aktif</p>{g.description && <p className="mt-3 text-sm leading-6 text-zinc-500">{g.description}</p>}</article>)}</div>}
  </div>;
}
