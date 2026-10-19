import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-sans" });
export const metadata: Metadata = {
  title: { default: "Kholil Muflikhun — Creative Design • Digital Solutions • AI-Powered Business", template: "%s | Kholil Muflikhun" },
  description: "Dari Ide Menjadi Identitas, Produk, dan Solusi Digital. Mendukung UMKM melalui strategi desain, identitas merek, komunikasi pemasaran, produk digital, dan pemanfaatan AI yang relevan.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" suppressHydrationWarning><body className={`${font.variable} font-sans bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50`}><ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider></body></html>;
}
