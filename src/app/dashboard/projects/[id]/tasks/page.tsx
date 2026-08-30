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
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Task, TaskStatus, TaskPriority, Project } from "@/types/database";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

const COLUMNS: { id: TaskStatus; title: string; color: string; borderAccent: string }[] = [
  { id: "todo", title: "To Do / Backlog", color: "border-t-slate-400 dark:border-t-slate-500", borderAccent: "border-slate-200 dark:border-slate-800" },
  { id: "in_progress", title: "In Progress (Field)", color: "border-t-amber-500", borderAccent: "border-slate-200 dark:border-slate-800" },
  { id: "review", title: "Inspection / Review", color: "border-t-blue-500", borderAccent: "border-slate-200 dark:border-slate-800" },
  { id: "done", title: "Completed & Verified", color: "border-t-emerald-500", borderAccent: "border-slate-200 dark:border-slate-800" },
];

export default function TasksPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTrade, setFilterTrade] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskTrade, setTaskTrade] = useState("Concrete");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("medium");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("todo");
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

  const openCreateModal = () => {
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskDesc("");
    setTaskTrade("Concrete");
    setTaskPriority("medium");
    setTaskStatus("todo");
    setTaskDueDate(new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTaskId(task.id);
    setTaskTitle(task.title || "");
    setTaskDesc(task.description || "");
    setTaskTrade(task.trade_category || "General");
    setTaskPriority(task.priority || "medium");
    setTaskStatus(task.status || "todo");
    setTaskDueDate(task.due_date || new Date().toISOString().split("T")[0]);
    setShowModal(true);
  };

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

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      project_id: params.id,
      title: taskTitle,
      description: taskDesc,
      status: taskStatus,
      priority: taskPriority,
      trade_category: taskTrade,
      start_date: new Date().toISOString().split("T")[0],
      due_date: taskDueDate,
      created_by: user?.id || null,
      completed_at: taskStatus === "done" ? new Date().toISOString() : null,
    };

    if (editingTaskId) {
      // Update existing task
      const { data: updatedTask, error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editingTaskId)
        .select()
        .single();

      if (updatedTask) {
        setTasks(tasks.map((t) => (t.id === editingTaskId ? updatedTask : t)));
        setShowModal(false);
        setEditingTaskId(null);
      } else if (error) {
        alert(`Error updating task: ${error.message}`);
      }
    } else {
      // Create new task
      const { data: newTask, error } = await supabase
        .from("tasks")
        .insert({
          ...payload,
          order_index: tasks.length,
        })
        .select()
        .single();

      if (newTask) {
        setTasks([...tasks, newTask]);
        setShowModal(false);
        setTaskTitle("");
        setTaskDesc("");
      } else if (error) {
        alert(`Error creating task: ${error.message}`);
      }
    }

    setSaving(false);
  };

  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the task: "${title}"?`)) return;

    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);

    if (!error) {
      setTasks(tasks.filter((t) => t.id !== taskId));
      if (editingTaskId === taskId) {
        setShowModal(false);
        setEditingTaskId(null);
      }
    } else {
      alert(`Error deleting task: ${error.message}`);
    }
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
            <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
              {project?.code || "PRJ"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Task Scheduling & Critical Path Kanban
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track and edit site milestones in real-time across workflow lanes.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Critical Task</span>
        </button>
      </div>

      {/* Trade Filter Bar */}
      {trades.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-2 overflow-x-auto transition-colors">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-2 flex items-center gap-1.5 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Trade:
          </span>
          <button
            type="button"
            onClick={() => setFilterTrade("all")}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex-shrink-0 transition-colors cursor-pointer ${
              filterTrade === "all"
                ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
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
                filterTrade === trade
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {trade}
            </button>
          ))}
        </div>
      )}

      {/* 4-Column Kanban Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
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
                className={`bg-slate-100/80 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col min-h-[500px] border-t-4 ${col.color} transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-xs font-bold font-mono">
                    {colTasks.length}
                  </span>
                </div>

                {/* Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                      Empty
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-amber-500/50 transition-all space-y-2.5 group relative"
                      >
                        {/* Top row: Priority & Trade & Edit Button */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <PriorityBadge priority={task.priority} />
                            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded">
                              {task.trade_category || "General"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => openEditModal(task)}
                            title="Edit Task"
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title (Clickable to Edit) */}
                        <h4
                          onClick={() => openEditModal(task)}
                          className="text-xs font-bold text-slate-900 dark:text-white leading-snug hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors"
                        >
                          {task.title}
                        </h4>

                        {task.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                            {formatDate(task.due_date)}
                          </span>
                        </div>

                        {/* Quick Move Workflow Buttons */}
                        <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-100 dark:border-slate-700/60 text-[10px]">
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
                              className="px-2 py-0.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer"
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
                              className="ml-auto px-2 py-0.5 bg-slate-100 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 dark:hover:bg-amber-500 dark:hover:text-slate-950 font-bold text-slate-700 dark:text-slate-200 rounded transition-colors cursor-pointer"
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

      {/* Add / Edit Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {editingTaskId ? "Edit Critical Task" : "Add Critical Task"}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {editingTaskId ? "Modify task milestone and schedule" : `Add milestone for ${project?.name || "Project"}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 mt-5">
              {/* Task Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Level 18 Post-Tension Slab Pour"
                  className="mt-1 w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Description / Inspection Notes
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Describe prerequisites, equipment, or engineer sign-off required..."
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-medium"
                />
              </div>

              {/* Status (If editing) & Trade */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Workflow Status
                  </label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
                  >
                    <option value="todo" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">To Do / Backlog</option>
                    <option value="in_progress" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">In Progress (Field)</option>
                    <option value="review" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Inspection / Review</option>
                    <option value="done" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Completed & Verified</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Trade
                  </label>
                  <input
                    type="text"
                    required
                    value={taskTrade}
                    onChange={(e) => setTaskTrade(e.target.value)}
                    placeholder="e.g. Concrete, Electrical, Carpentry"
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Priority & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer font-medium"
                  >
                    <option value="low" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Low</option>
                    <option value="medium" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Medium</option>
                    <option value="high" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">High</option>
                    <option value="critical" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                {editingTaskId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(editingTaskId, taskTitle)}
                    className="px-3 py-2 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Task</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingTaskId ? "Save Changes" : "Create Task"}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}