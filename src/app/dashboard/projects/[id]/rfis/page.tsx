"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Search,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RFI, ChangeOrder, Project, RFIStatus } from "@/types/database";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function RFIsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"rfis" | "change_orders">("rfis");
  const [loading, setLoading] = useState(true);
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New RFI Form
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [solution, setSolution] = useState("");
  const [impactCost, setImpactCost] = useState(false);
  const [costEstimate, setCostEstimate] = useState("0");
  const [impactDays, setImpactDays] = useState("0");

  const fetchRFIs = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, rfisRes, coRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("rfis").select("*").eq("project_id", params.id).order("rfi_number", { ascending: false }),
      supabase.from("change_orders").select("*").eq("project_id", params.id).order("co_number", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (rfisRes.data) setRfis(rfisRes.data);
    if (coRes.data) setChangeOrders(coRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRFIs();
  }, [params.id]);

  const handleCreateRFI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !question) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const newRfiPayload = {
      project_id: params.id,
      rfi_number: rfis.length + 1,
      subject,
      question,
      suggested_solution: solution,
      status: "submitted" as RFIStatus,
      impact_cost: impactCost,
      cost_estimate: parseFloat(costEstimate) || 0,
      impact_days: parseInt(impactDays) || 0,
      submitted_by: user?.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    };

    const { data, error } = await supabase
      .from("rfis")
      .insert(newRfiPayload)
      .select()
      .single();

    if (data) {
      setRfis([data, ...rfis]);
      setShowRfiModal(false);
      setSubject("");
      setQuestion("");
      setSolution("");
    } else if (error) {
      alert(`Error submitting RFI: ${error.message}`);
    }

    setSaving(false);
  };

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
              RFIs & Change Orders
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Design clarifications and architect inquiries saved in Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowRfiModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
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
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
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
          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
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
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading RFIs from Database...</span>
        </div>
      ) : activeTab === "rfis" ? (
        rfis.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">No RFIs Submitted Yet</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              Need design or engineering clarification? Submit an RFI below.
            </p>
            <button
              type="button"
              onClick={() => setShowRfiModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Submit First RFI</span>
            </button>
          </div>
        ) : (
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

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Inquiry / Discrepancy:
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

                  {rfi.official_answer && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Official Engineer Response:</span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-800 font-medium">
                        {rfi.official_answer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Change Orders on File</h3>
          <p className="text-xs text-slate-500 mt-1">
            Approved scope modifications will appear here.
          </p>
        </div>
      )}

      {/* New RFI Modal */}
      {showRfiModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Submit Official RFI</h2>
            <p className="text-xs text-slate-500 mt-1">
              Engineering clarification for {project?.name || "Project"}
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
                  placeholder="e.g. Clash between Plumbing Line and Structural Beam"
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
                  placeholder="Describe discrepancy and specific question for engineer..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Proposed Solution (Optional)
                </label>
                <input
                  type="text"
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Field recommendation..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowRfiModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving ? "Saving to Supabase..." : "Submit RFI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}