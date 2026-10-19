import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { requireSession } from "@/lib/auth";
import PasswordForm from "./password-form";
import NotificationDeliveryTest from "./notification-delivery-test";
export default async function SettingsPage() {
  const session = await requireSession({ allowPasswordChange: true });
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-3xl space-y-6">
    {session.mustChangePassword ? <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900">Untuk keamanan, ubah kata sandi sementara sebelum menggunakan modul lain.</p> : <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>}
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><ShieldCheck size={23}/></span><div><p className="text-sm font-bold text-blue-600">AKUN & KEAMANAN</p><h1 className="mt-1 text-3xl font-extrabold">Pengaturan akun</h1><p className="mt-2 text-sm text-zinc-500">Kelola keamanan akses Growth Operating System.</p></div></header>
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Profil</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs text-zinc-500">Username</dt><dd className="mt-1 font-semibold">{session.username}</dd></div><div><dt className="text-xs text-zinc-500">Email</dt><dd className="mt-1 font-semibold">{session.email}</dd></div></dl></section>
    {!session.mustChangePassword && <NotificationDeliveryTest />}
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"><h2 className="font-extrabold">Ubah kata sandi</h2><p className="mt-1 text-sm text-zinc-500">Gunakan minimal 12 karakter dengan huruf besar, huruf kecil, angka, dan simbol.</p><div className="mt-5"><PasswordForm/></div></section>
  </div></main>;
}
