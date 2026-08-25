"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HardHat,
  LayoutDashboard,
  Building2,
  CalendarCheck2,
  ListTodo,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  DollarSign,
  Settings,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentProjectId?: string;
}

export function Sidebar({ currentProjectId = "prj-1" }: SidebarProps) {
  const pathname = usePathname();

  const globalNav = [
    {
      name: "Executive Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "All Projects",
      href: "/dashboard/projects",
      icon: Building2,
      active: pathname === "/dashboard/projects",
    },
  ];

  const projectNav = [
    {
      name: "Site Overview",
      href: `/dashboard/projects/${currentProjectId}/overview`,
      icon: FolderOpen,
      active: pathname.includes(`/projects/${currentProjectId}/overview`),
    },
    {
      name: "Daily Field Logs",
      href: `/dashboard/projects/${currentProjectId}/daily-logs`,
      icon: CalendarCheck2,
      active: pathname.includes(`/projects/${currentProjectId}/daily-logs`),
      badge: "Today",
    },
    {
      name: "Tasks & Schedule",
      href: `/dashboard/projects/${currentProjectId}/tasks`,
      icon: ListTodo,
      active: pathname.includes(`/projects/${currentProjectId}/tasks`),
    },
    {
      name: "Drawings & Specs",
      href: `/dashboard/projects/${currentProjectId}/drawings`,
      icon: FileSpreadsheet,
      active: pathname.includes(`/projects/${currentProjectId}/drawings`),
    },
    {
      name: "Punch List",
      href: `/dashboard/projects/${currentProjectId}/punch-list`,
      icon: AlertCircle,
      active: pathname.includes(`/projects/${currentProjectId}/punch-list`),
      badge: "2 Open",
      badgeColor: "bg-red-100 text-red-700",
    },
    {
      name: "RFIs & Changes",
      href: `/dashboard/projects/${currentProjectId}/rfis`,
      icon: HelpCircle,
      active: pathname.includes(`/projects/${currentProjectId}/rfis`),
      badge: "1 Pending",
      badgeColor: "bg-amber-100 text-amber-800",
    },
    {
      name: "Budget & Financials",
      href: `/dashboard/projects/${currentProjectId}/budget`,
      icon: DollarSign,
      active: pathname.includes(`/projects/${currentProjectId}/budget`),
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-screen sticky top-0 border-r border-slate-800 z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3 bg-slate-950">
        <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 shadow-md">
          <HardHat className="w-5 h-5 font-bold" />
        </div>
        <div>
          <span className="font-bold text-white tracking-wide text-base">BuildPulse</span>
          <span className="block text-[10px] text-amber-400 uppercase tracking-widest font-semibold">Pro Construction</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {/* Global Links */}
        <div>
          <div className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Operations
          </div>
          <nav className="space-y-1">
            {globalNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  item.active
                    ? "bg-amber-500 text-slate-950 font-semibold shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Active Project Navigation */}
        <div>
          <div className="px-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <span>Active Project</span>
            <span className="text-[10px] text-amber-400 font-mono">PRJ-001</span>
          </div>
          <nav className="space-y-1">
            {projectNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  item.active
                    ? "bg-slate-800 text-amber-400 font-semibold border-l-4 border-amber-500 pl-2"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                      item.badgeColor || "bg-amber-400/20 text-amber-300"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
            pathname === "/dashboard/settings"
              ? "bg-slate-800 text-amber-400 font-semibold"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
          <span>Settings & Supabase</span>
        </Link>
      </div>
    </aside>
  );
}
