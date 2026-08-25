import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildPulse | Construction Project Management",
  description: "Next-generation construction project management, field daily logs, task scheduling, blueprints, punch list, and cost control.",
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
