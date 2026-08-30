"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Loader2,
  CalendarCheck2,
  Coins,
  FileSpreadsheet,
  HardHat,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Footer } from "@/components/layout/footer";

export default function SplitLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.warn("Session check:", err);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const rawInput = username.trim().toLowerCase();
      let targetEmail = rawInput;

      if (!rawInput.includes("@")) {
        if (rawInput === "admin") {
          targetEmail = "admin@mbsdesign.com";
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .or(`email.ilike.${rawInput}@%,email.ilike.${rawInput}`)
            .limit(1)
            .maybeSingle();

          if (profile?.email) {
            targetEmail = profile.email;
          } else {
            targetEmail = `${rawInput}@mbsdesign.com`;
          }
        }
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        if (!rawInput.includes("@") && targetEmail.endsWith("@mbsdesign.com")) {
          const secondTry = await supabase.auth.signInWithPassword({
            email: `${rawInput}@test.com`,
            password,
          });

          if (!secondTry.error) {
            router.push("/dashboard");
            return;
          }
        }

        setError(
          authError.message === "Invalid login credentials"
            ? "Invalid username or password. Please check your credentials."
            : authError.message
        );
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

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 space-y-3 px-4">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
          Connecting to MBS Studio Portal...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 transition-colors">
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between p-4 sm:p-6 pb-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Portal Systems Operational
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* 2-Column Split Responsive Card Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-xl sm:shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12 transition-all">
          {/* Left Column: Brand & Feature Highlights */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 bg-slate-50/80 dark:bg-slate-900/50 flex flex-col justify-between space-y-6 sm:space-y-8 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
            <div>
              {/* Logo and Brand */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <img
                  src={BRAND_CONFIG.logoUrl || "/mbs-logo.png"}
                  alt={BRAND_CONFIG.companyName}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-contain bg-white p-1.5 shadow border border-slate-200 dark:border-slate-700 flex-shrink-0"
                />
                <div>
                  <span className="font-black text-slate-900 dark:text-white tracking-tight text-base sm:text-lg block uppercase">
                    {BRAND_CONFIG.companyName}
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase block">
                    Design & Construction Services
                  </span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                PROJECT & SITE <br />
                <span className="text-amber-500">OPERATIONS PORTAL</span>
              </h1>

              <div className="mt-2.5 sm:mt-3">
                <span className="inline-block px-3 py-1 bg-amber-500 text-slate-950 text-[11px] sm:text-xs font-extrabold uppercase tracking-wider rounded-full shadow-sm">
                  MBS STUDIO MANAGEMENT SUITE
                </span>
              </div>

              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Enterprise project management suite for daily field reports, blueprint storage, budget control, and milestone Kanban tracking.
              </p>

              {/* Feature Badges List */}
              <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3.5">
                <div className="flex items-start gap-3 p-2.5 sm:p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <CalendarCheck2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                      Daily Field Reports & Trade Manpower
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Live site conditions, carpenter/mason headcounts, and worker hours.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 sm:p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                      Cost & Budget Control (₱ PHP)
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Real-time payment disbursement logs and automated remaining balance calculator.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 sm:p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                      Blueprints & Revision Vault
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Cloud storage for PDF architectural plans, site photos, and CAD drawings.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Badge */}
            <div className="pt-2 hidden sm:block">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 text-white dark:bg-slate-800 rounded-full text-xs font-bold shadow-sm">
                <HardHat className="w-3.5 h-3.5 text-amber-400" />
                <span>Job Site Operations: Active Projects & Scheduling</span>
              </span>
            </div>
          </div>

          {/* Right Column: Account Sign In Form */}
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 bg-white dark:bg-slate-900 flex flex-col justify-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Account Sign In
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your assigned username and password to log in.
              </p>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4 mt-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter username"
                      autoComplete="username"
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 sm:top-3 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-4 py-3 sm:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer min-h-[48px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Encrypted Session &bull; Username Authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Enterprise Footer */}
      <Footer className="bg-transparent border-t border-slate-200/80 dark:border-slate-800/80" />
    </div>
  );
}