"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Search, PlusCircle, User, LogOut, ShieldCheck } from "lucide-react";
import { MOCK_PROJECTS, MOCK_PROFILES } from "@/lib/mock-data";

export function Header() {
  const router = useRouter();
  const currentProfile = MOCK_PROFILES[0]; // Sarah Connor (PM)

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Project Switcher & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-xs">
          <label htmlFor="project-selector" className="sr-only">Select Project</label>
          <select
            id="project-selector"
            aria-label="Select active project"
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
            defaultValue="prj-1"
            onChange={(e) => {
              router.push(`/dashboard/projects/${e.target.value}/overview`);
            }}
          >
            {MOCK_PROJECTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.name.length > 30 ? p.name.substring(0, 30) + '...' : p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks, drawings, RFIs, specs..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Actions & User Info */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/projects/prj-1/daily-logs"
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-xs shadow-sm transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>New Daily Log</span>
        </Link>

        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white"></span>
        </button>

        {/* User Card */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <img
            src={currentProfile.avatar_url}
            alt={currentProfile.full_name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200"
          />
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-900 leading-tight">
              {currentProfile.full_name}
            </span>
            <span className="block text-[10px] text-slate-500 capitalize">
              {currentProfile.role.replace("_", " ")}
            </span>
          </div>
          <Link
            href="/login"
            aria-label="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-1"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
