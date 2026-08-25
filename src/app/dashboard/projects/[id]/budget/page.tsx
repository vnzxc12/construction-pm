"use client";

import React, { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  PieChart,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_BUDGET } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { BudgetLineItem } from "@/types/database";

export default function BudgetPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>(MOCK_BUDGET);

  const totalOriginal = lineItems.reduce((acc, item) => acc + item.original_budget, 0);
  const totalApprovedChanges = lineItems.reduce((acc, item) => acc + item.approved_changes, 0);
  const totalRevisedBudget = totalOriginal + totalApprovedChanges;
  const totalCommitted = lineItems.reduce((acc, item) => acc + item.committed_costs, 0);
  const totalActual = lineItems.reduce((acc, item) => acc + item.actual_spent, 0);

  const variance = totalRevisedBudget - totalActual;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project.code}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Project Budget & Cost Control
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            CSI MasterFormat cost codes, committed contracts, and actual billed expenditures.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          <span>Export Financial Report</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Original Contract
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(totalOriginal)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Baseline agreed scope</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Revised Budget
          </span>
          <span className="text-2xl font-bold text-blue-600 mt-1 block">
            {formatCurrency(totalRevisedBudget)}
          </span>
          <span className="text-xs text-blue-800 font-semibold mt-1 block">
            +{formatCurrency(totalApprovedChanges)} approved change orders
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Committed Subcontracts
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(totalCommitted)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {Math.round((totalCommitted / totalRevisedBudget) * 100)}% under contract
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Actual Paid / Invoiced
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            {formatCurrency(totalActual)}
          </span>
          <span className="text-xs text-emerald-700 font-semibold mt-1 block">
            {formatCurrency(variance)} remaining contingency
          </span>
        </div>
      </div>

      {/* CSI Cost Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base">
            Cost Code Line Items (CSI MasterFormat)
          </h3>
          <span className="text-xs text-slate-500">Live PostgreSQL Database View</span>
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
                <th className="px-5 py-3 text-right">Committed</th>
                <th className="px-5 py-3 text-right">Actual Spent</th>
                <th className="px-5 py-3 text-right">Remaining Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {lineItems.map((item) => {
                const revised = item.original_budget + item.approved_changes;
                const remaining = revised - item.actual_spent;
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
                      {formatCurrency(item.original_budget)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-blue-600 font-medium">
                      {item.approved_changes > 0 ? `+${formatCurrency(item.approved_changes)}` : "$0"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(revised)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-700">
                      {formatCurrency(item.committed_costs)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-emerald-700">
                      {formatCurrency(item.actual_spent)}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                      {formatCurrency(remaining)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-900">
              <tr>
                <td colSpan={2} className="px-5 py-3.5 uppercase tracking-wider text-amber-400">
                  Total Project Financials
                </td>
                <td className="px-5 py-3.5 text-right">{formatCurrency(totalOriginal)}</td>
                <td className="px-5 py-3.5 text-right text-amber-400">+{formatCurrency(totalApprovedChanges)}</td>
                <td className="px-5 py-3.5 text-right text-amber-300 font-mono text-sm">{formatCurrency(totalRevisedBudget)}</td>
                <td className="px-5 py-3.5 text-right">{formatCurrency(totalCommitted)}</td>
                <td className="px-5 py-3.5 text-right text-emerald-400">{formatCurrency(totalActual)}</td>
                <td className="px-5 py-3.5 text-right text-amber-400">{formatCurrency(variance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}