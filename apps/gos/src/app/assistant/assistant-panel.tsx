"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, ArrowUpRight, BrainCircuit, CircleCheck, Clock3, RefreshCw, Sparkles, Target, Users } from "lucide-react";

type Action = { priority: "HIGH" | "MEDIUM" | "LOW"; title: string; reason: string; href: string };
type Lead = { id: string; name: string; businessName: string | null; service: string; status: string; estimatedValue: number | null; nextFollowUp?: string | null };
type Data = { generatedAt: string; user: { username: string }; metrics: { income: number; expense: number; net: number; target: number | null; remaining: number | null; openLeads: number; overdueFollowUps: number; remindersDue: number; publishedContent: number }; actions: Action[]; followUps: Lead[]; highValueLeads: Lead[] };
const money = (value: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
const dateTime = (value: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const priorityStyle = { HIGH: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300", MEDIUM: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300", LOW: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300" };

export default function AssistantPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/assistant", { cache: "no-store" });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Gagal memuat rekomendasi.");
      setData(json);
    } catch (e) { setError(e instanceof Error ? e.message : "Gagal memuat rekomendasi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><Sparkles size={20}/></span><div><h2 className="font-extrabold">Briefing bisnis harian</h2><p className="mt-1 text-xs text-zinc-500">Berdasarkan transaksi, target, prospek, konten, dan pengingat di database.</p></div></div><button onClick={() => void load()} className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-700"><RefreshCw className="mr-1 inline" size={15}/>Perbarui analisis</button></div>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {loading ? <p className="rounded-2xl border border-zinc-200 p-8 text-center text-sm text-zinc-500 dark:border-zinc-800">Menyusun briefing...</p> : data && <>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        ["Pemasukan bulan ini", money(data.metrics.income)],
        ["Net tercatat", money(data.metrics.net)],
        ["Prospek aktif", String(data.metrics.openLeads)],
        ["Follow-up terlambat", String(data.metrics.overdueFollowUps)],
      ].map(([label, value]) => <article key={label} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><p className="text-sm text-zinc-500">{label}</p><p className="mt-2 break-words text-2xl font-extrabold">{value}</p></article>)}</section>
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><Target className="text-blue-500"/><div><h2 className="font-extrabold">Prioritas yang disarankan</h2><p className="text-sm text-zinc-500">Urutan awal berdasarkan urgensi dan data yang tersedia.</p></div></div><div className="mt-5 space-y-3">{data.actions.map((action, index) => <article key={`${action.title}-${index}`} className="flex flex-col gap-3 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/70 sm:flex-row sm:items-start"><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${priorityStyle[action.priority]}`}>{action.priority === "HIGH" ? "Prioritas tinggi" : action.priority === "MEDIUM" ? "Prioritas sedang" : "Prioritas rutin"}</span><div className="min-w-0 flex-1"><h3 className="font-bold">{action.title}</h3><p className="mt-1 text-sm leading-6 text-zinc-500">{action.reason}</p></div><Link href={action.href} className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 text-xs font-bold dark:border-zinc-700">Buka <ArrowUpRight className="ml-1 inline" size={13}/></Link></article>)}</div></section>
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><Clock3 className="text-blue-500"/><div><h2 className="font-extrabold">Follow-up hari ini</h2><p className="text-sm text-zinc-500">Prospek dengan jadwal tindak lanjut yang sudah tiba atau terlewati.</p></div></div>{data.followUps.length ? <div className="mt-4 space-y-3">{data.followUps.map(lead => <div key={lead.id} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70"><div className="flex items-start justify-between gap-3"><div><p className="font-bold">{lead.name}{lead.businessName ? ` · ${lead.businessName}` : ""}</p><p className="mt-1 text-xs text-zinc-500">{lead.service} · {lead.status}</p>{lead.nextFollowUp && <p className="mt-1 text-xs text-blue-600">{dateTime(lead.nextFollowUp)}</p>}</div>{lead.estimatedValue !== null && <p className="text-right text-xs font-bold">{money(lead.estimatedValue)}</p>}</div><Link href="/leads" className="mt-3 inline-flex text-xs font-bold text-blue-600">Buka CRM <ArrowUpRight size={13}/></Link></div>)}</div> : <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"><CircleCheck className="mr-2 inline" size={16}/>Tidak ada follow-up dengan tenggat hari ini atau sebelumnya.</div>}</article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><div className="flex items-center gap-2"><Users className="text-blue-500"/><div><h2 className="font-extrabold">Prospek bernilai tinggi</h2><p className="text-sm text-zinc-500">Urutan estimasi nilai terbesar; bukan prediksi peluang menang.</p></div></div>{data.highValueLeads.length ? <div className="mt-4 space-y-3">{data.highValueLeads.map(lead => <div key={lead.id} className="flex items-center justify-between gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/70"><div className="min-w-0"><p className="truncate font-bold">{lead.name}</p><p className="mt-1 truncate text-xs text-zinc-500">{lead.businessName || lead.service} · {lead.status}</p></div><p className="shrink-0 text-sm font-extrabold">{lead.estimatedValue === null ? "—" : money(lead.estimatedValue)}</p></div>)}</div> : <p className="mt-4 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500 dark:bg-zinc-800/70">Belum ada nilai estimasi pada prospek aktif. Lengkapi estimasi di CRM agar prioritas lebih terukur.</p>}</article>
      </section>
      <p className="text-xs leading-5 text-zinc-500"><AlertTriangle className="mr-1 inline" size={13}/>Rekomendasi dibuat dengan aturan transparan dari data internal, bukan nasihat finansial dan bukan hasil model AI eksternal. Data kosong atau belum diperbarui dapat memengaruhi hasil. Briefing dimuat saat halaman dibuka, tidak dikirim otomatis.</p>
      <p className="text-xs text-zinc-400">Terakhir dihitung: {dateTime(data.generatedAt)}</p>
    </>}
  </div>;
}
