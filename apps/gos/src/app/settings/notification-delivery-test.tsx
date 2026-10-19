"use client";
import { useState } from "react";
import { Mail, MessageCircle, Send } from "lucide-react";
type Result = { channel: "email" | "whatsapp"; ok: boolean; skipped?: boolean; detail: string };
export default function NotificationDeliveryTest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  async function test() {
    setLoading(true); setError(""); setResults([]);
    try {
      const response = await fetch("/api/notification-delivery/test", { method: "POST" });
      const json = await response.json();
      setResults(json.results || []);
      if (!response.ok) setError(json.error || "Tidak ada kanal yang siap diuji.");
    } catch { setError("Tidak dapat menghubungi endpoint pengujian."); }
    finally { setLoading(false); }
  }
  return <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-700"><Send size={19}/></span><div><h2 className="font-extrabold">Kanal notifikasi eksternal</h2><p className="mt-1 text-sm leading-6 text-zinc-500">Kirim tes email melalui Resend dan WhatsApp melalui WhatsApp Cloud API. Kredensial disimpan di environment server, bukan di database atau browser.</p></div></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"><Mail size={18} className="text-blue-600"/><p className="mt-2 font-bold">Email · Resend</p><p className="mt-1 text-xs leading-5 text-zinc-500">RESEND_API_KEY, RESEND_FROM_EMAIL, NOTIFICATION_EMAIL_TO</p></div><div className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"><MessageCircle size={18} className="text-green-600"/><p className="mt-2 font-bold">WhatsApp Cloud API</p><p className="mt-1 text-xs leading-5 text-zinc-500">WHATSAPP_CLOUD_API_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_TO</p></div></div>
    <button onClick={() => void test()} disabled={loading} className="mt-4 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">{loading ? "Mengirim tes..." : "Kirim notifikasi tes"}</button>
    {error && <p role="alert" className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">{error}</p>}
    {results.length > 0 && <div className="mt-3 space-y-2">{results.map(item => <p key={item.channel} className={`rounded-lg p-3 text-sm ${item.ok ? "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200" : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"}`}><strong>{item.channel === "email" ? "Email" : "WhatsApp"}:</strong> {item.detail}</p>)}</div>}
  </section>;
}
