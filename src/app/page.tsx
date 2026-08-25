import React from "react";
import Link from "next/link";
import {
  Building2,
  CalendarCheck,
  ListTodo,
  FileSpreadsheet,
  AlertTriangle,
  ArrowRight,
  Database,
  Cloud,
  Github,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { BRAND_CONFIG } from "@/lib/brand.config";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 font-black text-base tracking-tighter">
              {BRAND_CONFIG.initials}
            </div>
            <div>
              <span className="font-bold text-white tracking-wide text-lg">{BRAND_CONFIG.companyName}</span>
              <span className="block text-[10px] text-amber-400 font-semibold uppercase tracking-widest">
                {BRAND_CONFIG.tagline}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-md transition-all hover:scale-[1.02]"
            >
              <span>Enter Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Proprietary Design & Construction Platform</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight max-w-4xl leading-tight">
          Field-to-Office Project Management for <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">{BRAND_CONFIG.companyName}</span>
        </h1>

        <p className="mt-6 text-lg text-slate-400 max-w-2xl">
          Empowering our architects, engineers, trade contractors, and clients with real-time daily field logs, multi-version blueprint management, interactive task scheduling, and quality punch lists.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-base shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
          >
            <span>Open Project Portal</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/dashboard/projects"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-base border border-slate-700 transition-all flex items-center gap-2"
          >
            <Building2 className="w-5 h-5 text-amber-400" />
            <span>Active Job Sites Directory</span>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-slate-900/50 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Engineered for Architecture & Construction Excellence</h2>
            <p className="text-slate-400 mt-2 text-sm">Real-time collaboration across design, permits, structural work, and interior fitout.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Daily Field Logs & Weather</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Log daily site conditions, weather, trade manpower, and safety compliance directly from tablet or mobile.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <ListTodo className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Milestone Kanban Scheduling</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Track architectural deliverables, structural inspections, and trade progress across custom status lanes.
              </p>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-amber-500/50 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Blueprints & Document Storage</h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Manage architectural, structural, and interior drawing revisions backed by secure cloud storage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800 py-8 px-6 text-center text-xs text-slate-500">
        <p>{BRAND_CONFIG.companyName} • {BRAND_CONFIG.tagline}</p>
      </footer>
    </div>
  );
}