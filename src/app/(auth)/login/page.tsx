"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, ArrowRight, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BRAND_CONFIG } from "@/lib/brand.config";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          // 1. Try to find user email in profiles by matching prefix or username
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .or(`email.ilike.${rawInput}@%,email.ilike.${rawInput}`)
            .limit(1)
            .maybeSingle();

          if (profile?.email) {
            targetEmail = profile.email;
          } else {
            // Default domain fallback
            targetEmail = `${rawInput}@mbsdesign.com`;
          }
        }
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });

      if (authError) {
        // If first attempt with domain failed, try @test.com fallback
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

        setError(authError.message === "Invalid login credentials"
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
        <h2 className="text-3xl font-extrabold text-white tracking-tight">{BRAND_CONFIG.companyName}</h2>
        <p className="mt-2 text-sm text-slate-400">{BRAND_CONFIG.tagline}</p>
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
                Username
              </label>
              <div className="mt-1.5 relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="e.g. admin"
                  autoComplete="username"
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
                  autoComplete="current-password"
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

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5 text-amber-500/70" />
              <span>Authorized Personnel Only &bull; Managed by MBS Studio</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}