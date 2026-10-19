import Link from "next/link";
import { ArrowLeft, CalendarDays, Megaphone } from "lucide-react";
import { requireSession } from "@/lib/auth";
import ContentManager from "./content-manager";
export default async function ContentPage() {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><CalendarDays size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM</p><h1 className="mt-1 text-3xl font-extrabold">Content Planner</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Kelola ide, kanal, jadwal publikasi, dan status produksi konten.</p></div></header>
    <div className="flex flex-wrap gap-2"><Link href="/campaigns" className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-800"><Megaphone size={16}/> Kelola kampanye</Link></div><ContentManager/>
  </div></main>;
}
