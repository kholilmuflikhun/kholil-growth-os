"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, CalendarDays, ContactRound, LayoutDashboard, Target, PackageSearch } from "lucide-react";

const items = [
  { label: "Home", href: "/", icon: LayoutDashboard },
  { label: "CRM", href: "/leads", icon: ContactRound },
  { label: "Keuangan", href: "/finance", icon: Banknote },
  { label: "Konten", href: "/content", icon: CalendarDays },
  { label: "KPI", href: "/reports", icon: Target },
  { label: "Katalog", href: "/catalog", icon: PackageSearch },
];

/** Mobile-first global navigation for authenticated Growth OS screens. */
export function MobileQuickNav() {
  const pathname = usePathname();
  if (!pathname || pathname === "/login" || pathname.startsWith("/login/")) return null;
  return (
    <nav aria-label="Navigasi utama mobile" className="kg-mobile-nav fixed inset-x-0 bottom-0 z-50 border-t border-zinc-200 bg-white/95 px-2 pt-2 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/95 lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-6 gap-1">
        {items.map(({ label, href, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${active ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300" : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"}`}>
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
