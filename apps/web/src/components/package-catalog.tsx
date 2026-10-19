import { ArrowRight, Check } from "lucide-react";
import { servicePackages } from "@/lib/catalog";

export function PackageCatalog() {
  return <div className="mt-10 grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
    {servicePackages.map((item) => <article key={item.slug} className={`flex flex-col rounded-3xl border p-6 ${item.featured ? "border-blue-400 bg-blue-50/70 shadow-xl shadow-blue-500/10 dark:bg-blue-950/20" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"}`}>
      <div className="flex items-center justify-between gap-2"><h3 className="text-lg font-extrabold">{item.name}</h3>{item.featured && <span className="rounded-full bg-blue-500 px-2.5 py-1 text-[10px] font-bold text-white">Unggulan</span>}</div>
      <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{item.description}</p><p className="mt-5 text-xl font-extrabold text-blue-600">{item.price}</p>
      <ul className="mt-5 flex-1 space-y-3">{item.features.map((feature) => <li key={feature} className="flex gap-2 text-sm leading-5"><Check size={16} className="mt-0.5 shrink-0 text-blue-500"/>{feature}</li>)}</ul>
      <a href={`/?paket=${item.slug}#kontak`} className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600">Tanyakan paket <ArrowRight size={15}/></a>
    </article>)}
  </div>;
}
