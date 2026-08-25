"use client";

import React, { useEffect, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import { Project } from "@/types/database";

export function Sidebar() {
  const pathname = usePathname();
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  useEffect(() => {
    async function getActiveProject() {
      const supabase = createClient();
      const { data: projects } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (projects && projects.length > 0) {
        // Find project from URL if inside /projects/[id]
        const matched = projects.find((p) => pathname.includes(p.id));
        setActiveProject(matched || projects[0]);
      } else {
        setActiveProject(null);
      }
    }

    getActiveProject();
  }, [pathname]);

  const globalNav = [
    {
      name: "Executive Overview",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Projects Directory",
      href: "/dashboard/projects",
      icon: Building2,
      active: pathname === "/dashboard/projects",
    },
  ];

  const projectId = activeProject?.id;

  const projectNav = projectId
    ? [
        {
          name: "Site Overview",
          href: `/dashboard/projects/${projectId}/overview`,
          icon: FolderOpen,
          active: pathname.includes(`/projects/${projectId}/overview`),
        },
        {
          name: "Daily Field Logs",
          href: `/dashboard/projects/${projectId}/daily-logs`,
          icon: CalendarCheck2,
          active: pathname.includes(`/projects/${projectId}/daily-logs`),
        },
        {
          name: "Tasks & Schedule",
          href: `/dashboard/projects/${projectId}/tasks`,
          icon: ListTodo,
          active: pathname.includes(`/projects/${projectId}/tasks`),
        },
        {
          name: "Drawings & Specs",
          href: `/dashboard/projects/${projectId}/drawings`,
          icon: FileSpreadsheet,
          active: pathname.includes(`/projects/${projectId}/drawings`),
        },
        {
          name: "Punch List",
          href: `/dashboard/projects/${projectId}/punch-list`,
          icon: AlertCircle,
          active: pathname.includes(`/projects/${projectId}/punch-list`),
        },
        {
          name: "RFIs & Changes",
          href: `/dashboard/projects/${projectId}/rfis`,
          icon: HelpCircle,
          active: pathname.includes(`/projects/${projectId}/rfis`),
        },
        {
          name: "Budget & Financials",
          href: `/dashboard/projects/${projectId}/budget`,
          icon: DollarSign,
          active: pathname.includes(`/projects/${projectId}/budget`),
        },
      ]
    : [];

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
        {activeProject ? (
          <div>
            <div className="px-3 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span>Active Site</span>
              <span className="text-[10px] text-amber-400 font-mono">{activeProject.code}</span>
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
                </Link>
              ))}
            </nav>
          </div>
        ) : (
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-800 text-xs text-slate-400">
            <span className="font-bold text-slate-300 block mb-1">No Active Projects</span>
            <p className="text-[11px] leading-relaxed">
              Create a project to unlock site daily logs, blueprints, and task boards.
            </p>
            <Link
              href="/dashboard/projects"
              className="mt-2 inline-block text-amber-400 hover:underline font-semibold"
            >
              + Create Project
            </Link>
          </div>
        )}
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