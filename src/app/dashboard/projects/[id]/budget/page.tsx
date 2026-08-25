"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Receipt,
  Calendar,
  Wallet,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { BudgetLineItem, Project, ProjectExpense } from "@/types/database";
import { PesoIcon } from "@/components/ui/peso-icon";

const EXPENSE_CATEGORIES = [
  "Labor / Payroll",
  "Materials & Supplies",
  "Subcontractor Work",
  "Equipment Rental",
  "Permits & Fees",
  "Transportation & Logistics",
  "Miscellaneous / Site Petty Cash",
];

export default function BudgetPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);

  // Expense Form State
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("10000");
  const [expCategory, setExpCategory] = useState("Labor / Payroll");
  const [expPaidTo, setExpPaidTo] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expNotes, setExpNotes] = useState("");

  const fetchBudgetAndExpenses = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, budgetRes, expRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("budget_line_items").select("*").eq("project_id", params.id).order("cost_code", { ascending: true }),
      supabase.from("project_expenses").select("*").eq("project_id", params.id).order("payment_date", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (budgetRes.data) setLineItems(budgetRes.data);
    if (expRes.data) setExpenses(expRes.data);

    setLoading(false);
  };

  useEffect(() => {
    fetchBudgetAndExpenses();
  }, [params.id]);

  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expAmount) return;
    setSavingExpense(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const amountNum = parseFloat(expAmount) || 0;

    const newExpensePayload = {
      project_id: params.id,
      title: expTitle,
      category: expCategory,
      amount: amountNum,
      payment_date: expDate,
      paid_to: expPaidTo || "Field Contractor",
      notes: expNotes,
      created_by: user?.id,
    };

    const { data: insertedExp, error } = await supabase
      .from("project_expenses")
      .insert(newExpensePayload)
      .select()
      .single();

    if (insertedExp) {
      const updatedExpenses = [insertedExp, ...expenses];
      setExpenses(updatedExpenses);

      // Recalculate total project spent and update projects table
      const newTotalSpent = updatedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      await supabase
        .from("projects")
        .update({ spent: newTotalSpent })
        .eq("id", params.id);

      if (project) {
        setProject({ ...project, spent: newTotalSpent });
      }

      setShowExpenseModal(false);
      setExpTitle("");
      setExpPaidTo("");
      setExpNotes("");
    } else if (error) {
      console.error("Error saving expense:", error);
      alert(`Error saving payment: ${error.message}`);
    }

    setSavingExpense(false);
  };

  // Calculations
  const totalOriginal = project?.budget || lineItems.reduce((acc, item) => acc + (item.original_budget || 0), 0);
  const totalActual = expenses.reduce((acc, item) => acc + Number(item.amount || 0), 0) || project?.spent || 0;
  const remainingContingency = totalOriginal - totalActual;
  const utilization = totalOriginal > 0 ? Math.round((totalActual / totalOriginal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project?.code || "MBS"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Project Budget & Cost Control
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Log worker payroll, material purchases, and track remaining budget in real time.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowExpenseModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm shadow-md transition-all hover:scale-[1.02] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Payment / Expense</span>
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Approved Contract Budget
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {formatCurrency(totalOriginal)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">Baseline contract ceiling</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Paid / Spent
          </span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {formatCurrency(totalActual)}
          </span>
          <span className="text-xs text-amber-700 font-semibold mt-1 block">
            {utilization}% of total budget
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Remaining Balance
          </span>
          <span className={`text-2xl font-bold mt-1 block ${remainingContingency >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatCurrency(remainingContingency)}
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            {remainingContingency >= 0 ? "Available funds" : "Over budget"}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Logged Payments
          </span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {expenses.length} Records
          </span>
          <span className="text-xs text-slate-500 mt-1 block">
            Payroll & materials
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span className="text-slate-700">Financial Budget Utilization</span>
          <span className="text-amber-600">{formatCurrency(totalActual)} / {formatCurrency(totalOriginal)} ({utilization}%)</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${utilization > 90 ? "bg-rose-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"}`}
            style={{ width: `${Math.min(utilization, 100)}%` }}
          />
        </div>
      </div>

      {/* Live Payment & Expense History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">
              Logged Payments & Cost Disbursements ({expenses.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
          >
            + Add Payment
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <span className="text-sm font-medium">Loading Financial History...</span>
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Wallet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">No Payments Logged Yet</h4>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Paid weekly worker wages, materials, or subcontractors? Click below to log it.
            </p>
            <button
              type="button"
              onClick={() => setShowExpenseModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log First Payment (e.g. ₱10,000)</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Expense / Payment Title</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Paid To / Recipient</th>
                  <th className="px-5 py-3 text-right">Amount (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {formatDate(exp.payment_date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-slate-900 block text-sm">{exp.title}</span>
                      {exp.notes && (
                        <span className="text-[11px] text-slate-500 block mt-0.5">{exp.notes}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {exp.paid_to || "Field Worker"}
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-amber-600 text-sm font-mono">
                      {formatCurrency(exp.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-900 text-white font-bold text-xs">
                <tr>
                  <td colSpan={4} className="px-5 py-3.5 uppercase tracking-wider text-amber-400">
                    Total Disbursed Expenses
                  </td>
                  <td className="px-5 py-3.5 text-right text-amber-400 font-mono text-base">
                    {formatCurrency(totalActual)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Log Payment / Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Log Project Payment / Expense</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Record payroll or purchase for {project?.name || "Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Payment Title / Description
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g. Weekly Carpenter Labor Payroll (Week 1)"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Amount (₱ PHP)
                  </label>
                  <input
                    type="number"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="10000"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Paid To / Recipient
                  </label>
                  <input
                    type="text"
                    value={expPaidTo}
                    onChange={(e) => setExpPaidTo(e.target.value)}
                    placeholder="e.g. Mang Jose (Carpentry Lead)"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Receipt Notes / Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="Notes on scope, materials breakdown, or acknowledgement..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {savingExpense ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Recording Payment...</span>
                    </>
                  ) : (
                    <span>Save & Deduct from Budget</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}