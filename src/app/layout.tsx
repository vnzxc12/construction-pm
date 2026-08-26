import type { Metadata } from "next";
import "./globals.css";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: BRAND_CONFIG.appTitle,
  description: BRAND_CONFIG.appDescription,
  icons: {
    icon: "/mbs-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <body className="h-full antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-amber-500 selection:text-slate-950">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}