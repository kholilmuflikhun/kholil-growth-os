"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity, Banknote, Bell, BrainCircuit, BriefcaseBusiness, CalendarCheck2, CalendarDays,
  CalendarRange, Calculator, ChartNoAxesCombined, CircleDollarSign, ClipboardList, ContactRound,
  FileCheck2, Gauge, GitBranch, Goal, HeartHandshake, LayoutDashboard, ListTodo, PackageSearch, ShoppingBag, Megaphone,
  LogOut, Settings2, Sparkles, Sun, Target, TrendingUp, WalletCards,
} from "lucide-react";
import { BrandMark } from "@kholil/ui";

const groups = [
  { title: "WORKSPACE", links: [
    { label: "Ringkasan", href: "/", icon: LayoutDashboard },
    { label: "Briefing Harian", href: "/daily-briefing", icon: Sun },
    { label: "Tugas & Eksekusi", href: "/execution", icon: CalendarCheck2 },
    { label: "Pengingat & Aksi", href: "/reminders", icon: Bell },
  ] },
  { title: "PENJUALAN", links: [
    { label: "CRM & Leads", href: "/leads", icon: ContactRound },
    { label: "Sales & Orders", href: "/orders", icon: WalletCards },
    { label: "Pelanggan & Pembayaran", href: "/customers", icon: CircleDollarSign },
    { label: "Proyek", href: "/projects", icon: BriefcaseBusiness },
    { label: "Katalog Layanan", href: "/catalog", icon: PackageSearch },
    { label: "Produk & Resource", href: "/products", icon: ShoppingBag },
    { label: "Proposal", href: "/proposals", icon: FileCheck2 },
    { label: "Retensi Pelanggan", href: "/retention", icon: HeartHandshake },
    { label: "Lifecycle & Upsell", href: "/lifecycle", icon: GitBranch },
  ] },
  { title: "PERTUMBUHAN", links: [
    { label: "Goals & Strategy", href: "/goals", icon: Goal },
    { label: "Content Planner", href: "/content", icon: CalendarDays },
    { label: "Campaigns & Attribution", href: "/campaigns", icon: Megaphone },
    { label: "Finance & Cashflow", href: "/finance", icon: Banknote },
    { label: "KPI & Reports", href: "/reports", icon: ChartNoAxesCombined },
    { label: "Business Intelligence", href: "/analytics", icon: BrainCircuit },
    { label: "Forecast & Target", href: "/forecast", icon: Gauge },
    { label: "Revenue Growth", href: "/revenue", icon: Calculator },
    { label: "Sales Optimization", href: "/sales-optimization", icon: TrendingUp },
  ] },
  { title: "EVALUASI & SISTEM", links: [
    { label: "Weekly Review", href: "/weekly-review", icon: CalendarRange },
    { label: "Monthly Review", href: "/monthly-review", icon: Target },
    { label: "Decision Center", href: "/actions", icon: ListTodo },
    { label: "AI Business Assistant", href: "/assistant", icon: Sparkles },
    { label: "Notifications", href: "/notifications", icon: Activity },
    { label: "Settings", href: "/settings", icon: Settings2 },
  ] },
];

/** Shared desktop navigation on all authenticated sub-pages. Dashboard keeps its existing sidebar. */
export function DesktopSidebar() {
  const pathname = usePathname();
  if (!pathname || pathname === "/" || pathname === "/login" || pathname.startsWith("/login/")) return null;
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:sticky lg:top-0 lg:flex">
      <Link href="/" className="flex items-center gap-3 border-b border-zinc-100 px-5 py-5 dark:border-zinc-800">
        <BrandMark className="rounded-xl" />
        <span className="min-w-0"><span className="block font-extrabold">Kholil Growth</span><span className="block text-xs text-zinc-500">Operating System</span></span>
      </Link>
      <nav aria-label="Navigasi workspace" className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {groups.map((group) => <section key={group.title}>
          <p className="mb-2 px-3 text-[10px] font-extrabold tracking-[.16em] text-zinc-400">{group.title}</p>
          <div className="space-y-1">{group.links.map(({ label, href, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300" : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}><Icon size={17} />{label}</Link>;
          })}</div>
        </section>)}
      </nav>
      <div className="border-t border-zinc-100 p-4 dark:border-zinc-800">
        <Link href="/settings" className="flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"><Settings2 size={17} /> Pengaturan</Link>
        <form action="/api/auth/logout" method="post"><button className="mt-1 flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"><LogOut size={17} /> Keluar</button></form>
      </div>
    </aside>
  );
}
