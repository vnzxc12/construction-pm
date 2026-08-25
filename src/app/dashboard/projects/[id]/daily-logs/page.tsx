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
  Trash2,
  HardHat,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DailyLog, Project, DailyLogCrew } from "@/types/database";

interface CrewInput {
  contractor_name: string;
  trade: string;
  worker_count: number;
  hours_worked: number;
}

export default function DailyLogsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // New Log Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [weather, setWeather] = useState("Clear / Sunny (32°C)");
  const [workDone, setWorkDone] = useState("");
  const [delays, setDelays] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("Zero safety incidents. Site inspected and compliant.");

  // Crew Manpower State
  const [crewInputs, setCrewInputs] = useState<CrewInput[]>([
    { contractor_name: "Lead Carpentry Team", trade: "Carpenters & Woodworking", worker_count: 4, hours_worked: 8 },
  ]);

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

  const handleAddCrewRow = () => {
    setCrewInputs([
      ...crewInputs,
      { contractor_name: "", trade: "Masonry / Tiling", worker_count: 2, hours_worked: 8 },
    ]);
  };

  const handleRemoveCrewRow = (index: number) => {
    setCrewInputs(crewInputs.filter((_, idx) => idx !== index));
  };

  const handleUpdateCrewRow = (index: number, field: keyof CrewInput, value: any) => {
    const updated = [...crewInputs];
    updated[index] = { ...updated[index], [field]: value };
    setCrewInputs(updated);
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDone) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const newLogPayload = {
        project_id: params.id,
        log_date: logDate,
        author_id: user?.id,
        weather_condition: weather,
        temp_high: 32,
        temp_low: 26,
        site_conditions: "Active renovation site.",
        work_performed: workDone,
        delays_notes: delays || "None.",
        safety_incidents: safetyNotes,
        visitors_log: "MBS Design Studio site inspection.",
      };

      // 1. Insert Daily Log
      const { data: logData, error: logError } = await supabase
        .from("daily_logs")
        .insert(newLogPayload)
        .select()
        .single();

      if (logError) {
        alert(`Error saving daily log: ${logError.message}`);
        setSaving(false);
        return;
      }

      // 2. Insert Crew Manpower Rows
      if (logData && crewInputs.length > 0) {
        const validCrews = crewInputs
          .filter((c) => c.contractor_name.trim() !== "")
          .map((c) => ({
            daily_log_id: logData.id,
            contractor_name: c.contractor_name,
            trade: c.trade,
            worker_count: Number(c.worker_count) || 1,
            hours_worked: Number(c.hours_worked) || 8,
          }));

        if (validCrews.length > 0) {
          const { data: savedCrews } = await supabase
            .from("daily_log_crews")
            .insert(validCrews)
            .select();

          logData.daily_log_crews = savedCrews || [];
        }
      }

      setLogs([logData, ...logs]);
      setShowModal(false);
      setWorkDone("");
      setDelays("");
    } catch (err: any) {
      alert(`Error saving log: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project?.code || "MBS"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Daily Field Reports & Trade Manpower
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Superintendent logs, worker headcounts, work performed, and safety records.
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
          <span className="text-sm font-medium">Loading Field Reports...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Daily Reports Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Log today&apos;s site progress, carpenter manpower, and accomplishments.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Daily Report</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {logs.map((log) => {
            const totalCrew = log.daily_log_crews?.reduce((sum, c) => sum + (c.worker_count || 0), 0) || 0;
            return (
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
                        Logged in PostgreSQL &bull; {log.created_at?.substring(11, 16) || "Today"} UTC
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-lg text-xs font-medium">
                      <CloudSun className="w-4 h-4 text-sky-600" />
                      <span>{log.weather_condition || "Clear"}</span>
                    </div>
                    {totalCrew > 0 && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-semibold">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span>{totalCrew} Workers on Site</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Completed */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Work Completed Today
                  </h4>
                  <p className="text-sm text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200/70 leading-relaxed">
                    {log.work_performed}
                  </p>
                </div>

                {/* Worker Crew Table */}
                {log.daily_log_crews && log.daily_log_crews.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Trade Manpower & Crew Headcount
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-2.5">Subcontractor / Crew</th>
                            <th className="px-4 py-2.5">Trade</th>
                            <th className="px-4 py-2.5 text-center">Headcount</th>
                            <th className="px-4 py-2.5 text-right">Hours</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {log.daily_log_crews.map((crew) => (
                            <tr key={crew.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2 font-medium text-slate-900">{crew.contractor_name}</td>
                              <td className="px-4 py-2">{crew.trade}</td>
                              <td className="px-4 py-2 text-center font-bold text-slate-900">{crew.worker_count} Workers</td>
                              <td className="px-4 py-2 text-right">{crew.hours_worked} hrs</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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
                      <span>Site Delays / Roadblocks</span>
                    </div>
                    <p className="text-xs text-slate-700">{log.delays_notes || "No delays recorded."}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Daily Log Modal with Crew Manpower Builder */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Record Daily Field Report</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Field report for {project?.name || "Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="space-y-4 mt-4">
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
                  rows={3}
                  value={workDone}
                  onChange={(e) => setWorkDone(e.target.value)}
                  placeholder="Detail daily accomplishments, framing, tiling, carpentry, electrical..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Trade Workers & Manpower Builder */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800 uppercase tracking-wider">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    <span>Workers & Trade Manpower on Site</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCrewRow}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    + Add Crew Row
                  </button>
                </div>

                <div className="space-y-2">
                  {crewInputs.map((crew, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          value={crew.contractor_name}
                          onChange={(e) => handleUpdateCrewRow(idx, "contractor_name", e.target.value)}
                          placeholder="e.g. Lead Carpentry Team"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={crew.trade}
                          onChange={(e) => handleUpdateCrewRow(idx, "trade", e.target.value)}
                          placeholder="Trade (Carpentry, Tile, Paint)"
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={crew.worker_count}
                          onChange={(e) => handleUpdateCrewRow(idx, "worker_count", parseInt(e.target.value) || 1)}
                          placeholder="Count"
                          className="w-full px-2 py-1.5 border border-slate-200 rounded font-bold text-center"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <span className="text-[10px] text-slate-400">8h</span>
                        {crewInputs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCrewRow(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Delays or Roadblocks (Optional)
                </label>
                <input
                  type="text"
                  value={delays}
                  onChange={(e) => setDelays(e.target.value)}
                  placeholder="Material delivery delays, rain hold, power cut..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Safety Notes
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
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Field Report...</span>
                    </>
                  ) : (
                    <span>Publish Field Report</span>
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