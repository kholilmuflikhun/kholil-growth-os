"use client";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { BellRing, Check, Clock3, RefreshCw, Trash2 } from "lucide-react";
import { useCurrentTime } from "@/lib/use-current-time";

type Reminder = { id: string; title: string; description: string | null; dueAt: string; priority: string; status: string; createdAt: string };
const moneylessDate = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const priorityLabel: Record<string,string> = { LOW: "Rendah", MEDIUM: "Sedang", HIGH: "Tinggi" };

export default function ReminderManager() {
  const [items, setItems] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/reminders", { cache: "no-store" }); setLoading(true); setError(""); 
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Gagal memuat pengingat.");
      setItems(json.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat pengingat."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { const timeout = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timeout); }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const dueLocal = String(data.get("dueAt") || "");
    const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: data.get("title"), description: data.get("description"), dueAt: dueLocal ? new Date(dueLocal).toISOString() : "", priority: data.get("priority") }) });
    const json = await response.json();
    if (!response.ok) { setError(json.error || "Gagal membuat pengingat."); return; }
    form.reset(); setNotice("Pengingat berhasil dibuat."); await load();
  }
  async function patch(id: string, fields: Record<string, unknown>) {
    setError(""); const response = await fetch("/api/reminders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...fields }) });
    const json = await response.json();
    if (!response.ok) { setError(json.error || "Gagal memperbarui pengingat."); return; }
    setItems(old => old.map(item => item.id === id ? { ...item, ...json.data } : item)); setNotice("Pengingat diperbarui.");
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus pengingat ini?")) return;
    const response = await fetch(`/api/reminders?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = await response.json();
    if (!response.ok) { setError(json.error || "Gagal menghapus pengingat."); return; }
    setItems(old => old.filter(item => item.id !== id)); setNotice("Pengingat dihapus.");
  }
  const now = useCurrentTime();
  const open = items.filter(item => item.status === "OPEN");
  const overdue = now === null ? [] : open.filter(item => new Date(item.dueAt).getTime() < now);
  const today = now === null ? [] : open.filter(item => new Date(item.dueAt).toDateString() === new Date(now).toDateString());
  const done = items.filter(item => item.status === "DONE");

  return <div className="space-y-6">
    <section className="grid gap-3 sm:grid-cols-3">{[["Belum selesai", open.length], ["Terlambat", overdue.length], ["Selesai", done.length]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 text-2xl font-extrabold">{value}</p></article>)}</section>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</p>}
    <form onSubmit={create} className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2 xl:grid-cols-4">
      <div className="md:col-span-2 xl:col-span-4"><h2 className="font-extrabold">Buat pengingat / tindakan</h2><p className="mt-1 text-sm text-zinc-500">Contoh: follow-up prospek, kirim proposal, tagih invoice, atau evaluasi konten.</p></div>
      <input required minLength={3} maxLength={180} name="title" placeholder="Judul tindakan *" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"/>
      <label className="text-xs font-semibold text-zinc-500">Tenggat waktu *<input required name="dueAt" type="datetime-local" className="mt-1 block w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"/></label>
      <select name="priority" defaultValue="MEDIUM" aria-label="Prioritas" className="rounded-xl border bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"><option value="LOW">Prioritas rendah</option><option value="MEDIUM">Prioritas sedang</option><option value="HIGH">Prioritas tinggi</option></select>
      <button className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600">Tambah pengingat</button>
      <textarea name="description" rows={2} maxLength={1000} placeholder="Catatan / langkah berikutnya (opsional)" className="rounded-xl border bg-white px-3 py-2.5 text-sm md:col-span-2 xl:col-span-4 dark:border-zinc-700 dark:bg-zinc-950"/>
    </form>
    <div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold">Daftar tindakan</h2><p className="mt-1 text-sm text-zinc-500">{today.length} tindakan jatuh tempo hari ini.</p></div><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-800"><RefreshCw className="mr-1 inline" size={15}/>Muat ulang</button></div>
    {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat pengingat...</p> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700"><BellRing className="mx-auto text-zinc-400" size={30}/><p className="mt-3 font-bold">Belum ada pengingat</p><p className="mt-1 text-sm text-zinc-500">Buat tindakan pertama agar follow-up dan deadline lebih mudah dipantau.</p></div> : <div className="grid gap-3 md:grid-cols-2">{items.map(item => {
      const late = now !== null && item.status === "OPEN" && new Date(item.dueAt).getTime() < now;
      return <article key={item.id} className={`rounded-2xl border bg-white p-5 dark:bg-zinc-900 ${late ? "border-red-300 dark:border-red-900" : "border-zinc-200 dark:border-zinc-800"} ${item.status === "DONE" ? "opacity-70" : ""}`}>
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${item.priority === "HIGH" ? "bg-red-50 text-red-700 dark:bg-red-950" : item.priority === "LOW" ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800" : "bg-blue-50 text-blue-700 dark:bg-blue-950"}`}>{priorityLabel[item.priority] || item.priority}</span>{late && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-700 dark:bg-red-950">Terlambat</span>}{item.status === "DONE" && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950">Selesai</span>}</div><h3 className={`mt-3 font-extrabold ${item.status === "DONE" ? "line-through" : ""}`}>{item.title}</h3><p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500"><Clock3 size={14}/>{moneylessDate(item.dueAt)}</p>{item.description && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p>}</div><button onClick={() => void remove(item.id)} aria-label={`Hapus ${item.title}`} className="rounded-lg border border-red-200 p-2 text-red-600"><Trash2 size={15}/></button></div>
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">{item.status === "OPEN" ? <button onClick={() => void patch(item.id, { status: "DONE" })} className="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white"><Check className="mr-1 inline" size={14}/>Tandai selesai</button> : <button onClick={() => void patch(item.id, { status: "OPEN" })} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Buka kembali</button>}<button onClick={() => { const value = window.prompt("Tanggal dan waktu baru (YYYY-MM-DDTHH:mm)", item.dueAt.slice(0,16)); if (value) void patch(item.id, { dueAt: new Date(value).toISOString() }); }} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Ubah tenggat</button></div>
      </article>;
    })}</div>}
  </div>;
}
