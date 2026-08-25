"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  CloudSun,
  Users,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DailyLog, Project } from "@/types/database";

export default function DailyLogsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Log Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [weather, setWeather] = useState("Clear / Sunny (75°F)");
  const [workDone, setWorkDone] = useState("");
  const [delays, setDelays] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("Zero incidents. Morning safety toolbox talk completed.");

  const fetchLogs = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, logsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("daily_logs").select("*, daily_log_crews(*)").eq("project_id", params.id).order("log_date", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    if (logsRes.data) setLogs(logsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [params.id]);

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDone) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const newLogPayload = {
      project_id: params.id,
      log_date: logDate,
      author_id: user?.id,
      weather_condition: weather,
      temp_high: 76,
      temp_low: 58,
      site_conditions: "Active job site.",
      work_performed: workDone,
      delays_notes: delays || "None.",
      safety_incidents: safetyNotes,
      visitors_log: "Site inspections active.",
    };

    const { data, error } = await supabase
      .from("daily_logs")
      .insert(newLogPayload)
      .select("*, daily_log_crews(*)")
      .single();

    if (data) {
      setLogs([data, ...logs]);
      setShowModal(false);
      setWorkDone("");
      setDelays("");
    } else if (error) {
      alert(`Error saving daily log: ${error.message}`);
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
              Daily Field Reports & Site Logs
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Superintendent field records and safety logs saved directly in Supabase.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Field Report</span>
        </button>
      </div>

      {/* Daily Logs Timeline */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Daily Field Reports...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Daily Field Logs Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Log today&apos;s site progress, weather, and trade activities.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Daily Log</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5"
            >
              {/* Log Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex flex-col items-center justify-center font-bold">
                    <span className="text-[10px] uppercase tracking-wider text-amber-700">Date</span>
                    <span className="text-xs font-mono text-slate-900">
                      {log.log_date?.substring(5) || "Today"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                      <span>Daily Site Report</span>
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {log.log_date}
                      </span>
                    </h3>
                    <span className="text-xs text-slate-500">
                      Logged into PostgreSQL &bull; {log.created_at?.substring(11, 16) || "Today"} UTC
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-lg text-xs font-medium">
                    <CloudSun className="w-4 h-4 text-sky-600" />
                    <span>{log.weather_condition || "Clear"}</span>
                  </div>
                </div>
              </div>

              {/* Work Completed */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Work Completed
                </h4>
                <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/70 leading-relaxed">
                  {log.work_performed}
                </p>
              </div>

              {/* Safety & Delays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Safety Compliance</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.safety_incidents || "Zero incidents."}</p>
                </div>

                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Site Delays</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.delays_notes || "No delays recorded."}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Daily Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Record Daily Field Report</h2>
            <p className="text-xs text-slate-500 mt-1">
              Field entry for {project?.name || "Project"}
            </p>

            <form onSubmit={handleCreateLog} className="space-y-4 mt-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Log Date
                  </label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Weather Condition
                  </label>
                  <input
                    type="text"
                    required
                    value={weather}
                    onChange={(e) => setWeather(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Work Completed Today
                </label>
                <textarea
                  required
                  rows={4}
                  value={workDone}
                  onChange={(e) => setWorkDone(e.target.value)}
                  placeholder="Detail activities, concrete pours, framing, rough-ins, inspections..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Delays or Obstacles (Optional)
                </label>
                <input
                  type="text"
                  value={delays}
                  onChange={(e) => setDelays(e.target.value)}
                  placeholder="Material delays, inspection backlog, weather hold..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Safety Notes & Toolbox Talk
                </label>
                <input
                  type="text"
                  value={safetyNotes}
                  onChange={(e) => setSafetyNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving ? "Saving to Supabase..." : "Publish Field Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}