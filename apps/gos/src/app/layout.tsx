import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { DesktopSidebar } from "@/components/desktop-sidebar";
import { MobileQuickNav } from "@/components/mobile-quick-nav";
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = { title: "Kholil Growth OS | Creative Design • Digital Solutions • AI-Powered Business", description: "Workspace privat untuk mengelola CRM, keuangan, konten, KPI, dan pertumbuhan bisnis Kholil Muflikhun." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${font.variable} font-sans bg-zinc-50 text-zinc-950 antialiased dark:bg-zinc-950 dark:text-white`}><div className="min-h-screen lg:flex"><DesktopSidebar/><div className="min-w-0 flex-1">{children}</div><MobileQuickNav/></div></body></html>;
}
