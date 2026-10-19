"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

const links = [
  { label: "Beranda", href: "/#beranda" },
  { label: "Layanan", href: "/#layanan" },
  { label: "Paket", href: "/#paket" },
  { label: "Portofolio", href: "/portofolio" },
  { label: "Artikel", href: "/artikel" },
  { label: "Produk", href: "/produk" },
  { label: "Tentang", href: "/tentang" },
  { label: "Q&A", href: "/#qa" },
  { label: "Kontak", href: "/kontak" },
];
const wa = "https://wa.me/6285819950006?text=" + encodeURIComponent("Halo Kholil, saya ingin konsultasi kebutuhan desain dan digital untuk bisnis saya.");

/** Compact, accessible mobile navigation for the public brand website. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative md:hidden">
      <button
        type="button"
        aria-label={open ? "Tutup menu navigasi" : "Buka menu navigasi"}
        aria-expanded={open}
        aria-controls="public-mobile-navigation"
        onClick={() => setOpen((value) => !value)}
        className="grid h-11 w-11 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-800 transition hover:border-blue-300 focus-visible:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {open ? <X size={19} /> : <Menu size={19} />}
      </button>
      {open && (
        <div id="public-mobile-navigation" className="absolute right-0 top-[calc(100%+0.75rem)] z-[60] max-h-[calc(100dvh-6rem)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="px-3 pb-2 pt-1 text-xs font-bold uppercase tracking-[.16em] text-zinc-400">Navigasi</p>
          <nav aria-label="Navigasi mobile" className="space-y-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center justify-between rounded-xl px-3 text-sm font-semibold text-zinc-700 transition hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-200 dark:hover:bg-blue-950/40 dark:hover:text-blue-300">
                {link.label}<ChevronDown className="-rotate-90 text-zinc-400" size={15} />
              </a>
            ))}
          </nav>
          <a href={wa} target="_blank" rel="noreferrer" className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-600">
            Konsultasi via WhatsApp <ArrowUpRight size={16} />
          </a>
        </div>
      )}
    </div>
  );
}
