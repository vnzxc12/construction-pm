"use client";

import React from "react";
import Link from "next/link";
import { BRAND_CONFIG } from "@/lib/brand.config";

export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`static w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 py-2.5 px-4 sm:px-6 text-[11px] text-slate-500 dark:text-slate-400 transition-colors ${className}`}
    >
      <div className="max-w-7xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Left: Copyright */}
        <div className="flex items-center gap-1.5 text-center sm:text-left text-[11px]">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            © {new Date().getFullYear()} {BRAND_CONFIG.companyName} Project Management System
          </span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">&bull;</span>
          <span className="hidden sm:inline text-[10px] text-slate-400">All rights reserved</span>
        </div>

        {/* Center: Highlighted Brand Product Tag */}
        <div className="flex items-center gap-1 text-[11px]">
          <span>A Product by</span>
          <span className="px-1.5 py-0.5 rounded font-bold text-[10px] bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400 border border-amber-500/20">
            VCS Technology
          </span>
        </div>

        {/* Right: Version & Status */}
        <div className="flex items-center gap-2.5 text-[10px]">
          <span className="font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border border-slate-200 dark:border-slate-700">
            v1.4.2
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Operational</span>
          </span>
          <Link
            href="/dashboard/settings"
            className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}