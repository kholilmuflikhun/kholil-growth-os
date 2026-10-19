"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, FileCheck2, RefreshCw, Trash2 } from "lucide-react";

type Lead = { id: string; name: string; businessName: string | null; service: string; status: string };
type Proposal = { id: string; leadId: string; title: string; amount: string | number; status: string; sentAt: string | null; validUntil: string | null; notes: string | null; createdAt: string; lead: Lead };
const statusLabels: Record<string,string> = { DRAFT: "Draft", SENT: "Terkirim", ACCEPTED: "Disetujui", REJECTED: "Ditolak", EXPIRED: "Kedaluwarsa" };
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const date = (s: string | null) => s ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(s)) : "—";

export default function ProposalManager() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [pRes, lRes] = await Promise.all([fetch("/api/proposals", { cache: "no-store" }), fetch("/api/leads", { cache: "no-store" })]);
      const pJson = await pRes.json(); const lJson = await lRes.json();
      if (!pRes.ok) throw new Error(pJson.error || "Gagal memuat penawaran.");
      if (!lRes.ok) throw new Error(lJson.error || "Gagal memuat prospek.");
      setProposals(pJson.data); setLeads(lJson.data.filter((l: Lead) => !["WON", "LOST"].includes(l.status)));
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/proposals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      leadId: String(form.get("leadId") || ""), title: String(form.get("title") || ""),
      amount: Number(form.get("amount")), validUntil: String(form.get("validUntil") || "") || null,
      notes: String(form.get("notes") || ""),
    }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal membuat penawaran."); return; }
    event.currentTarget.reset(); setShowForm(false); setNotice("Penawaran berhasil dibuat dan nilai estimasi prospek diperbarui."); await load();
  }
  async function update(id: string, fields: Record<string, unknown>) {
    setError(""); setNotice("");
    const response = await fetch("/api/proposals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...fields }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal memperbarui penawaran."); return; }
    setProposals(old => old.map(p => p.id === id ? { ...p, ...result.data } : p)); setNotice("Status penawaran diperbarui.");
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus penawaran ini?")) return;
    const response = await fetch(`/api/proposals?id=${encodeURIComponent(id)}`, { method: "DELETE" }); const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal menghapus penawaran."); return; }
    setProposals(old => old.filter(p => p.id !== id)); setNotice("Penawaran dihapus.");
  }
  const totals = {
    draft: proposals.filter(p => p.status === "DRAFT").reduce((s,p) => s + Number(p.amount),0),
    sent: proposals.filter(p => p.status === "SENT").reduce((s,p) => s + Number(p.amount),0),
    accepted: proposals.filter(p => p.status === "ACCEPTED").reduce((s,p) => s + Number(p.amount),0),
  };
  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">{[["Nilai draft", totals.draft], ["Nilai terkirim", totals.sent], ["Nilai disetujui", totals.accepted]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{money(Number(value))}</p></article>)}</section>
    <div className="flex flex-wrap gap-2"><button onClick={() => setShowForm(v => !v)} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white">{showForm ? "Tutup form" : "Buat penawaran"}</button><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={16}/>Muat ulang</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    {showForm && <form onSubmit={create} className="grid gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20 md:grid-cols-2">
      <h2 className="font-extrabold md:col-span-2">Buat penawaran baru</h2>
      <label className="text-sm font-semibold">Prospek *<select required name="leadId" defaultValue="" className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"><option value="" disabled>Pilih prospek</option>{leads.map(l => <option key={l.id} value={l.id}>{l.businessName ? `${l.businessName} — ${l.name}` : l.name} · {l.service}</option>)}</select></label>
      <label className="text-sm font-semibold">Judul penawaran *<input required minLength={3} maxLength={180} name="title" placeholder="Contoh: Paket Brand Identity" className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"/></label>
      <label className="text-sm font-semibold">Nilai penawaran (Rp) *<input required type="number" min="1" max="1000000000000" name="amount" className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"/></label>
      <label className="text-sm font-semibold">Berlaku sampai<input type="date" name="validUntil" className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"/></label>
      <label className="text-sm font-semibold md:col-span-2">Catatan / ruang lingkup<textarea name="notes" rows={3} maxLength={2000} className="mt-1.5 block w-full rounded-xl border bg-white px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900"/></label>
      <button disabled={leads.length === 0} className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40 md:col-span-2">Simpan penawaran</button>
      {leads.length === 0 && <p className="text-xs text-zinc-500 md:col-span-2">Tambahkan prospek aktif di CRM sebelum membuat penawaran.</p>}
    </form>}
    {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat penawaran...</p> : proposals.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><FileCheck2 className="mx-auto text-zinc-400" size={32}/><p className="mt-3 font-bold">Belum ada penawaran</p><p className="mt-1 text-sm text-zinc-500">Buat penawaran dari prospek aktif untuk mulai mengukur pipeline penjualan.</p></div> : <div className="grid gap-3 lg:grid-cols-2">{proposals.map(p => <article key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950" : p.status === "REJECTED" || p.status === "EXPIRED" ? "bg-red-50 text-red-700 dark:bg-red-950" : "bg-blue-50 text-blue-700 dark:bg-blue-950"}`}>{statusLabels[p.status] || p.status}</span><h3 className="mt-3 font-extrabold">{p.title}</h3><p className="mt-1 text-sm text-zinc-500">{p.lead.businessName || p.lead.name} · {p.lead.service}</p></div><button onClick={() => void remove(p.id)} aria-label={`Hapus ${p.title}`} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 size={15}/></button></div>
      <p className="mt-4 text-2xl font-extrabold">{money(Number(p.amount))}</p><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-500"><p>Dibuat: {date(p.createdAt)}</p><p>Berlaku: {date(p.validUntil)}</p><p>Terkirim: {date(p.sentAt)}</p></div>{p.notes && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">{p.notes}</p>}
      <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">{p.status === "DRAFT" && <button onClick={() => void update(p.id, { status: "SENT" })} className="rounded-xl bg-blue-500 px-3 py-2 text-xs font-bold text-white">Tandai terkirim</button>}{p.status === "SENT" && <><button onClick={() => void update(p.id, { status: "ACCEPTED" })} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Check className="mr-1 inline" size={14}/>Disetujui</button><button onClick={() => void update(p.id, { status: "REJECTED" })} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Ditolak</button></>}{["DRAFT","SENT"].includes(p.status) && <button onClick={() => void update(p.id, { status: "EXPIRED" })} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Kedaluwarsa</button>}</div>
    </article>)}</div>}
  </div>;
}
