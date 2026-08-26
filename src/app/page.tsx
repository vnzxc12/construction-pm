"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, Shield, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BRAND_CONFIG } from "@/lib/brand.config";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function MainPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect immediately to dashboard
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

      // Handle username login mapping
      if (!rawInput.includes("@")) {
        if (rawInput === "admin") {
          targetEmail = "admin@mbsdesign.com";
        } else {
          // Look up user email in profiles
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
        // Fallback domain retry
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="text-xs font-mono">Connecting to MBS Studio Portal...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 selection:bg-amber-500 selection:text-slate-950 relative">
      {/* Top Bar with Theme Switcher */}
      <div className="max-w-md w-full mx-auto flex items-center justify-end">
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <img
            src={BRAND_CONFIG.logoUrl || "/mbs-logo.png"}
            alt={BRAND_CONFIG.companyName}
            className="w-20 h-20 mx-auto rounded-2xl object-contain bg-white p-2.5 shadow-2xl shadow-slate-900 border border-slate-800 mb-4"
          />
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {BRAND_CONFIG.companyName}
          </h1>
          <p className="mt-1.5 text-xs text-amber-400 font-semibold tracking-widest uppercase">
            {BRAND_CONFIG.tagline}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Username
              </label>
              <div className="mt-1.5 relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  placeholder="e.g. admin"
                  autoComplete="username"
                  autoFocus
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
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-lg text-sm font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all hover:scale-[1.01] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Authorized Access &bull; Managed by MBS Studio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto text-center text-[11px] text-slate-600">
        <p>© {new Date().getFullYear()} {BRAND_CONFIG.companyName}. All rights reserved.</p>
      </footer>
    </div>
  );
}