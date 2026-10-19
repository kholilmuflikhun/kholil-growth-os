import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";
import { requireSession } from "@/lib/auth";

export async function ModuleRoadmap({ title, description, planned }: { title: string; description: string; planned: string[] }) {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-3xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <section className="rounded-3xl border border-zinc-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900 sm:p-10">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><Construction size={23}/></span>
      <p className="mt-6 text-sm font-bold text-blue-600">DALAM ROADMAP</p>
      <h1 className="mt-2 text-3xl font-extrabold">{title}</h1>
      <p className="mt-3 leading-7 text-zinc-500">{description}</p>
      <h2 className="mt-7 font-extrabold">Ruang lingkup yang direncanakan</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{planned.map(item => <li key={item}>{item}</li>)}</ul>
      <p className="mt-7 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200">Modul ini belum menyimpan data operasional. Untuk saat ini, CRM, Finance, dashboard, dan pengaturan akun sudah tersedia.</p>
      <div className="mt-5 flex flex-wrap gap-3"><Link href="/leads" className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-bold text-white">Buka CRM</Link><Link href="/finance" className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-bold dark:border-zinc-700">Buka Finance</Link></div>
    </section>
  </div></main>;
}
