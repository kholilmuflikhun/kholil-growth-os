import Link from "next/link";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { requireSession } from "@/lib/auth";
import AssistantPanel from "./assistant-panel";

export default async function AssistantPage() {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><BrainCircuit size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM · PHASE 10</p><h1 className="mt-1 text-3xl font-extrabold">AI Business Assistant</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Prioritas tindakan harian yang disusun dari data GOS. Ini adalah rekomendasi berbasis aturan, bukan model AI eksternal, dan tidak mengirim pesan secara otomatis.</p></div></header>
    <AssistantPanel/>
  </div></main>;
}
