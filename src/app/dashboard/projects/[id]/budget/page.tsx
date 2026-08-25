"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { BudgetLineItem, Project } from "@/types/database";

export default function BudgetPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudget = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, budgetRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("budget_line_items").select("*").eq("project_id", params.id).order("cost_code", { ascending: true }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (budgetRes.data) setLineItems(budgetRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBudget();
  }, [params.id]);

  const totalOriginal = lineItems.reduce((acc, item) => acc + (item.original_budget || 0), 0);
  const totalApprovedChanges = lineItems.reduce((acc, item) => acc + (item.approved_changes || 0), 0);
  const totalRevisedBudget = totalOriginal + totalApprovedChanges;
  const totalCommitted = lineItems.reduce((acc, item) => acc + (item.committed_costs || 0), 0);
  const totalActual = lineItems.reduce((acc, item) => acc + (item.actual_spent || 0), 0);
  const variance = totalRevisedBudget - totalActual;

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
              Project Budget & Cost Control
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            CSI MasterFormat cost codes and billed expenditures stored in Supabase.
          </p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Original Contract
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(project?.budget || totalOriginal)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Baseline contract</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Approved Changes
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {formatCurrency(totalApprovedChanges)}
          </span>
          <span className="text-xs text-blue-800 font-semibold mt-1 block">
            Approved change orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Committed Contracts
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(totalCommitted)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Subcontract agreements
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Actual Spent
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatCurrency(project?.spent || totalActual)}
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            Paid invoices
          </span>
        </div>
      </div>

      {/* CSI Cost Breakdown Table / Empty State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Financial Records...</span>
        </div>
      ) : lineItems.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No CSI Cost Line Items Yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Budget line items will be populated from your CSI schedule and change orders.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">
              Cost Code Line Items (CSI MasterFormat)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Cost Code</th>
                  <th className="px-5 py-3">Category & Scope</th>
                  <th className="px-5 py-3 text-right">Original Budget</th>
                  <th className="px-5 py-3 text-right">Approved Changes</th>
                  <th className="px-5 py-3 text-right">Revised Budget</th>
                  <th className="px-5 py-3 text-right">Actual Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {lineItems.map((item) => {
                  const revised = (item.original_budget || 0) + (item.approved_changes || 0);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {item.cost_code}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-slate-900 block">{item.category}</span>
                        <span className="text-slate-500 text-[11px]">{item.description}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-slate-900">
                        {formatCurrency(item.original_budget || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-right text-blue-600 font-medium">
                        {item.approved_changes > 0 ? `+${formatCurrency(item.approved_changes)}` : "$0"}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(revised)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                        {formatCurrency(item.actual_spent || 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}