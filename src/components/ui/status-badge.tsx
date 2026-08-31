import React from "react";
import { cn } from "@/lib/utils";
import { ProjectStatus, TaskStatus, TaskPriority, PunchStatus, PunchSeverity, RFIStatus } from "@/types/database";

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus | PunchStatus | RFIStatus | string }) {
  const getStyles = () => {
    switch (status) {
      case "in_progress":
      case "under_review":
        return "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60";
      case "completed":
      case "done":
      case "approved":
      case "closed":
      case "answered":
        return "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60";
      case "planning":
      case "draft":
      case "todo":
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
      case "blocked":
      case "rejected":
      case "open":
        return "bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60";
      case "on_hold":
      case "submitted":
      case "review":
      case "ready_for_inspection":
        return "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60";
      default:
        return "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  const getLabel = () => {
    return status.replace(/_/g, " ").toUpperCase();
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", getStyles())}>
      {getLabel()}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority | PunchSeverity | string }) {
  const getStyles = () => {
    switch (priority) {
      case "critical":
      case "critical_safety":
        return "bg-red-500 text-white border-red-600 animate-pulse";
      case "high":
      case "major":
        return "bg-orange-100 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800/60 font-semibold";
      case "medium":
      case "minor":
        return "bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/60";
      case "low":
      case "cosmetic":
        return "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";
      default:
        return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    }
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", getStyles())}>
      {priority.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}