"use client";
import { FormEvent, useState, useSyncExternalStore } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { services } from "@/lib/catalog";

function subscribeToLocation(callback: () => void) {
  window.addEventListener("popstate", callback);
  return () => window.removeEventListener("popstate", callback);
}

function getLocationSearch() {
  return window.location.search;
}

function getServerLocationSearch() {
  return "";
}

export function ContactLeadForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedServiceOverride, setSelectedServiceOverride] = useState<string | null>(null);
  const search = useSyncExternalStore(subscribeToLocation, getLocationSearch, getServerLocationSearch);
  const params = new URLSearchParams(search);
  const packageNames: Record<string, string> = { "brand-starter": "Brand Starter", "social-media-starter": "Social Media Starter", "business-starter": "Business Starter", "business-digital": "Business Digital", "print-merchandise": "Print & Merchandise" };
  const selectedService = selectedServiceOverride ?? services.find((item) => item.slug === params.get("layanan"))?.name ?? packageNames[params.get("paket") ?? ""] ?? "";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setSuccess(false);
    const form = event.currentTarget;
    const values = new FormData(form);
    if (String(values.get("website") || "").trim()) { setBusy(false); setSuccess(true); form.reset(); return; }
    const payload = {
      name: String(values.get("name") || ""), contact: String(values.get("contact") || ""),
      businessName: String(values.get("businessName") || ""), service: String(values.get("service") || ""),
      message: String(values.get("message") || ""), consent: values.get("consent") === "on",
      sourceUrl: `${window.location.origin}${window.location.pathname}`.slice(0, 1000),
      utmSource: new URLSearchParams(window.location.search).get("utm_source")?.slice(0, 120) || undefined,
      utmMedium: new URLSearchParams(window.location.search).get("utm_medium")?.slice(0, 120) || undefined,
      utmCampaign: new URLSearchParams(window.location.search).get("utm_campaign")?.slice(0, 160) || undefined,
    };
    try {
      const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pesan gagal dikirim.");
      form.reset(); setSelectedServiceOverride(""); setSuccess(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Tidak dapat mengirim pesan."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
    <h3 className="text-xl font-extrabold">Formulir permintaan penawaran</h3>
    <p className="mt-2 text-sm leading-6 text-zinc-500">Permintaan diteruskan secara server-to-server ke Growth OS untuk dicatat sebagai prospek. Jangan mengirim kata sandi atau informasi sensitif.</p>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-semibold">Nama Anda *<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nama lengkap" className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"/></label>
      <label className="text-sm font-semibold">WhatsApp / Email *<input name="contact" required minLength={5} maxLength={160} autoComplete="email" placeholder="08xx atau email" className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"/></label>
      <label className="text-sm font-semibold">Nama bisnis<input name="businessName" maxLength={160} autoComplete="organization" placeholder="Nama usaha (opsional)" className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"/></label>
      <label className="text-sm font-semibold">Layanan atau paket *<select name="service" required value={selectedService} onChange={(event) => setSelectedServiceOverride(event.target.value)} className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"><option value="" disabled>Pilih layanan</option><optgroup label="Layanan individual">{services.map((service) => <option key={service.slug} value={service.name}>{service.name}</option>)}</optgroup><optgroup label="Paket unggulan"><option>Brand Starter</option><option>Social Media Starter</option><option>Business Starter</option><option>Business Digital</option><option>Print & Merchandise</option></optgroup><option>Konsultasi kebutuhan lain</option></select></label>
      <label className="text-sm font-semibold sm:col-span-2">Ceritakan kebutuhan Anda *<textarea name="message" required minLength={10} maxLength={3000} rows={4} placeholder="Tujuan, kebutuhan, jumlah/fitur, target waktu, atau kisaran anggaran..." className="mt-1.5 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-3 font-normal outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"/></label>
      <div className="hidden" aria-hidden="true"><label>Jangan isi kolom ini<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    </div>
    <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-zinc-500"><input type="checkbox" name="consent" required className="mt-1 accent-blue-500"/>Saya setuju data yang saya kirim digunakan untuk menindaklanjuti permintaan ini.</label>
    {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
    {success && <p role="status" className="mt-4 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 size={18} className="mt-0.5 shrink-0"/>Permintaan berhasil diproses. Jika formulir valid, permintaan telah diteruskan untuk dicatat. Terima kasih.</p>}
    <button disabled={busy} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-5 py-3.5 font-bold text-white hover:bg-blue-600 disabled:opacity-60">{busy ? <><LoaderCircle className="animate-spin" size={17}/> Mengirim...</> : <>Kirim permintaan <ArrowRight size={17}/></>}</button>
  </form>;
}
