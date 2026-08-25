"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_RFIS, MOCK_CHANGE_ORDERS } from "@/lib/mock-data";
import { RFI, ChangeOrder, RFIStatus } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RFIsPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const [rfis, setRfis] = useState<RFI[]>(MOCK_RFIS);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(MOCK_CHANGE_ORDERS);
  const [activeTab, setActiveTab] = useState<"rfis" | "change_orders">("rfis");
  const [showRfiModal, setShowRfiModal] = useState(false);

  // New RFI Form
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [impactCost, setImpactCost] = useState(false);
  const [costEstimate, setCostEstimate] = useState("0");
  const [impactDays, setImpactDays] = useState("0");

  const handleCreateRFI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !question) return;

    const newRfi: RFI = {
      id: `rfi-${Date.now()}`,
      project_id: project.id,
      rfi_number: rfis.length + 46,
      subject,
      question,
      suggested_solution: solution,
      status: "submitted",
      impact_cost: impactCost,
      cost_estimate: parseFloat(costEstimate) || 0,
      impact_days: parseInt(impactDays) || 0,
      submitted_by: "user-2",
      due_date: "2026-09-10",
      created_at: new Date().toISOString(),
    };

    setRfis([newRfi, ...rfis]);
    setShowRfiModal(false);
    setSubject("");
    setQuestion("");
    setSolution("");
  };

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
              RFIs & Change Order Approvals
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official design clarifications, architect responses, and cost impact governance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRfiModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Submit New RFI</span>
        </button>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("rfis")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "rfis"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Requests For Information ({rfis.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("change_orders")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "change_orders"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <span>Change Orders Log ({changeOrders.length})</span>
        </button>
      </div>

      {/* RFIs View */}
      {activeTab === "rfis" && (
        <div className="space-y-4">
          {rfis.map((rfi) => (
            <div
              key={rfi.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2.5 py-1 rounded">
                    RFI #{rfi.rfi_number}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {rfi.subject}
                  </h3>
                </div>
                <StatusBadge status={rfi.status} />
              </div>

              {/* Question & Solution */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Question / Inquiry:
                  </span>
                  <p className="text-slate-800 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70 leading-relaxed text-sm">
                    {rfi.question}
                  </p>
                </div>

                {rfi.suggested_solution && (
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Suggested Field Solution:
                    </span>
                    <p className="text-slate-600 bg-amber-50/50 p-3 rounded-lg border border-amber-200/50">
                      {rfi.suggested_solution}
                    </p>
                  </div>
                )}

                {/* Official Response */}
                {rfi.official_answer && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Official Architect / Structural Response:</span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-800 font-medium">
                      {rfi.official_answer}
                    </p>
                  </div>
                )}
              </div>

              {/* Impact Footer */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex items-center gap-4">
                  {rfi.impact_cost ? (
                    <span className="font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      Cost Impact: {formatCurrency(rfi.cost_estimate)} (+{rfi.impact_days} days)
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium">No Schedule/Cost Impact</span>
                  )}
                  <span>Due: {formatDate(rfi.due_date)}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">Submitted {formatDate(rfi.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Change Orders View */}
      {activeTab === "change_orders" && (
        <div className="space-y-4">
          {changeOrders.map((co) => (
            <div
              key={co.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold bg-amber-500 text-slate-950 px-2.5 py-1 rounded shadow-sm">
                    CO #{co.co_number}
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">
                    {co.title}
                  </h3>
                </div>
                <StatusBadge status={co.status} />
              </div>

              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                {co.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Financial Amount</span>
                  <span className="font-bold text-slate-900 text-sm">{formatCurrency(co.amount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Schedule Impact</span>
                  <span className="font-bold text-slate-900 text-sm">+{co.schedule_impact_days} Calendar Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Reason</span>
                  <span className="font-semibold text-slate-700 text-xs">{co.reason}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New RFI Modal */}
      {showRfiModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Submit Official RFI</h2>
            <p className="text-xs text-slate-500 mt-1">
              Field clarification for {project.name}
            </p>

            <form onSubmit={handleCreateRFI} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Clash between Plumbing Line and Structural Beam B-18"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Question / Clarification Details
                </label>
                <textarea
                  required
                  rows={4}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Clearly describe the discrepancy, sheet numbers, and specific question for the engineering team..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Proposed Contractor Solution
                </label>
                <input
                  type="text"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Proposed field solution or recommendation..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="impactCheck"
                  checked={impactCost}
                  onChange={(e) => setImpactCost(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="impactCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Potential Cost / Schedule Impact Expected
                </label>
              </div>

              {impactCost && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 uppercase">Estimated Cost ($)</label>
                    <input
                      type="number"
                      value={costEstimate}
                      onChange={(e) => setCostEstimate(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 uppercase">Schedule Delay (Days)</label>
                    <input
                      type="number"
                      value={impactDays}
                      onChange={(e) => setImpactDays(e.target.value)}
                      className="mt-1 w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRfiModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Submit RFI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}