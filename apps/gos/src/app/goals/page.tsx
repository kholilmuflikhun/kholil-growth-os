import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";
import { requireSession } from "@/lib/auth";
import GoalsManager from "./goals-manager";
export default async function GoalsPage() {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Target size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM</p><h1 className="mt-1 text-3xl font-extrabold">Goals & Strategy</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Buat dan kelola target dengan rentang tanggal dan hari aktif. Dashboard akan memakai target aktif yang berlaku hari ini.</p></div></header>
    <GoalsManager/>
  </div></main>;
}
