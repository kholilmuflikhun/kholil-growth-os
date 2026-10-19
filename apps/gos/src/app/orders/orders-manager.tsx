"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, CircleDollarSign, RefreshCw, ShoppingBag, Trash2 } from "lucide-react";

type Project = { id: string; name: string; status: string };
type AcceptedProposal = { id: string; title: string; amount: string | number; notes: string | null; lead: { name: string; contact: string; businessName: string | null; service: string } };
type Order = {
  id: string; proposalId: string | null; projectId: string | null; customerName: string; contact: string; title: string;
  amount: string | number; status: string; startDate: string | null; dueDate: string | null; notes: string | null;
  createdAt: string; proposal: { id: string; status: string; lead: { id: string; name: string; businessName: string | null } } | null;
  project: Project | null;
};
const labels: Record<string,string> = { CONFIRMED: "Dikonfirmasi", IN_PROGRESS: "Dikerjakan", DELIVERED: "Selesai / diserahkan", CANCELLED: "Dibatalkan" };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const fmtDate = (s: string | null) => s ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(s)) : "Belum diatur";
const dateInput = (s: string | null) => s ? new Date(s).toISOString().slice(0,10) : "";

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [accepted, setAccepted] = useState<AcceptedProposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [oRes, pRes] = await Promise.all([fetch("/api/orders", { cache: "no-store" }), fetch("/api/projects", { cache: "no-store" })]);
      const oJson = await oRes.json(); const pJson = await pRes.json();
      if (!oRes.ok) throw new Error(oJson.error || "Gagal memuat order.");
      if (!pRes.ok) throw new Error(pJson.error || "Gagal memuat proyek.");
      setOrders(oJson.data); setAccepted(oJson.acceptedProposals); setProjects(pJson.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function convert(proposalId: string) {
    setBusy(proposalId); setError(""); setNotice("");
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ proposalId }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat order.");
      setNotice(json.alreadyExists ? "Order untuk penawaran ini sudah pernah dibuat." : "Penawaran berhasil dikonversi menjadi order. Prospek ditandai sebagai menang.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal membuat order."); }
    finally { setBusy(""); }
  }
  async function patch(id: string, fields: Record<string, unknown>) {
    setBusy(id); setError(""); setNotice("");
    try {
      const res = await fetch("/api/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...fields }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui order.");
      setOrders(old => old.map(o => o.id === id ? { ...o, ...json.data } : o));
      setNotice("Order berhasil diperbarui.");
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memperbarui order."); }
    finally { setBusy(""); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus order ini? Penawaran asal tidak akan dihapus.")) return;
    const res = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { setError(json.error || "Gagal menghapus order."); return; }
    setOrders(old => old.filter(o => o.id !== id)); setNotice("Order dihapus.");
  }
  const total = useMemo(() => orders.filter(o => o.status !== "CANCELLED").reduce((sum,o) => sum + Number(o.amount),0), [orders]);
  const active = orders.filter(o => ["CONFIRMED","IN_PROGRESS"].includes(o.status)).length;
  const delivered = orders.filter(o => o.status === "DELIVERED").length;

  return <div className="space-y-6">
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    <section className="grid gap-3 sm:grid-cols-3">
      {[["Nilai order aktif",money(total)],["Perlu ditindaklanjuti",String(active)],["Selesai diserahkan",String(delivered)]].map(([label,value])=><article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></article>)}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-extrabold">Penawaran disetujui</h2><p className="mt-1 text-sm text-zinc-500">Konversi hanya penawaran berstatus Disetujui dan belum memiliki order.</p></div><button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-bold dark:border-zinc-700"><RefreshCw size={15}/>Muat ulang</button></div>
      {accepted.length === 0 ? <p className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800/60">Belum ada penawaran disetujui yang belum dikonversi. Perbarui status penawaran di <a className="font-bold text-blue-600" href="/proposals">Sales Pipeline & Proposals</a>.</p> : <div className="mt-4 grid gap-3 md:grid-cols-2">{accepted.map(p=><article key={p.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950"><ShoppingBag size={19}/></span><div className="min-w-0 flex-1"><h3 className="font-bold">{p.title}</h3><p className="mt-1 text-sm text-zinc-500">{p.lead.businessName || p.lead.name} · {p.lead.contact}</p><p className="mt-2 text-lg font-extrabold">{money(Number(p.amount))}</p></div></div><button disabled={busy === p.id} onClick={() => void convert(p.id)} className="mt-4 w-full rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{busy === p.id ? "Memproses..." : "Konversi menjadi order"}</button></article>)}</div>}
    </section>
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 p-5 dark:border-zinc-800"><div><h2 className="font-extrabold">Daftar order</h2><p className="mt-1 text-sm text-zinc-500">Kelola status, jadwal, dan proyek pelaksana.</p></div><span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold dark:bg-zinc-800">{orders.length} order</span></div>
      {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat order...</p> : orders.length === 0 ? <div className="p-8 text-center"><ShoppingBag className="mx-auto text-zinc-300" size={32}/><p className="mt-3 font-bold">Belum ada order</p><p className="mt-1 text-sm text-zinc-500">Setujui penawaran di modul Sales Pipeline & Proposals, lalu konversi di sini.</p></div> : <div className="divide-y divide-zinc-100 dark:divide-zinc-800">{orders.map(o=><article key={o.id} className="p-5"><div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-extrabold">{o.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${o.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700" : o.status === "CANCELLED" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>{labels[o.status] || o.status}</span></div><p className="mt-1 text-sm text-zinc-500">{o.customerName} · {o.contact}</p><p className="mt-2 text-xl font-extrabold">{money(Number(o.amount))}</p><p className="mt-2 text-xs text-zinc-500">Dibuat {fmtDate(o.createdAt)} · Tenggat: {fmtDate(o.dueDate)}</p>{o.proposal && <p className="mt-1 text-xs text-zinc-500">Sumber penawaran: {o.proposal.lead.businessName || o.proposal.lead.name}</p>}{o.project && <p className="mt-1 text-xs text-zinc-500">Proyek terkait: {o.project.name}</p>}</div>
      <div className="grid w-full gap-3 sm:grid-cols-2 xl:max-w-2xl"><label className="text-xs font-bold text-zinc-500">Status order<select value={o.status} onChange={e=>void patch(o.id,{status:e.target.value})} disabled={busy===o.id} className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white">{Object.entries(labels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="text-xs font-bold text-zinc-500">Proyek terkait<select value={o.projectId || ""} onChange={e=>void patch(o.id,{projectId:e.target.value || null})} disabled={busy===o.id} className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"><option value="">Tidak ditautkan</option>{projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="text-xs font-bold text-zinc-500">Tanggal mulai<input type="date" value={dateInput(o.startDate)} onChange={e=>void patch(o.id,{startDate:e.target.value || null})} className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <label className="text-xs font-bold text-zinc-500">Tenggat penyelesaian<input type="date" value={dateInput(o.dueDate)} onChange={e=>void patch(o.id,{dueDate:e.target.value || null})} className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <div className="flex items-center justify-between gap-3 sm:col-span-2"><p className="text-xs text-zinc-500"><CalendarClock className="mr-1 inline" size={14}/>Atur tanggal untuk membantu perencanaan kapasitas.</p><button onClick={()=>void remove(o.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"><Trash2 size={14}/>Hapus</button></div></div></div></article>)}</div>}
    </section>
    <p className="text-xs leading-5 text-zinc-500"><CircleDollarSign className="mr-1 inline" size={14}/>Nilai order bukan otomatis pemasukan kas. Catat pembayaran yang benar-benar diterima di modul Finance agar laporan arus kas tidak melebih-lebihkan pendapatan.</p>
  </div>;
}
