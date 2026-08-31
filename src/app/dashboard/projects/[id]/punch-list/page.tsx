"use client";

import React, { useState, useEffect } from "react";
import {
  AlertCircle,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  Loader2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PunchItem, PunchStatus, PunchSeverity, Project } from "@/types/database";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export default function PunchListPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Punch Item Form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [trade, setTrade] = useState("Drywall / Finishes");
  const [severity, setSeverity] = useState<PunchSeverity>("minor");

  const fetchPunchItems = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, punchRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("punch_items").select("*").eq("project_id", params.id).order("item_number", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (punchRes.data) setPunchItems(punchRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPunchItems();
  }, [params.id]);

  const handleResolveItem = async (id: string) => {
    setPunchItems(
      punchItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "approved" as PunchStatus,
              resolved_at: new Date().toISOString(),
              resolution_notes: "Field verified and signed off.",
            }
          : item
      )
    );

    const supabase = createClient();
    await supabase
      .from("punch_items")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        resolution_notes: "Field verified and signed off.",
      })
      .eq("id", id);
  };

  const handleCreatePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const newPunchPayload = {
      project_id: params.id,
      item_number: punchItems.length + 101,
      title,
      description,
      location: location || "General Site Area",
      status: "open" as PunchStatus,
      severity,
      trade,
      reported_by: user?.id,
      photo_urls: [],
    };

    const { data, error } = await supabase
      .from("punch_items")
      .insert(newPunchPayload)
      .select()
      .single();

    if (data) {
      setPunchItems([data, ...punchItems]);
      setShowModal(false);
      setTitle("");
      setLocation("");
      setDescription("");
    } else if (error) {
      alert(`Error saving punch item: ${error.message}`);
    }

    setSaving(false);
  };

  const filteredItems = punchItems.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase()) ||
      (item.trade && item.trade.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
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
              Punch List & Quality Inspections
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pinpoint site deficiencies and record inspection sign-offs in Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Punch Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by defect or room location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["all", "open", "approved"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterStatus === st
                  ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Punch Items List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Punch List...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Open Punch Items</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Site quality inspection is clean! Click below if you need to log an issue.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log First Punch Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                      #{item.item_number}
                    </span>
                    <PriorityBadge priority={item.severity} />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.trade}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2.5">
                  {item.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{item.location}</span>
                </div>

                {item.description && (
                  <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700 leading-relaxed font-medium">
                    {item.description}
                  </p>
                )}

                {item.resolution_notes && (
                  <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-bold block">Resolution:</span>
                    <span>{item.resolution_notes}</span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 dark:text-slate-500 font-mono">
                  {formatDate(item.created_at)}
                </span>

                {item.status !== "approved" ? (
                  <button
                    type="button"
                    onClick={() => handleResolveItem(item.id)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify & Sign Off</span>
                  </button>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Signed Off
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Punch Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Punch Item</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add defect or inspection item for {project?.name || "Project"}
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

            <form onSubmit={handleCreatePunch} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Issue Title / Defect Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scuffed drywall and missing cover plate"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Site Location / Room
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Level 14 - Room 1402"
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as PunchSeverity)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="cosmetic" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Cosmetic</option>
                    <option value="minor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Minor</option>
                    <option value="major" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Major</option>
                    <option value="critical_safety" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Critical Safety</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Responsible Trade
                </label>
                <input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Defect Description & Correction Required
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific instructions for remediation..."
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
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
                  {saving ? "Saving to Supabase..." : "Save Punch Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}