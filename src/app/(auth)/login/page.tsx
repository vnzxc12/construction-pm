"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HardHat, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoRole = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-xl bg-amber-500 items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 mb-4">
          <HardHat className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">BuildPulse</h2>
        <p className="mt-2 text-sm text-slate-400">Sign in to your Construction Workspace</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-800 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5 relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="name@company.com"
                />
              </div>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors cursor-pointer"
            >
              {loading ? "Authenticating..." : "Sign In"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Quick Login
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDemoRole("vonn@test.com")}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <HardHat className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">vonn@test.com</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoRole("sarah.connor@apexconstruction.com")}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-left transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">Sarah (Demo PM)</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              Need an account? Register new user &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}