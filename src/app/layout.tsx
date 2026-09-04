import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { THEME_COOKIE, parseTheme } from "@/lib/theme";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Acren", template: "%s · Acren" },
  description: "A clearer client book for Irish agricultural consultants.",
  icons: { icon: "/acren-mark.svg", shortcut: "/acren-mark.svg" },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return <html lang="en" data-theme={theme} className={`${manrope.variable} h-full antialiased`}><body className="min-h-full"><a href="#main-content" className="skip-link">Skip to main content</a>{children}</body></html>;
}
