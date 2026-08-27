import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
        {/* Footer */}
        <footer className="mt-auto py-6 px-4 text-center border-t border-slate-200 dark:border-slate-800 text-xs space-y-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur">
          <p className="font-bold text-slate-800 dark:text-slate-200">
            MBS Studio Project Management System
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            A Product by VCS Technology
          </p>
        </footer>
      </div>
    </div>
  );
}