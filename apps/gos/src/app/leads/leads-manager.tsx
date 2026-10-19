"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Search, Trash2, Save, Plus, History, CalendarClock, UserRound, X, ExternalLink } from "lucide-react";

type Lead = {
  id: string; name: string; contact: string; businessName: string | null; service: string;
  message: string; source: string; status: string; estimatedValue: string | number | null;
  probability: number; owner: string | null; lostReason: string | null;
  nextFollowUp: string | null; createdAt: string;
  activities?: { id: string; type: string; note: string; dueAt: string | null; createdBy: string | null; createdAt: string }[];
};
const statuses = [
  ["NEW", "Prospek baru"], ["CONTACTED", "Sudah dihubungi"], ["QUALIFIED", "Terkualifikasi"],
  ["DISCOVERY", "Konsultasi"], ["PROPOSAL", "Proposal terkirim"], ["NEGOTIATION", "Negosiasi"],
  ["WON", "Menang"], ["LOST", "Tidak lanjut"],
];
const money = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const date = (s: string) => new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activityType, setActivityType] = useState("FOLLOW_UP");
  const [activityNote, setActivityNote] = useState("");
  const [activityDue, setActivityDue] = useState("");
  const [ownerDraft, setOwnerDraft] = useState("Kholil");
  const [probabilityDraft, setProbabilityDraft] = useState(10);
  const [lostReasonDraft, setLostReasonDraft] = useState("");
  const [messageDraft, setMessageDraft] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/leads", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Gagal memuat prospek.");
      setLeads(result.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat data."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function update(id: string, patch: Record<string, unknown>) {
    setNotice(""); setError("");
    const response = await fetch("/api/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Perubahan gagal disimpan."); return; }
    setLeads(old => old.map(item => item.id === id ? { ...item, ...result.data } : item));
    setNotice("Perubahan prospek tersimpan.");
    if (selectedLead?.id === id) setSelectedLead(old => old ? { ...old, ...result.data } : old);
    if (patch.status !== undefined || patch.message !== undefined) await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus prospek ini? Tindakan ini tidak dapat dibatalkan.")) return;
    const response = await fetch(`/api/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal menghapus prospek."); return; }
    setLeads(old => old.filter(item => item.id !== id)); setNotice("Prospek dihapus.");
  }
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""), contact: String(form.get("contact") || ""),
      businessName: String(form.get("businessName") || ""), service: String(form.get("service") || ""),
      message: String(form.get("message") || ""), consent: true,
    };
    const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Gagal membuat prospek."); return; }
    event.currentTarget.reset(); setShowForm(false); setNotice("Prospek baru berhasil ditambahkan."); await load();
  }

  const visible = leads.filter(l => [l.name, l.businessName || "", l.contact, l.service, l.status].join(" ").toLowerCase().includes(query.toLowerCase()));
  const active = leads.filter(l => !["WON", "LOST"].includes(l.status)).length;
  const pipelineValue = leads.filter(l => !["WON", "LOST"].includes(l.status)).reduce((sum, l) => sum + Number(l.estimatedValue || 0), 0);
  const weighted = leads.filter(l => !["WON", "LOST"].includes(l.status)).reduce((sum, l) => sum + Number(l.estimatedValue || 0) * (Number(l.probability ?? 10) / 100), 0);
  const dueSoon = leads.filter(l => l.nextFollowUp && new Date(l.nextFollowUp).getTime() <= Date.now() + 3 * 86400000 && !["WON", "LOST"].includes(l.status)).length;
  async function addActivity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedLead) return;
    setError(""); setNotice("");
    const response = await fetch(`/api/leads/${encodeURIComponent(selectedLead.id)}/activities`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: activityType, note: activityNote, dueAt: activityDue || null }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Aktivitas gagal disimpan."); return; }
    setActivityNote(""); setNotice("Aktivitas berhasil dicatat."); await load();
    setSelectedLead(old => old ? { ...old, activities: [result.data, ...(old.activities || [])], nextFollowUp: activityDue || old.nextFollowUp } : old);
  }
  async function saveLeadDetail() {
    if (!selectedLead) return;
    await update(selectedLead.id, { owner: ownerDraft || null, probability: probabilityDraft, lostReason: lostReasonDraft || null, message: messageDraft });
  }

  return <div className="space-y-6">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[["Total prospek", String(leads.length)], ["Pipeline aktif", String(active)], ["Nilai estimasi aktif", money(weighted)]].map(([label, value]) => <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></div>)}
    </div>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-3 text-zinc-400" size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari nama, bisnis, kontak, layanan..." className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 dark:border-zinc-800 dark:bg-zinc-900"/></div>
      <button onClick={() => setShowForm(v => !v)} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white"><Plus className="mr-1 inline" size={16}/>{showForm ? "Tutup form" : "Tambah prospek"}</button>
      <button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={16}/>Muat ulang</button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300">{notice}</p>}
    {showForm && <form onSubmit={create} className="grid gap-3 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 dark:border-blue-900 dark:bg-blue-950/20 sm:grid-cols-2">
      <h2 className="font-extrabold sm:col-span-2">Tambah prospek manual</h2>
      <input required minLength={2} name="name" placeholder="Nama kontak *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"/>
      <input required minLength={5} name="contact" placeholder="WhatsApp / email *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"/>
      <input name="businessName" placeholder="Nama bisnis" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"/>
      <input required name="service" placeholder="Layanan yang dibutuhkan *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"/>
      <textarea required minLength={10} name="message" placeholder="Catatan kebutuhan (minimal 10 karakter) *" className="min-h-24 rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:col-span-2"/>
      <button className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-bold text-white sm:col-span-2">Simpan prospek</button>
    </form>}
    <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat data prospek...</p> : visible.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">Belum ada prospek. Tambahkan secara manual atau hubungkan formulir website.</p> : <table className="w-full min-w-[1050px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/60"><tr>{["Prospek / bisnis", "Kontak & layanan", "Status pipeline", "Nilai peluang / forecast", "Follow-up", "Aksi"].map(x => <th key={x} className="px-4 py-3 font-semibold">{x}</th>)}</tr></thead>
        <tbody>{visible.map(l => <tr key={l.id} className="border-t border-zinc-100 align-top dark:border-zinc-800">
          <td className="px-4 py-4"><p className="font-bold">{l.businessName || l.name}</p>{l.businessName && <p className="text-xs text-zinc-500">{l.name}</p>}<p className="mt-1 text-xs text-zinc-400">{date(l.createdAt)} · {l.source}</p><p className="mt-2 max-w-xs whitespace-normal text-xs text-zinc-500">{l.message}</p></td>
          <td className="px-4 py-4"><p>{l.contact}</p><p className="mt-1 text-xs text-zinc-500">{l.service}</p></td>
          <td className="px-4 py-4"><select value={l.status} onChange={e => void update(l.id, { status: e.target.value })} className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900">{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
          <td className="px-4 py-4"><input aria-label={`Nilai estimasi ${l.name}`} type="number" min="0" value={l.estimatedValue ?? ""} onChange={e => setLeads(old => old.map(x => x.id === l.id ? { ...x, estimatedValue: e.target.value } : x))} onBlur={e => void update(l.id, { estimatedValue: e.target.value })} placeholder="Rp" className="w-32 rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"/><p className="mt-1 text-[11px] text-zinc-500">{l.probability ?? 10}% × {money(Number(l.estimatedValue || 0) * Number(l.probability ?? 10) / 100)}</p></td>
          <td className="px-4 py-4"><input aria-label={`Tanggal follow-up ${l.name}`} type="date" value={l.nextFollowUp ? new Date(l.nextFollowUp).toISOString().slice(0,10) : ""} onChange={e => void update(l.id, { nextFollowUp: e.target.value || null })} className="rounded-lg border border-zinc-200 bg-white px-2 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"/></td>
          <td className="px-4 py-4 whitespace-nowrap"><button title="Buka detail CRM" onClick={() => { setSelectedLead(l); setOwnerDraft(l.owner || "Kholil"); setProbabilityDraft(l.probability ?? 10); setLostReasonDraft(l.lostReason || ""); setMessageDraft(l.message || ""); }} className="mr-2 rounded-lg border border-blue-200 p-2 text-blue-700 dark:border-blue-900"><ExternalLink size={15}/></button><button title="Simpan nilai estimasi" onClick={() => void update(l.id, { estimatedValue: l.estimatedValue })} className="mr-2 rounded-lg border p-2 dark:border-zinc-700"><Save size={15}/></button><button title="Hapus prospek" onClick={() => void remove(l.id)} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 size={15}/></button></td>
        </tr>)}</tbody>
      </table>}
    </div>
    {selectedLead && <section className="space-y-5 rounded-2xl border border-blue-200 bg-white p-5 dark:border-blue-900 dark:bg-zinc-900">
      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-blue-600">Detail CRM · {selectedLead.id}</p><h2 className="mt-1 text-xl font-extrabold">{selectedLead.businessName || selectedLead.name}</h2><p className="text-sm text-zinc-500">{selectedLead.name} · {selectedLead.contact}</p></div><button aria-label="Tutup detail" onClick={() => setSelectedLead(null)} className="rounded-lg border p-2 dark:border-zinc-700"><X size={16}/></button></div>
      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Nilai peluang</p><p className="mt-1 font-extrabold">{money(Number(selectedLead.estimatedValue || 0))}</p></div><div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Probabilitas</p><p className="mt-1 font-extrabold">{probabilityDraft}%</p></div><div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800"><p className="text-xs text-zinc-500">Forecast tertimbang</p><p className="mt-1 font-extrabold">{money(Number(selectedLead.estimatedValue || 0) * probabilityDraft / 100)}</p></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Penanggung jawab<input value={ownerDraft} onChange={e => setOwnerDraft(e.target.value)} maxLength={120} className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"/></label><label className="block text-sm font-semibold">Probabilitas menang: {probabilityDraft}%<input type="range" min="0" max="100" step="5" value={probabilityDraft} onChange={e => setProbabilityDraft(Number(e.target.value))} className="mt-3 block w-full accent-blue-500"/><span className="text-xs font-normal text-zinc-500">Nilai awal pipeline: New 10%, Contacted 25%, Qualified 50%, Proposal 70%, Negotiation 85%.</span></label></div>
      <label className="block text-sm font-semibold">Catatan kebutuhan / kualifikasi<textarea value={messageDraft} onChange={e => setMessageDraft(e.target.value)} maxLength={3000} rows={3} placeholder="Kebutuhan, anggaran, target waktu, hambatan, dan keputusan berikutnya" className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"/></label>
      {selectedLead.status === "LOST" && <label className="block text-sm font-semibold">Alasan tidak lanjut<input value={lostReasonDraft} onChange={e => setLostReasonDraft(e.target.value)} maxLength={1000} placeholder="Contoh: anggaran belum sesuai" className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"/></label>}
      <button onClick={() => void saveLeadDetail()} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white"><Save className="mr-1 inline" size={16}/>Simpan detail</button>
      <div className="grid gap-4 lg:grid-cols-2"><form onSubmit={addActivity} className="space-y-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800"><h3 className="font-extrabold"><History className="mr-2 inline" size={17}/>Catat aktivitas</h3><label className="block text-sm font-medium">Jenis aktivitas<select value={activityType} onChange={e => setActivityType(e.target.value)} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">{[["FOLLOW_UP","Follow-up"],["CALL","Telepon"],["MEETING","Konsultasi / meeting"],["PROPOSAL","Penawaran"],["EMAIL","Email"],["DM","DM / pesan masuk"],["NOTE","Catatan internal"],["PAYMENT","Pembayaran"]].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label className="block text-sm font-medium">Catatan hasil<textarea required minLength={2} maxLength={3000} value={activityNote} onChange={e => setActivityNote(e.target.value)} placeholder="Apa yang dibahas dan langkah berikutnya?" className="mt-1 block min-h-24 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-900"/></label><label className="block text-sm font-medium"><CalendarClock className="mr-1 inline" size={15}/>Jadwal follow-up berikutnya<input type="datetime-local" value={activityDue} onChange={e => setActivityDue(e.target.value)} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal dark:border-zinc-700 dark:bg-zinc-900"/></label><button className="w-full rounded-lg bg-zinc-950 px-3 py-2.5 text-sm font-bold text-white dark:bg-blue-500">Simpan aktivitas</button></form>
      <div className="space-y-3"><h3 className="font-extrabold">Riwayat aktivitas ({selectedLead.activities?.length || 0})</h3>{(selectedLead.activities || []).length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-zinc-500">Belum ada aktivitas. Catat komunikasi pertama untuk membangun riwayat follow-up.</p> : (selectedLead.activities || []).map(a => <div key={a.id} className="border-l-2 border-blue-400 py-1 pl-3"><div className="flex flex-wrap justify-between gap-2"><p className="text-sm font-bold">{a.type}</p><time className="text-xs text-zinc-500">{new Date(a.createdAt).toLocaleString("id-ID")}</time></div><p className="mt-1 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-300">{a.note}</p>{a.dueAt && <p className="mt-1 text-xs text-blue-600">Follow-up: {new Date(a.dueAt).toLocaleString("id-ID")}</p>}<p className="mt-1 text-[11px] text-zinc-400">Oleh: {a.createdBy || "Sistem"}</p></div>)}</div></div>
    </section>}
    <p className="text-xs leading-5 text-zinc-500">Pipeline, nilai peluang, probabilitas, follow-up, dan aktivitas disimpan ke PostgreSQL. Forecast tertimbang dihitung dari nilai estimasi × probabilitas menang; angka ini bukan omzet yang sudah diterima.</p>
  </div>;
}
