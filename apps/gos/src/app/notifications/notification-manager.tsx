"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, Clock3, RefreshCw } from "lucide-react";

type Notification = { id: string; title: string; message: string; type: string; readAt: string | null; createdAt: string; reminder: { id: string; status: string; dueAt: string } | null };
const formatDate = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default function NotificationManager() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Gagal memuat notifikasi.");
      setItems(json.data); setUnread(json.unread);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat notifikasi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function markRead(id: string) {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const json = await response.json();
    if (!response.ok) { setError(json.error || "Gagal memperbarui notifikasi."); return; }
    setItems(old => old.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnread(value => Math.max(0, value - (items.some(item => item.id === id && !item.readAt) ? 1 : 0)));
  }
  async function markAllRead() {
    const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) });
    const json = await response.json();
    if (!response.ok) { setError(json.error || "Gagal memperbarui notifikasi."); return; }
    setItems(old => old.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnread(0);
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div><p className="text-sm text-zinc-500">Belum dibaca</p><p className="mt-1 text-3xl font-extrabold">{unread}</p></div><div className="flex gap-2"><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><RefreshCw className="mr-1 inline" size={15}/>Muat ulang</button><button disabled={unread === 0} onClick={() => void markAllRead()} className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-bold text-white disabled:opacity-40"><CheckCheck className="mr-1 inline" size={15}/>Tandai semua dibaca</button></div></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="p-8 text-center text-sm text-zinc-500">Memuat notifikasi...</p> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><Bell className="mx-auto text-zinc-400" size={32}/><p className="mt-3 font-bold">Belum ada notifikasi</p><p className="mt-1 text-sm text-zinc-500">Notifikasi akan muncul setelah otomasi memproses pengingat yang sudah jatuh tempo.</p></div> : items.map(item => <article key={item.id} className={`rounded-2xl border p-5 ${item.readAt ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" : "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20"}`}><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.readAt ? "bg-zinc-100 text-zinc-500 dark:bg-zinc-800" : "bg-blue-100 text-blue-700"}`}><Bell size={17}/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold">{item.title}</h2><span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{item.type === "REMINDER_UPCOMING" ? "Akan jatuh tempo" : item.type === "REMINDER_DUE" ? "Terlambat" : "Info"}</span>{!item.readAt && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-700">Baru</span>}</div><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.message}</p><p className="mt-3 flex items-center gap-1.5 text-xs text-zinc-500"><Clock3 size={13}/>{formatDate(item.createdAt)}</p>{item.reminder && <p className="mt-2 text-xs text-zinc-500">Status pengingat: {item.reminder.status === "DONE" ? "Selesai" : "Belum selesai"}</p>}</div>{!item.readAt && <button onClick={() => void markRead(item.id)} className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Tandai dibaca</button>}</div></article>)}
  </section>;
}
