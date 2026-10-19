import type { MetadataRoute } from "next";
import { services } from "@/lib/catalog";
import { articles, portfolioItems } from "@/lib/content";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const now = new Date();
  let dynamicServices: Array<{ slug: string; featured?: boolean }> = [];
  let dynamicProducts: Array<{ slug: string }> = [];
  if (process.env.GOS_API_URL) {
    try {
      const response = await fetch(new URL("/api/public/services", process.env.GOS_API_URL), { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (response.ok) { const result = await response.json() as { data?: Array<{slug:string}> }; dynamicServices = (result.data ?? []).map(item => ({slug:item.slug})); }
      const productResponse = await fetch(new URL("/api/public/products", process.env.GOS_API_URL), { cache: "no-store", signal: AbortSignal.timeout(3000) });
      if (productResponse.ok) { const products = await productResponse.json() as { data?: Array<{slug:string}> }; dynamicProducts = products.data ?? []; }
    } catch { /* Static sitemap remains available when the private app is unreachable. */ }
  }
  const serviceSlugs = new Map([...services.map(service => [service.slug, service] as const), ...dynamicServices.map(service => [service.slug, service] as const)]);
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...["tentang", "layanan", "produk", "portofolio", "artikel", "kontak", "privasi", "syarat-ketentuan"].map((slug) => ({ url: `${base}/${slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: slug === "kontak" ? 0.8 : 0.6 })),
    ...Array.from(serviceSlugs.values()).map((service) => ({ url: `${base}/layanan/${service.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: service.featured ? 0.8 : 0.6 })),
    ...portfolioItems.map((item) => ({ url: `${base}/portofolio/${item.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    ...articles.map((article) => ({ url: `${base}/artikel/${article.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...dynamicProducts.map((product) => ({ url: `${base}/produk/${product.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
