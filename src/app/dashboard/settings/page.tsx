"use client";

import React, { useState } from "react";
import {
  Database,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  Key,
  Globe,
  HardHat,
  Users,
  ShieldCheck,
  Copy,
  ExternalLink,
} from "lucide-react";
import { MOCK_PROFILES } from "@/lib/mock-data";

export default function SettingsPage() {
  const [copied, setCopied] = useState(false);

  const copySqlPath = () => {
    navigator.clipboard?.writeText("supabase/schema.sql");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Organization & Backend Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your enterprise organization profile, team permissions, and Supabase / Vercel cloud integrations.
        </p>
      </div>

      {/* Supabase Connection Status Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Supabase Backend & Storage Integration
              </h2>
              <span className="text-xs text-slate-500">PostgreSQL • Auth • Storage Buckets • Row Level Security</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Ready for Live Connection
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              1. Database Schema
            </span>
            <p className="text-slate-600 leading-relaxed">
              We generated a complete PostgreSQL schema in <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> including 10 tables, triggers, and RLS policies.
            </p>
            <button
              type="button"
              onClick={copySqlPath}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copied ? "Path Copied!" : "Copy schema.sql path"}</span>
            </button>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider block">
              2. Storage Buckets
            </span>
            <p className="text-slate-600 leading-relaxed">
              Configured buckets for <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono">blueprints</code>, <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono">site-photos</code>, and <code className="bg-slate-200 text-slate-900 px-1 py-0.5 rounded font-mono">project-documents</code>.
            </p>
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-700 font-bold hover:underline"
            >
              <span>Open Supabase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Environment Variables Reference */}
        <div className="bg-slate-950 text-slate-300 p-4 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
          <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-bold text-white flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-400" /> Required Environment Variables (.env)
            </span>
            <span className="text-[10px]">Vercel / Local</span>
          </div>
          <p className="text-amber-400">NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</p>
          <p className="text-amber-400">NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
          <p className="text-slate-500">SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
        </div>
      </div>

      {/* Team & Role Permissions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-500" />
          <span>Active Organization Members & Roles</span>
        </h2>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {MOCK_PROFILES.map((profile) => (
            <div key={profile.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="flex items-center gap-3">
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200"
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{profile.full_name}</h4>
                  <span className="text-[11px] text-slate-500">{profile.email} &bull; {profile.company_name}</span>
                </div>
              </div>

              <span className="text-xs font-bold font-mono uppercase bg-slate-100 text-slate-800 px-2.5 py-1 rounded border border-slate-200">
                {profile.role.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}