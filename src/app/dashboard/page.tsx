"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  ArrowUpRight,
  HardHat,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
} from "lucide-react";
import { PesoIcon } from "@/components/ui/peso-icon";
import { createClient } from "@/lib/supabase/client";
import { Project, Task, PunchItem, RFI } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

export default function ExecutiveDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      setLoading(true);
      const supabase = createClient();

      const [projectsRes, tasksRes, punchRes, rfisRes] = await Promise.all([
        supabase.from("projects").select("*").order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("due_date", { ascending: true }).limit(5),
        supabase.from("punch_items").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("rfis").select("*").order("created_at", { ascending: false }).limit(5),
      ]);

      if (projectsRes.data) setProjects(projectsRes.data);
      if (tasksRes.data) setTasks(tasksRes.data);
      if (punchRes.data) setPunchItems(punchRes.data);
      if (rfisRes.data) setRfis(rfisRes.data);

      setLoading(false);
    }

    loadPortfolio();
  }, []);

  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
  const totalSpent = projects.reduce((acc, p) => acc + (p.spent || 0), 0);
  const budgetUtilization = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const activeSites = projects.filter((p) => p.status === "in_progress");

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-medium">Fetching Live Data from Supabase...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / KPIs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Executive Field Portfolio
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Live operational overview across your PostgreSQL job site records.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Projects Directory</span>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Active Sites */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Active Sites
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {activeSites.length} <span className="text-xs font-normal text-slate-400">/ {projects.length} Total</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Database Live
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Portfolio Budget - Changed to PesoIcon */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Committed Budget
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatCurrency(totalSpent)}
              </div>
              <span className="text-xs text-slate-500 mt-1 block">
                {budgetUtilization}% of {formatCurrency(totalBudget)}
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              <PesoIcon className="w-6 h-6" />
            </div>
          </div>

          {/* Safety Streak */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Safety Record
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                0 Incidents
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> OSHA Compliant
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Urgent Action Items */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Action Items
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {punchItems.length + rfis.length}
              </div>
              <span className="text-xs text-amber-700 mt-1 block font-medium">
                {rfis.length} Pending RFIs &bull; {punchItems.length} Punch Items
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Projects Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <HardHat className="w-5 h-5 text-amber-500" />
            <span>Active Job Sites ({projects.length})</span>
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>Manage All Projects</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No Projects Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Get started by creating your first construction site project.
            </p>
            <Link
              href="/dashboard/projects"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Project</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
              return (
                <div
                  key={project.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden"
                >
                  <div className="h-36 relative overflow-hidden bg-slate-100">
                    <img
                      src={project.cover_image_url || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80"}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={project.status} />
                    </div>
                    <div className="absolute bottom-2 left-3 bg-slate-950/70 backdrop-blur px-2.5 py-0.5 rounded text-white text-[11px] font-mono font-semibold">
                      {project.code}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                        {project.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {project.description || "Active construction operations site."}
                      </p>
                      <div className="mt-3 text-xs text-slate-600 flex items-center gap-1">
                        <span className="font-semibold text-slate-800">Client:</span> {project.client_name}
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-slate-600">Financial Progress</span>
                          <span className="text-slate-900">{progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                          <span>Spent: {formatCurrency(project.spent)}</span>
                          <span>Cap: {formatCurrency(project.budget)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Due: {formatDate(project.target_completion_date)}
                        </span>
                        <Link
                          href={`/dashboard/projects/${project.id}/overview`}
                          className="font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          <span>Site Hub</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Critical Tasks & RFIs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Field Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-amber-500" />
              <span>Upcoming Scheduled Tasks</span>
            </h3>
          </div>

          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No tasks recorded in database yet.</p>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {task.trade_category || "General"}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                      {task.title}
                    </h4>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending RFIs */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Recent RFIs</span>
            </h3>
          </div>

          {rfis.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No RFIs submitted in database yet.</p>
          ) : (
            <div className="space-y-2.5">
              {rfis.map((rfi) => (
                <div
                  key={rfi.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 font-mono">
                      RFI #{rfi.rfi_number}
                    </span>
                    <StatusBadge status={rfi.status} />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 line-clamp-1">
                    {rfi.subject}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}