"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, ArrowRight, LoaderCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Login gagal."); return; }
      router.replace(data.mustChangePassword ? "/settings?welcome=1" : "/");
      router.refresh();
    } catch { setError("Tidak dapat menghubungi server. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen place-items-center px-5 py-10"><div className="w-full max-w-md"><a href="http://localhost:3000" className="text-sm font-bold text-blue-600">← Kembali ke website</a><div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-7 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-9"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500 text-white"><LockKeyhole/></div><p className="mt-6 text-sm font-bold text-blue-600">PRIVATE WORKSPACE</p><h1 className="mt-2 text-3xl font-extrabold">Masuk ke Growth OS</h1><p className="mt-3 text-sm leading-6 text-zinc-500">Masuk dengan akun administrator yang sudah dibuat melalui proses bootstrap aman.</p><form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold">Username atau email<input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950" /></label><label className="block text-sm font-semibold">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950" /></label>{error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">{error}</p>}<button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 font-bold text-white hover:bg-blue-600 disabled:opacity-60">{busy?<LoaderCircle className="animate-spin"/>:<>Masuk <ArrowRight size={17}/></>}</button></form><p className="mt-5 text-xs leading-5 text-zinc-500">Jangan gunakan password sementara yang lemah di production. Jika akun belum dibuat, jalankan proses bootstrap administrator dari terminal.</p></div></div></main>;
}
