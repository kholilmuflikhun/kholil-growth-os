import Link from "next/link";
import { ArrowLeft, BellRing } from "lucide-react";
import { requireSession } from "@/lib/auth";
import ReminderManager from "./reminder-manager";

export default async function RemindersPage() {
  await requireSession();
  return <main className="min-h-screen bg-zinc-50 p-4 dark:bg-zinc-950 sm:p-8"><div className="mx-auto max-w-6xl space-y-6">
    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-blue-600"><ArrowLeft size={16}/>Kembali ke dashboard</Link>
    <header className="flex items-start gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-100 text-blue-700"><BellRing size={23}/></span><div><p className="text-sm font-bold text-blue-600">GROWTH OPERATING SYSTEM · PHASE 8</p><h1 className="mt-1 text-3xl font-extrabold">Reminders & Action Center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">Kelola tindak lanjut, deadline, dan prioritas kerja dalam satu tempat. Pengingat yang lewat tenggat akan ditandai otomatis saat halaman dibuka.</p></div></header>
    <ReminderManager/>
  </div></main>;
}
