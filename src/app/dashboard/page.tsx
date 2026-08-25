"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  HardHat,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_PUNCH_ITEMS, MOCK_RFIS } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

export default function ExecutiveDashboard() {
  const activeProjects = MOCK_PROJECTS.filter((p) => p.status === "in_progress");
  const totalBudget = MOCK_PROJECTS.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = MOCK_PROJECTS.reduce((acc, p) => acc + p.spent, 0);
  const budgetUtilization = Math.round((totalSpent / totalBudget) * 100);

  const openPunchItems = MOCK_PUNCH_ITEMS.filter((i) => i.status === "open" || i.status === "ready_for_inspection");
  const pendingRFIs = MOCK_RFIS.filter((r) => r.status === "submitted" || r.status === "under_review");

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
              Active operations across {MOCK_PROJECTS.length} commercial and residential sites.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/projects"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>View All Projects</span>
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
                {activeProjects.length} <span className="text-xs font-normal text-slate-400">/ {MOCK_PROJECTS.length} Total</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% on safety compliance
              </span>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>

          {/* Portfolio Budget */}
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
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          {/* Safety Streak */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Days Zero Incidents
              </span>
              <div className="text-2xl font-bold text-emerald-600 mt-1">
                142 Days
              </div>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> OSHA Incident Rate: 0.00
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
                {openPunchItems.length + pendingRFIs.length}
              </div>
              <span className="text-xs text-amber-700 mt-1 block font-medium">
                {pendingRFIs.length} RFIs &bull; {openPunchItems.length} Punch Items
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
            <span>Active Job Sites</span>
          </h2>
          <Link
            href="/dashboard/projects"
            className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
          >
            <span>All Projects Directory</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_PROJECTS.map((project) => {
            const progress = Math.round((project.spent / project.budget) * 100);
            return (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden group"
              >
                {/* Project Image */}
                <div className="h-36 relative overflow-hidden bg-slate-100">
                  <img
                    src={project.cover_image_url}
                    alt={project.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={project.status} />
                  </div>
                  <div className="absolute bottom-2 left-3 bg-slate-950/70 backdrop-blur px-2.5 py-0.5 rounded text-white text-[11px] font-mono font-semibold">
                    {project.code}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="mt-3 text-xs text-slate-600 flex items-center gap-1">
                      <span className="font-semibold text-slate-800">Client:</span> {project.client_name}
                    </div>
                  </div>

                  {/* Budget & Dates */}
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
      </div>

      {/* Critical Tasks & RFIs Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Field Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-amber-500" />
              <span>Upcoming Critical Path Tasks</span>
            </h3>
            <Link
              href="/dashboard/projects/prj-1/tasks"
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Task Board &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {MOCK_TASKS.slice(0, 4).map((task) => (
              <div
                key={task.id}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {task.trade_category}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mt-1 truncate">
                    {task.title}
                  </h4>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> Due {formatDate(task.due_date)}
                  </span>
                </div>
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Pending RFIs & Change Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Requests for Information (RFIs)</span>
            </h3>
            <Link
              href="/dashboard/projects/prj-1/rfis"
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              RFI Log &rarr;
            </Link>
          </div>

          <div className="space-y-2.5">
            {MOCK_RFIS.map((rfi) => (
              <div
                key={rfi.id}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200/80 transition-colors space-y-1.5"
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
                <p className="text-[11px] text-slate-500 line-clamp-2">
                  {rfi.question}
                </p>
                {rfi.impact_cost && (
                  <span className="inline-block text-[10px] text-rose-600 font-bold bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                    Cost Impact: {formatCurrency(rfi.cost_estimate)} ({rfi.impact_days} days)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
