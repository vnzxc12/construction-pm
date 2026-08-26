"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, User, Building, ArrowRight, AtSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/types/database";
import { BRAND_CONFIG } from "@/lib/brand.config";

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState(BRAND_CONFIG.companyName);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("project_manager");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
    const generatedEmail = `${cleanUsername}@mbsdesign.com`;

    const { error } = await supabase.auth.signUp({
      email: generatedEmail,
      password,
      options: {
        data: {
          full_name: fullName || cleanUsername,
          role: role,
          company_name: company,
        },
      },
    });

    if (error) {
      alert(`Signup notice: ${error.message}`);
    } else {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {BRAND_CONFIG.logoUrl ? (
          <img
            src={BRAND_CONFIG.logoUrl}
            alt={BRAND_CONFIG.companyName}
            className="w-16 h-16 mx-auto rounded-2xl object-contain bg-white p-2 shadow-xl shadow-slate-900/50 mb-4"
          />
        ) : (
          <div className="inline-flex w-14 h-14 rounded-2xl bg-amber-500 items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 mb-4 font-black text-xl tracking-tighter">
            {BRAND_CONFIG.initials}
          </div>
        )}
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
        <p className="mt-2 text-sm text-slate-400">Join the {BRAND_CONFIG.companyName} Workspace</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-800 sm:px-10">
          <form className="space-y-4" onSubmit={handleSignup}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Choose Username
              </label>
              <div className="mt-1.5 relative">
                <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. arch_vonn"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="mt-1.5 relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g. Architect Vonn Serrano"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Organization / Practice
              </label>
              <div className="mt-1.5 relative">
                <Building className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Project Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="mt-1.5 w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="project_manager">Lead Architect / Project Manager</option>
                <option value="superintendent">Site Supervisor / Field Engineer</option>
                <option value="subcontractor">Trade Contractor (Fitout, MEP, Finishes)</option>
                <option value="client">Client / Property Owner</option>
                <option value="safety_officer">QA/QC Safety Inspector</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5 relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors mt-2 cursor-pointer"
            >
              {loading ? "Creating Account..." : "Register Account"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
              Sign In with Username
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}