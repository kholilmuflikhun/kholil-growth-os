import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { requireSession } from "@/lib/auth";
import MonthlyReview from "./monthly-review";

export default async function MonthlyReviewPage() {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-7xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><CalendarRange size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM · PHASE 19</p><h1 className="mt-1 text-3xl font-extrabold">Monthly Business Review & Strategic Planning</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">Tinjau hasil bulanan, tetapkan target dan fokus strategis, serta susun prioritas berdasarkan data pemasukan, CRM, konten, eksekusi, KPI, dan piutang.</p></div></header>
    <MonthlyReview/>
  </div></main>;
}
