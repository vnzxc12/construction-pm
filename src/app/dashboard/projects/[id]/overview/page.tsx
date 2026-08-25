"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  Hammer,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_DAILY_LOGS, MOCK_PROFILES } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const projectTasks = MOCK_TASKS.filter((t) => t.project_id === project.id);
  const projectLogs = MOCK_DAILY_LOGS.filter((l) => l.project_id === project.id);
  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 65;

  return (
    <div className="space-y-6">
      {/* Site Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-44 relative bg-slate-900">
          <img
            src={project.cover_image_url}
            alt={project.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="bg-amber-500 text-slate-950 font-mono font-bold text-xs px-2.5 py-0.5 rounded shadow">
                  {project.code}
                </span>
                <StatusBadge status={project.status} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {project.name}
              </h1>
              <div className="flex items-center gap-2 text-slate-300 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>{project.address}, {project.city}, {project.state} {project.zip_code}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/projects/${project.id}/daily-logs`}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-colors flex items-center gap-1.5"
              >
                <Hammer className="w-4 h-4" />
                <span>Daily Log</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Contract Budget
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {formatCurrency(project.budget)}
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Spent to Date
            </span>
            <span className="text-lg font-bold text-amber-600 mt-0.5 block">
              {formatCurrency(project.spent)}
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Target Completion
            </span>
            <span className="text-lg font-bold text-slate-900 mt-0.5 block">
              {formatDate(project.target_completion_date)}
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Headcount
            </span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">
              70 Workers
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">Schedule & Milestone Progress</h3>
              <span className="text-xs font-bold text-amber-600">{progressPercent}% Completed</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* Critical Path Tasks */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Active Site Schedule</h3>
              <Link
                href={`/dashboard/projects/${project.id}/tasks`}
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Full Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {projectTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      <span className="text-xs font-semibold text-slate-700">
                        {task.trade_category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 mt-1">
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) - Field Log & Team */}
        <div className="space-y-6">
          {/* Latest Daily Field Report */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Latest Daily Field Log</span>
              </h3>
              <span className="text-xs text-slate-500 font-semibold font-mono">
                {projectLogs[0]?.log_date || "Today"}
              </span>
            </div>

            {projectLogs[0] && (
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
                  <span className="font-bold text-amber-900 block mb-1">Weather & Site Conditions</span>
                  <p className="text-amber-800">{projectLogs[0].weather_condition} • High {projectLogs[0].temp_high}°F</p>
                  <p className="text-[11px] text-slate-600 mt-1">{projectLogs[0].site_conditions}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-800 block mb-1">Work Accomplished</span>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    {projectLogs[0].work_performed}
                  </p>
                </div>

                <Link
                  href={`/dashboard/projects/${project.id}/daily-logs`}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View All Daily Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Project Stakeholders / Team */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Project Leadership</span>
            </h3>

            <div className="space-y-3">
              {MOCK_PROFILES.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <img
                    src={member.avatar_url}
                    alt={member.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-slate-200"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {member.full_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {member.role.replace("_", " ")} &bull; {member.company_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}