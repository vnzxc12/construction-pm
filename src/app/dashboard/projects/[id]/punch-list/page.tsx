"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Plus,
  Search,
  Filter,
  MapPin,
  Camera,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_PUNCH_ITEMS } from "@/lib/mock-data";
import { PunchItem, PunchStatus, PunchSeverity } from "@/types/database";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";

export default function PunchListPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const [punchItems, setPunchItems] = useState<PunchItem[]>(MOCK_PUNCH_ITEMS);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // New Punch Item Form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [trade, setTrade] = useState("Drywall / Finishes");
  const [severity, setSeverity] = useState<PunchSeverity>("minor");

  const filteredItems = punchItems.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      (item.trade && item.trade.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const handleResolveItem = (id: string) => {
    setPunchItems(
      punchItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "approved" as PunchStatus,
              resolved_at: new Date().toISOString(),
              resolution_notes: "Field verified by Superintendent. Corrective work accepted.",
            }
          : item
      )
    );
  };

  const handleCreatePunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    const newItem: PunchItem = {
      id: `punch-${Date.now()}`,
      project_id: project.id,
      item_number: punchItems.length + 101,
      title,
      description,
      location: location || "General Site Area",
      status: "open",
      severity,
      trade,
      reported_by: "user-2",
      photo_urls: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80",
      ],
      created_at: new Date().toISOString(),
    };

    setPunchItems([newItem, ...punchItems]);
    setShowModal(false);
    setTitle("");
    setLocation("");
    setDescription("");
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
              Punch List & Quality Inspections
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pinpoint site deficiencies, attach photos, assign trades, and record sign-offs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Log Punch Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by defect or room location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["all", "open", "ready_for_inspection", "approved"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Punch Items List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                    #{item.item_number}
                  </span>
                  <PriorityBadge priority={item.severity} />
                  <span className="text-xs font-medium text-slate-500">{item.trade}</span>
                </div>
                <StatusBadge status={item.status} />
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-2.5">
                {item.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{item.location}</span>
              </div>

              {item.description && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
                  {item.description}
                </p>
              )}

              {/* Photo Previews */}
              {item.photo_urls && item.photo_urls.length > 0 && (
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Field Photos ({item.photo_urls.length})
                  </span>
                  <div className="flex gap-2">
                    {item.photo_urls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt="Defect"
                        className="w-20 h-16 rounded-lg object-cover border border-slate-200 hover:opacity-90 cursor-pointer"
                      />
                    ))}
                  </div>
                </div>
              )}

              {item.resolution_notes && (
                <div className="mt-3 p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-800">
                  <span className="font-bold block">Resolution Verified:</span>
                  <span>{item.resolution_notes}</span>
                </div>
              )}
            </div>

            {/* Footer Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">
                Reported {formatDate(item.created_at)}
              </span>

              {item.status !== "approved" ? (
                <button
                  type="button"
                  onClick={() => handleResolveItem(item.id)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Verify & Sign Off</span>
                </button>
              ) : (
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Signed Off
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Punch Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Record Punch Item</h2>
            <p className="text-xs text-slate-500 mt-1">
              Add defect or inspection item on {project.name}
            </p>

            <form onSubmit={handleCreatePunch} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Issue Title / Defect Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scuffed drywall and missing cover plate"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Site Location / Room
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Level 14 - Room 1402"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as PunchSeverity)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="cosmetic">Cosmetic</option>
                    <option value="minor">Minor</option>
                    <option value="major">Major</option>
                    <option value="critical_safety">Critical Safety</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Responsible Trade
                </label>
                <input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Defect Description & Correction Required
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific instructions for subcontractor remediation..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Save Punch Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}