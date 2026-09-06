import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Acren", template: "%s · Acren" },
  description: "Practice management for Irish agricultural consultants.",
  icons: { icon: "/acren-mark.svg", shortcut: "/acren-mark.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const restoreTheme = `try{const theme=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(theme==="light"||theme==="dark")document.documentElement.dataset.theme=theme}catch{}`;
  return <html lang="en" data-theme="dark" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}><head><script dangerouslySetInnerHTML={{ __html: restoreTheme }} /></head><body className="min-h-full"><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body></html>;
}
