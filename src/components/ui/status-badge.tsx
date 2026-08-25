import React from "react";
import { cn } from "@/lib/utils";
import { ProjectStatus, TaskStatus, TaskPriority, PunchStatus, PunchSeverity, RFIStatus } from "@/types/database";

export function StatusBadge({ status }: { status: ProjectStatus | TaskStatus | PunchStatus | RFIStatus | string }) {
  const getStyles = () => {
    switch (status) {
      case "in_progress":
      case "under_review":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
      case "done":
      case "approved":
      case "closed":
      case "answered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "planning":
      case "draft":
      case "todo":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "blocked":
      case "rejected":
      case "open":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "on_hold":
      case "submitted":
      case "review":
      case "ready_for_inspection":
        return "bg-amber-50 text-amber-800 border-amber-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
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
        return "bg-orange-100 text-orange-800 border-orange-200 font-semibold";
      case "medium":
      case "minor":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "low":
      case "cosmetic":
        return "bg-slate-100 text-slate-600 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border", getStyles())}>
      {priority.replace(/_/g, " ").toUpperCase()}
    </span>
  );
}
