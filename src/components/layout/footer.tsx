"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Server, HelpCircle, FileCode } from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand.config";

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`w-full mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 dark:text-slate-400 transition-colors ${className}`}
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Copyright & System Name */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} {BRAND_CONFIG.companyName} Project Management System.
          </span>
          <span className="hidden sm:inline text-slate-400 dark:text-slate-600">&bull;</span>
          <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">
            All rights reserved.
          </span>
        </div>

        {/* Center: Highlighted Brand Product Tag */}
        <div className="flex items-center gap-1.5 text-center">
          <span className="text-slate-600 dark:text-slate-400">A Product by</span>
          <span className="px-2 py-0.5 rounded-md font-extrabold tracking-wide bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-500/20 shadow-xs">
            VCS Technology
          </span>
        </div>

        {/* Right: Enterprise Metadata, Version & Status */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 sm:gap-4 text-[11px]">
          <span className="font-mono font-medium px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
            v1.4.2 Enterprise
          </span>

          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Operational</span>
          </span>

          <Link
            href="/dashboard/settings"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Support</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}