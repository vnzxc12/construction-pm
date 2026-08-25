"use client";

import React, { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Project, Task, DailyLog, Profile } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectLogs, setProjectLogs] = useState<DailyLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjectDetails() {
      setLoading(true);
      const supabase = createClient();

      const [projRes, tasksRes, logsRes, profilesRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", params.id).single(),
        supabase.from("tasks").select("*").eq("project_id", params.id).order("due_date", { ascending: true }).limit(5),
        supabase.from("daily_logs").select("*").eq("project_id", params.id).order("log_date", { ascending: false }).limit(1),
        supabase.from("profiles").select("*").limit(4),
      ]);

      if (projRes.data) setProject(projRes.data);
      if (tasksRes.data) setProjectTasks(tasksRes.data);
      if (logsRes.data) setProjectLogs(logsRes.data);
      if (profilesRes.data) setTeamMembers(profilesRes.data);

      setLoading(false);
    }

    loadProjectDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-medium">Loading Job Site Details from Supabase...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
        <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This project could not be found in your database.
        </p>
        <Link
          href="/dashboard/projects"
          className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs"
        >
          &larr; Back to Projects Directory
        </Link>
      </div>
    );
  }

  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Site Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="h-44 relative bg-slate-900">
          <img
            src={project.cover_image_url || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80"}
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
                <span>{project.address}, {project.city}</span>
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
              Client
            </span>
            <span className="text-base font-bold text-slate-800 mt-0.5 block truncate">
              {project.client_name}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Details & Right Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
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
              {project.description || "Active construction site operations."}
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

            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No tasks recorded for this site yet.</p>
            ) : (
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
                          {task.trade_category || "General"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">
                        {task.title}
                      </h4>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Latest Daily Field Report */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Latest Daily Field Log</span>
              </h3>
            </div>

            {projectLogs.length > 0 ? (
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/50">
                  <span className="font-bold text-amber-900 block mb-1">Weather & Site Conditions</span>
                  <p className="text-amber-800">{projectLogs[0].weather_condition}</p>
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
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                <p>No daily reports logged yet.</p>
                <Link
                  href={`/dashboard/projects/${project.id}/daily-logs`}
                  className="text-amber-600 font-semibold mt-2 inline-block hover:underline"
                >
                  + Add First Daily Log
                </Link>
              </div>
            )}
          </div>

          {/* Project Stakeholders */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Project Leadership</span>
            </h3>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    {member.full_name?.substring(0, 2).toUpperCase() || "US"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 truncate">
                      {member.full_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 capitalize">
                      {member.role?.replace("_", " ")} &bull; {member.company_name || "Company"}
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