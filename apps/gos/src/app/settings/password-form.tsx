"use client";
import { FormEvent, useState } from "react";
export default function PasswordForm() {
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(""); setError(""); setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: form.get("currentPassword"), newPassword: form.get("newPassword") }) });
    const result = await response.json().catch(() => ({}));
    setLoading(false);
    if (!response.ok) { setError(result.error || "Kata sandi gagal diubah."); return; }
    event.currentTarget.reset(); setMessage("Kata sandi berhasil diperbarui.");
  }
  return <form onSubmit={submit} className="space-y-3">
    <label className="block text-sm font-semibold">Kata sandi saat ini<input required name="currentPassword" type="password" autoComplete="current-password" className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"/></label>
    <label className="block text-sm font-semibold">Kata sandi baru<input required name="newPassword" type="password" minLength={12} autoComplete="new-password" className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 font-normal dark:border-zinc-700 dark:bg-zinc-950"/></label>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}{message && <p role="status" className="text-sm text-emerald-600">{message}</p>}
    <button disabled={loading} className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{loading ? "Menyimpan..." : "Perbarui kata sandi"}</button>
  </form>;
}
