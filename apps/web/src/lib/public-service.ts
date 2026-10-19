import { getService, serviceCategories, services } from "@/lib/catalog";
export type PublicService = typeof services[number];
export async function resolvePublicService(slug: string): Promise<PublicService | undefined> {
  const fallback = getService(slug);
  const base = process.env.GOS_API_URL;
  if (!base) return fallback;
  try {
    const url = new URL("/api/public/services", base); url.searchParams.set("slug", slug);
    const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3500) });
    if (!response.ok) return fallback;
    const result = await response.json() as { data?: Array<{name:string;slug:string;description:string;category:string;priceFrom:number|null}>; hasConfiguredCatalog?:boolean };
    if (!result.hasConfiguredCatalog) return fallback;
    const item = result.data?.[0]; if (!item) return undefined;
    const existing = fallback;
    const group = serviceCategories.find(category => category.id === item.category.toLowerCase() || category.name.toLowerCase() === item.category.toLowerCase() || category.shortName.toLowerCase() === item.category.toLowerCase()) ?? serviceCategories[serviceCategories.length-1];
    if (existing) return { ...existing, name:item.name, summary:item.description, description:item.description, categoryId:group.id, priceFrom:item.priceFrom ?? undefined, priceLabel:item.priceFrom===null?"Penawaran khusus":undefined };
    return { slug:item.slug,name:item.name,categoryId:group.id,summary:item.description,description:item.description,idealFor:["Bisnis yang membutuhkan solusi sesuai brief"],deliverables:["Ruang lingkup ditentukan dalam penawaran tertulis"],priceFrom:item.priceFrom??undefined,priceLabel:item.priceFrom===null?"Penawaran khusus":undefined,pricingModel:item.priceFrom===null?"custom":"project",timeline:"Ditentukan setelah ruang lingkup disepakati.",portfolioTags:[],featured:false };
  } catch { return fallback; }
}
