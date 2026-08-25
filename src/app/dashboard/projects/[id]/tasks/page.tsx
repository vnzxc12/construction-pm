"use client";

import React, { useState, useEffect } from "react";
import {
  ListTodo,
  Plus,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskStatus, TaskPriority, Project } from "@/types/database";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: "todo", title: "To Do / Backlog", color: "border-t-slate-400" },
  { id: "in_progress", title: "In Progress (Field)", color: "border-t-amber-500" },
  { id: "review", title: "Inspection / Review", color: "border-t-blue-500" },
  { id: "done", title: "Completed & Verified", color: "border-t-emerald-500" },
];

export default function TasksPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Task Form
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskTrade, setTaskTrade] = useState("Concrete");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskDueDate, setTaskDueDate] = useState("2026-09-15");

  const fetchTasks = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, tasksRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("tasks").select("*").eq("project_id", params.id).order("order_index", { ascending: true }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (tasksRes.data) setTasks(tasksRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [params.id]);

  const trades = Array.from(new Set(tasks.map((t) => t.trade_category || "General")));

  const moveTaskStatus = async (taskId: string, nextStatus: TaskStatus) => {
    // Optimistic UI update
    setTasks(
      tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: nextStatus,
              completed_at: nextStatus === "done" ? new Date().toISOString() : undefined,
            }
          : t
      )
    );

    const supabase = createClient();
    await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "done" ? new Date().toISOString() : null,
      })
      .eq("id", taskId);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const newTaskPayload = {
      project_id: params.id,
      title: taskTitle,
      description: taskDesc,
      status: "todo" as TaskStatus,
      priority: taskPriority,
      trade_category: taskTrade,
      start_date: new Date().toISOString().split("T")[0],
      due_date: taskDueDate,
      order_index: tasks.length,
      created_by: user?.id,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(newTaskPayload)
      .select()
      .single();

    if (data) {
      setTasks([...tasks, data]);
      setShowModal(false);
      setTaskTitle("");
      setTaskDesc("");
    } else if (error) {
      alert(`Error creating task: ${error.message}`);
    }

    setSaving(false);
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterTrade === "all") return true;
    return t.trade_category === filterTrade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project?.code || "PRJ"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Task Scheduling & Critical Path Kanban
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track site milestones in PostgreSQL with real-time status transitions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Critical Task</span>
        </button>
      </div>

      {/* Trade Filter Bar */}
      {trades.length > 0 && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 flex items-center gap-1.5 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Trade:
          </span>
          <button
            type="button"
            onClick={() => setFilterTrade("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
              filterTrade === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Trades ({tasks.length})
          </button>
          {trades.map((trade) => (
            <button
              key={trade}
              type="button"
              onClick={() => setFilterTrade(trade)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
                filterTrade === trade ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {trade}
            </button>
          ))}
        </div>
      )}

      {/* 4-Column Kanban Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Tasks from Database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className={`bg-slate-100/70 rounded-2xl p-4 border border-slate-200 flex flex-col min-h-[500px] border-t-4 ${col.color}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-white text-slate-800 border border-slate-300 flex items-center justify-center text-xs font-bold font-mono">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Empty
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow transition-shadow space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <PriorityBadge priority={task.priority} />
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded">
                            {task.trade_category || "General"}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatDate(task.due_date)}
                          </span>
                        </div>

                        {/* Quick Move Workflow Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100 text-[10px]">
                          {col.id !== "todo" && (
                            <button
                              type="button"
                              onClick={() => {
                                const prevStatus: Record<TaskStatus, TaskStatus> = {
                                  todo: "todo",
                                  in_progress: "todo",
                                  review: "in_progress",
                                  done: "review",
                                  blocked: "todo",
                                };
                                moveTaskStatus(task.id, prevStatus[col.id]);
                              }}
                              className="px-2 py-0.5 text-slate-500 hover:bg-slate-100 rounded cursor-pointer"
                            >
                              &larr; Back
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              type="button"
                              onClick={() => {
                                const nextStatus: Record<TaskStatus, TaskStatus> = {
                                  todo: "in_progress",
                                  in_progress: "review",
                                  review: "done",
                                  done: "done",
                                  blocked: "todo",
                                };
                                moveTaskStatus(task.id, nextStatus[col.id]);
                              }}
                              className="ml-auto px-2 py-0.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-950 font-bold text-slate-700 rounded transition-colors cursor-pointer"
                            >
                              Advance &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Add Critical Task</h2>
            <p className="text-xs text-slate-500 mt-1">
              Add milestone for {project?.name || "Project"}
            </p>

            <form onSubmit={handleCreateTask} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Level 18 Post-Tension Slab Pour"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Description / Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Describe prerequisites, equipment, or engineer sign-off required..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Trade
                  </label>
                  <input
                    type="text"
                    value={taskTrade}
                    onChange={(e) => setTaskTrade(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving ? "Saving to Supabase..." : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}