import Link from "next/link";
import { ArrowUpRight, Blocks, PanelsTopLeft, Palette, Workflow } from "lucide-react";
import { portfolioConcepts } from "@/lib/catalog";
const icons = [Palette, Blocks, PanelsTopLeft, Workflow];
const visualStyles = ["from-blue-100 via-blue-50 to-white dark:from-blue-950 dark:via-zinc-900 dark:to-zinc-950", "from-zinc-100 via-white to-blue-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-blue-950", "from-blue-50 via-white to-zinc-100 dark:from-blue-950 dark:via-zinc-950 dark:to-zinc-900", "from-zinc-100 via-blue-50 to-white dark:from-zinc-900 dark:via-blue-950 dark:to-zinc-950"];
export function PortfolioShowcase() {
  return <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
    {portfolioConcepts.map((item, index) => { const Icon = icons[index]; return <article key={item.title} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className={`relative flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br ${visualStyles[index]} p-6`}><div className="absolute left-6 top-6 h-20 w-20 rounded-full border border-blue-300/70"/><div className="absolute bottom-5 right-6 h-24 w-16 rotate-6 rounded-2xl border border-zinc-300/70 bg-white/70 shadow-xl dark:border-zinc-700 dark:bg-zinc-900/70"/><div className="relative z-10 grid h-20 w-20 place-items-center rounded-3xl bg-blue-500 text-white shadow-xl shadow-blue-500/20"><Icon size={34}/></div><span className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[10px] font-bold text-zinc-600 backdrop-blur dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300">KONSEP</span></div>
      <div className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-blue-600">{item.type}</p><h3 className="mt-2 text-lg font-extrabold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{item.description}</p><div className="mt-4 flex flex-wrap gap-2">{item.tags.map((tag) => <span key={tag} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{tag}</span>)}</div><Link href={`/layanan/${item.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600">Lihat layanan terkait <ArrowUpRight size={15}/></Link></div>
    </article>; })}
  </div>;
}
