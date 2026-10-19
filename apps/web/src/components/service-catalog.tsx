"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { formatPrice, serviceCategories, services } from "@/lib/catalog";

type ServiceItem = typeof services[number];
type PublicService = { id: string; name: string; slug: string; description: string; category: string; priceFrom: number | null; currency: string };
export function ServiceCatalog() {
  const [catalogServices, setCatalogServices] = useState<ServiceItem[]>(services);
  useEffect(() => {
    let active = true;
    fetch("/api/public/services", { cache: "no-store" }).then(async response => {
      if (!response.ok) return null;
      return response.json() as Promise<{ data: PublicService[]; hasConfiguredCatalog: boolean }>;
    }).then(result => {
      if (!active || !result?.hasConfiguredCatalog) return;
      const mapped = result.data.map((item): ServiceItem => {
        const existing = services.find(service => service.slug === item.slug);
        const category = serviceCategories.find(group => [group.id, group.name.toLowerCase(), group.shortName.toLowerCase()].includes(item.category.toLowerCase())) ?? serviceCategories.find(group => group.id === item.category.toLowerCase()) ?? serviceCategories[serviceCategories.length - 1];
        return existing ? { ...existing, name: item.name, summary: item.description, description: item.description, categoryId: category.id, priceFrom: item.priceFrom ?? undefined, priceLabel: item.priceFrom === null ? "Penawaran khusus" : undefined } : {
          slug: item.slug, name: item.name, categoryId: category.id, summary: item.description, description: item.description,
          idealFor: ["UMKM dan bisnis yang membutuhkan solusi sesuai brief"], deliverables: ["Ruang lingkup dan deliverable ditentukan dalam penawaran tertulis"],
          priceFrom: item.priceFrom ?? undefined, priceLabel: item.priceFrom === null ? "Penawaran khusus" : undefined, pricingModel: item.priceFrom === null ? "custom" : "project",
          timeline: "Ditentukan setelah ruang lingkup disepakati.", portfolioTags: [], featured: false,
        };
      });
      setCatalogServices(mapped);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => catalogServices.filter((service) => {
    const matchesCategory = category === "all" || service.categoryId === category;
    const haystack = `${service.name} ${service.summary} ${service.description} ${service.deliverables.join(" ")}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  }), [catalogServices, category, query]);
  return <div>
    <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
      <label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari layanan, misalnya logo atau website..." className="w-full rounded-2xl border border-zinc-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-blue-950" aria-label="Cari layanan" /></label>
      <p className="flex items-center gap-2 text-sm text-zinc-500"><SlidersHorizontal size={16}/>{visible.length} layanan tersedia</p>
    </div>
    <div className="mt-4 flex gap-2 overflow-x-auto pb-2" aria-label="Filter kategori">
      <button onClick={() => setCategory("all")} aria-pressed={category === "all"} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === "all" ? "bg-blue-500 text-white" : "border border-zinc-200 hover:border-blue-300 dark:border-zinc-800"}`}>Semua layanan</button>
      {serviceCategories.map((item) => <button key={item.id} onClick={() => setCategory(item.id)} aria-pressed={category === item.id} className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${category === item.id ? "bg-blue-500 text-white" : "border border-zinc-200 hover:border-blue-300 dark:border-zinc-800"}`}>{item.shortName}</button>)}
    </div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {visible.map((service) => {
        const group = serviceCategories.find((item) => item.id === service.categoryId)!;
        const Icon = group.icon;
        return <article key={service.slug} className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-950/5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50"><Icon size={22}/></span>{service.featured && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Unggulan</span>}</div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-zinc-400">{group.shortName}</p><h3 className="mt-2 text-xl font-extrabold">{service.name}</h3><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{service.summary}</p>
          <div className="mt-5 border-t border-zinc-100 pt-4 dark:border-zinc-800"><p className="text-xs text-zinc-500">Harga indikatif</p><p className="mt-1 text-lg font-extrabold text-blue-600">{service.priceFrom !== undefined && service.priceFrom !== null ? `Mulai ${formatPrice(service.priceFrom)}` : service.priceLabel}</p></div>
          <div className="mt-auto flex gap-2 pt-5"><Link href={`/layanan/${service.slug}`} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-bold transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-800">Detail layanan <ArrowRight size={15}/></Link><a href={`/?layanan=${service.slug}#kontak`} aria-label={`Minta penawaran ${service.name}`} className="grid h-11 w-11 place-items-center rounded-xl bg-blue-500 text-white transition hover:bg-blue-600"><ArrowUpRight size={17}/></a></div>
        </article>;
      })}
    </div>
    {visible.length === 0 && <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 p-10 text-center dark:border-zinc-700"><p className="font-bold">Layanan tidak ditemukan</p><p className="mt-2 text-sm text-zinc-500">Coba kata kunci atau kategori lain.</p><button onClick={() => { setCategory("all"); setQuery(""); }} className="mt-4 rounded-xl bg-blue-500 px-4 py-2 text-sm font-bold text-white">Reset filter</button></div>}
    <p className="mt-6 text-xs leading-5 text-zinc-500">Harga merupakan estimasi awal, bukan penawaran final. Biaya akhir mengikuti brief, jumlah deliverable, tingkat kompleksitas, lisensi aset, bahan, produksi, dan kebutuhan integrasi.</p>
  </div>;
}
