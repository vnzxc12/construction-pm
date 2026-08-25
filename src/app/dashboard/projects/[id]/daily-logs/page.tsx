"use client";

import React, { useState } from "react";
import {
  Calendar,
  CloudSun,
  Users,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_DAILY_LOGS, MOCK_PROFILES } from "@/lib/mock-data";
import { DailyLog } from "@/types/database";

export default function DailyLogsPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const [logs, setLogs] = useState<DailyLog[]>(MOCK_DAILY_LOGS);
  const [showModal, setShowModal] = useState(false);

  // New Log Form State
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [weather, setWeather] = useState("Clear / Sunny (75°F)");
  const [workDone, setWorkDone] = useState("");
  const [delays, setDelays] = useState("");
  const [safetyNotes, setSafetyNotes] = useState("Zero incidents. Conducted morning safety toolbox talk.");

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workDone) return;

    const newLog: DailyLog = {
      id: `log-${Date.now()}`,
      project_id: project.id,
      log_date: logDate,
      author_id: "user-2",
      weather_condition: weather,
      temp_high: 76,
      temp_low: 58,
      site_conditions: "Active construction site. All cranes operating.",
      work_performed: workDone,
      delays_notes: delays || "None.",
      safety_incidents: safetyNotes,
      visitors_log: "Owner representative on site.",
      crews: [
        { id: `c-${Date.now()}-1`, daily_log_id: `log-${Date.now()}`, contractor_name: "Titan Concrete", trade: "Concrete", worker_count: 18, hours_worked: 8 },
        { id: `c-${Date.now()}-2`, daily_log_id: `log-${Date.now()}`, contractor_name: "Voltic Electrical", trade: "Electrical", worker_count: 12, hours_worked: 8 },
      ],
      created_at: new Date().toISOString(),
    };

    setLogs([newLog, ...logs]);
    setShowModal(false);
    setWorkDone("");
    setDelays("");
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
              Daily Field Reports & Site Logs
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Superintendent field records, subcontractor headcounts, weather tracking, and safety compliance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Daily Field Report</span>
        </button>
      </div>

      {/* Daily Logs Timeline */}
      <div className="space-y-6">
        {logs.map((log) => {
          const totalWorkers = log.crews?.reduce((sum, c) => sum + c.worker_count, 0) || 0;
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
                      {log.log_date.substring(5)}
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
                      Logged by Marcus Vance (Superintendent) &bull; {log.created_at.substring(11, 16)} UTC
                    </span>
                  </div>
                </div>

                {/* Weather & Headcount Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-800 border border-sky-200 px-3 py-1 rounded-lg text-xs font-medium">
                    <CloudSun className="w-4 h-4 text-sky-600" />
                    <span>{log.weather_condition}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg text-xs font-medium">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{totalWorkers} Tradespeople on Site</span>
                  </div>
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

              {/* Labor / Trades Breakdown Table */}
              {log.crews && log.crews.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Subcontractor Labor Headcount
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2.5">Subcontractor</th>
                          <th className="px-4 py-2.5">Trade</th>
                          <th className="px-4 py-2.5 text-center">Crew Count</th>
                          <th className="px-4 py-2.5 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {log.crews.map((crew) => (
                          <tr key={crew.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2 font-medium text-slate-900">{crew.contractor_name}</td>
                            <td className="px-4 py-2">{crew.trade}</td>
                            <td className="px-4 py-2 text-center font-bold text-slate-900">{crew.worker_count}</td>
                            <td className="px-4 py-2 text-right">{crew.hours_worked} hrs</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Safety & Delays Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Safety Inspection & Compliance</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.safety_incidents || "Zero incidents."}</p>
                </div>

                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Site Delays & Obstacles</span>
                  </div>
                  <p className="text-xs text-slate-700">{log.delays_notes || "No delays recorded."}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Daily Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900">Record Daily Field Report</h2>
            <p className="text-xs text-slate-500 mt-1">
              Field entry for {project.name} ({project.code})
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
                  placeholder="Detail trade activities, slab pours, framing, MEP rough-ins, inspections..."
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Delays or Roadblocks (if any)
                </label>
                <input
                  type="text"
                  value={delays}
                  onChange={(e) => setDelays(e.target.value)}
                  placeholder="Traffic, material delivery delays, inspection backlog..."
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
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm"
                >
                  Publish Field Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}