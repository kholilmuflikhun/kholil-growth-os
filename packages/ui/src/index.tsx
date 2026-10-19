import type { ReactNode } from "react";

/** Shared brand mark used by the public website and private Growth OS. */
export function BrandMark({ className = "", label = "K." }: { className?: string; label?: string }) {
  return <span aria-label="Kholil Muflikhun" className={`inline-grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500 text-base font-extrabold tracking-tight text-white ${className}`}>{label}</span>;
}

/** Shared heading pattern for consistent brand voice and hierarchy. */
export function SectionEyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs font-extrabold uppercase tracking-[.18em] text-blue-600 dark:text-blue-400 ${className}`}>{children}</p>;
}

export function Button({ children, href, variant = "primary", className = "", type = "button" }: {
  children: ReactNode; href?: string; variant?: "primary" | "secondary"; className?: string; type?: "button" | "submit" | "reset";
}) {
  const styles = variant === "primary"
    ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm"
    : "border border-zinc-200 bg-white text-zinc-900 hover:border-blue-300 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800";
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition focus-visible:outline-none ${styles} ${className}`;
  return href ? <a className={cls} href={href}>{children}</a> : <button type={type} className={cls}>{children}</button>;
}

export function SurfaceCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>{children}</section>;
}
