import type { Metadata } from "next";
import "./globals.css";
import { BRAND_CONFIG } from "@/lib/brand.config";

export const metadata: Metadata = {
  title: BRAND_CONFIG.appTitle,
  description: BRAND_CONFIG.appDescription,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}