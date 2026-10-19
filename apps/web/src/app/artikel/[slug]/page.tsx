import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles } from "@/lib/content";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const item=articles.find(x=>x.slug===slug);return item?{title:item.title,description:item.excerpt}:{title:"Artikel tidak ditemukan"};}
export function generateStaticParams(){return articles.map(article=>({slug:article.slug}));}
export default async function ArticleDetail({params}:Props){const {slug}=await params;const item=articles.find(x=>x.slug===slug);if(!item)notFound();return <main className="min-h-screen bg-white px-5 py-12 dark:bg-zinc-950"><article className="mx-auto max-w-3xl"><Link href="/artikel" className="text-sm font-bold text-blue-600">← Semua artikel</Link><p className="mt-10 text-xs font-bold uppercase tracking-widest text-blue-600">{item.category} · Diperbarui {item.updatedAt}</p><h1 className="mt-3 text-4xl font-extrabold leading-tight">{item.title}</h1><p className="mt-5 text-lg leading-8 text-zinc-600 dark:text-zinc-300">{item.excerpt}</p><div className="mt-10 space-y-8">{item.sections.map(section=><section key={section.heading}><h2 className="text-xl font-extrabold">{section.heading}</h2><p className="mt-3 leading-8 text-zinc-700 dark:text-zinc-300">{section.body}</p></section>)}</div><p className="mt-10 text-xs text-zinc-500">Materi edukasi umum. Evaluasi setiap rekomendasi sesuai kondisi bisnis, data, dan kebutuhan aktual.</p></article></main>;}
