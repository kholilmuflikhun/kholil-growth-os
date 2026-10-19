"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const ready = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  if (!ready) return <button aria-label="Ganti tema" className="h-10 w-10 rounded-xl border border-zinc-200 dark:border-zinc-800" />;
  return <button aria-label="Ganti tema" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="grid h-10 w-10 place-items-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"><span className="dark:hidden"><Moon size={18}/></span><span className="hidden dark:inline"><Sun size={18}/></span></button>;
}
