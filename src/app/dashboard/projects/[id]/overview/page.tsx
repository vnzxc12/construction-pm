"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
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
  Camera,
  HardHat,
  Receipt,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Project, Task, DailyLog, Profile, DailyLogCrew, ProjectExpense } from "@/types/database";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge";

export default function ProjectOverviewPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [projectLogs, setProjectLogs] = useState<DailyLog[]>([]);
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [crews, setCrews] = useState<DailyLogCrew[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadProjectDetails() {
      setLoading(true);
      const supabase = createClient();

      const [projRes, tasksRes, logsRes, profilesRes, expRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", params.id).single(),
        supabase.from("tasks").select("*").eq("project_id", params.id).order("due_date", { ascending: true }).limit(5),
        supabase.from("daily_logs").select("*, daily_log_crews(*)").eq("project_id", params.id).order("log_date", { ascending: false }).limit(3),
        supabase.from("profiles").select("*").neq("role", "admin").neq("email", "admin@mbsdesign.com").limit(6),
        supabase.from("project_expenses").select("*").eq("project_id", params.id).order("payment_date", { ascending: false }),
      ]);

      if (projRes.data) setProject(projRes.data);
      if (tasksRes.data) setProjectTasks(tasksRes.data);
      if (logsRes.data) {
        setProjectLogs(logsRes.data);
        const allCrews = (logsRes.data as any[]).flatMap((l) => l.daily_log_crews || []);
        setCrews(allCrews);
      }
      if (profilesRes.data) setTeamMembers(profilesRes.data.filter((m: any) => m.role !== "admin" && m.email !== "admin@mbsdesign.com"));
      if (expRes.data) setExpenses(expRes.data);

      setLoading(false);
    }

    loadProjectDetails();
  }, [params.id]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;
    setUploadingCover(true);

    try {
      const supabase = createClient();
      const fileExt = file.name.split(".").pop();
      const filePath = `covers/${project.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("site-photos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        alert(`Storage upload error: ${uploadError.message}`);
        setUploadingCover(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("site-photos")
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("projects")
        .update({ cover_image_url: publicUrl })
        .eq("id", project.id);

      if (!updateError) {
        setProject({ ...project, cover_image_url: publicUrl });
      }
    } catch (err: any) {
      alert(`Error updating cover photo: ${err?.message}`);
    } finally {
      setUploadingCover(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-sm font-medium">Loading Job Site Details from Supabase...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
        <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Project Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
          This project could not be found in your database.
        </p>
        <Link
          href="/dashboard/projects"
          className="px-4 py-2 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold rounded-lg text-xs"
        >
          &larr; Back to Projects Directory
        </Link>
      </div>
    );
  }

  const totalSpent = expenses.length > 0
    ? expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : project.spent || 0;

  const totalWorkersOnSite = crews.reduce((sum, c) => sum + (c.worker_count || 0), 0);
  const completedTasks = projectTasks.filter((t) => t.status === "done").length;
  const progressPercent = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0;
  const financialPercent = project.budget > 0 ? Math.round((totalSpent / project.budget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Site Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative transition-colors">
        <div className="h-48 relative bg-slate-900">
          <img
            src={project.cover_image_url || "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=80"}
            alt={project.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
          
          {/* Change Cover Photo Button */}
          <div className="absolute top-4 right-4 z-10">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCover}
              className="px-3 py-1.5 bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/80 rounded-lg text-xs font-semibold backdrop-blur shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {uploadingCover ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Cover Photo</span>
                </>
              )}
            </button>
          </div>

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
                href={`/dashboard/projects/${project.id}/budget`}
                className="px-3.5 py-2 bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-semibold rounded-lg text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Log Payment</span>
              </Link>
              <Link
                href={`/dashboard/projects/${project.id}/daily-logs`}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Hammer className="w-4 h-4" />
                <span>Daily Log</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Contract Budget
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatCurrency(project.budget)}
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Spent to Date
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
              {formatCurrency(totalSpent)}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              {financialPercent}% utilized
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Target Completion
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 block">
              {formatDate(project.target_completion_date)}
            </span>
          </div>
          <div className="px-4 py-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Active Trade Workers
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {totalWorkersOnSite > 0 ? `${totalWorkersOnSite} On Site` : "Team Ready"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Progress Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Schedule & Milestone Progress</h3>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{progressPercent}% Tasks Completed</span>
            </div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {project.description || "Active construction site operations."}
            </p>
          </div>

          {/* Recent Payments / Expenses */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-500" />
                <span>Recent Payments & Disbursements</span>
              </h3>
              <Link
                href={`/dashboard/projects/${project.id}/budget`}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Full Financials</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {expenses.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p>No payments or labor payroll logged yet.</p>
                <Link
                  href={`/dashboard/projects/${project.id}/budget`}
                  className="text-amber-600 dark:text-amber-400 font-bold mt-1.5 inline-block hover:underline"
                >
                  + Log First Payment (e.g. ₱10,000)
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {expenses.slice(0, 3).map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{exp.title}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{exp.category} &bull; Paid to {exp.paid_to} &bull; {formatDate(exp.payment_date)}</span>
                    </div>
                    <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">
                      {formatCurrency(exp.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Critical Path Tasks */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Site Schedule</h3>
              <Link
                href={`/dashboard/projects/${project.id}/tasks`}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1"
              >
                <span>Full Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {projectTasks.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No tasks recorded for this site yet.</p>
            ) : (
              <div className="space-y-3">
                {projectTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {task.trade_category || "General"}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1">
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
          {/* Site Workers & Trade Manpower Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                <span>Site Workers & Trade Manpower</span>
              </h3>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {totalWorkersOnSite} Active
              </span>
            </div>

            {crews.length === 0 ? (
              <div className="py-5 text-center text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                <p>Log your daily field report to track carpenters, masons, electricians, and painters.</p>
                <Link
                  href={`/dashboard/projects/${project.id}/daily-logs`}
                  className="text-amber-600 dark:text-amber-400 font-bold mt-1.5 inline-block hover:underline"
                >
                  + Add Daily Field Report
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {crews.map((crew) => (
                  <div
                    key={crew.id}
                    className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">{crew.contractor_name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{crew.trade} &bull; {crew.hours_worked} hrs/day</span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-bold rounded font-mono">
                      {crew.worker_count} Workers
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest Daily Field Report */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Latest Field Report</span>
              </h3>
            </div>

            {projectLogs.length > 0 ? (
              <div className="space-y-3 text-xs">
                <div className="bg-amber-50/60 dark:bg-amber-500/10 p-2.5 rounded-lg border border-amber-200/50 dark:border-amber-500/20">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">Weather & Site Conditions</span>
                  <p className="text-amber-800 dark:text-amber-400">{projectLogs[0].weather_condition}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Work Accomplished</span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {projectLogs[0].work_performed}
                  </p>
                </div>

                <Link
                  href={`/dashboard/projects/${project.id}/daily-logs`}
                  className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <span>View All Daily Logs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                <p>No daily reports logged yet.</p>
                <Link
                  href={`/dashboard/projects/${project.id}/daily-logs`}
                  className="text-amber-600 dark:text-amber-400 font-semibold mt-2 inline-block hover:underline"
                >
                  + Add First Daily Log
                </Link>
              </div>
            )}
          </div>

          {/* Leadership Directory */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span>Project Leadership</span>
            </h3>

            <div className="space-y-3">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                    {member.full_name?.substring(0, 2).toUpperCase() || "AD"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {member.full_name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {member.role?.replace("_", " ")} &bull; {member.company_name || "MBS Studio"}
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