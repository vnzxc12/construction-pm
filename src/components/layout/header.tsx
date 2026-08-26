"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Bell, Search, PlusCircle, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Project } from "@/types/database";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>({
    name: "Admin",
    email: "vonn@test.com",
    role: "admin",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("full_name, email, role, avatar_url")
            .eq("id", user.id)
            .single();

          if (dbProfile) {
            setProfile({
              name: dbProfile.full_name || user.email?.split("@")[0] || "Admin",
              email: dbProfile.email || user.email || "",
              role: dbProfile.role || "admin",
              avatarUrl: dbProfile.avatar_url,
            });
          } else {
            const metaName = user.user_metadata?.full_name;
            setProfile({
              name: metaName || user.email?.split("@")[0] || "Admin",
              email: user.email || "",
              role: (user.user_metadata?.role as string) || "admin",
            });
          }
        }
      } catch (err) {
        console.warn("Could not load user profile:", err);
      }

      try {
        const { data: projectList } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (projectList && projectList.length > 0) {
          setProjects(projectList);
          const matched = projectList.find((p) => pathname.includes(p.id));
          setSelectedProjectId(matched ? matched.id : projectList[0].id);
        }
      } catch (err) {
        console.warn("Could not load projects list:", err);
      }
    }

    loadData();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const user = session.user;
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("full_name, email, role, avatar_url")
          .eq("id", user.id)
          .single();

        setProfile({
          name: dbProfile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin",
          email: dbProfile?.email || user.email || "",
          role: dbProfile?.role || (user.user_metadata?.role as string) || "admin",
          avatarUrl: dbProfile?.avatar_url,
        });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch {
      router.push("/login");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
      {/* Project Switcher & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full max-w-xs">
          <label htmlFor="project-selector" className="sr-only">Select Project</label>
          <select
            id="project-selector"
            aria-label="Select active project"
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-3 pr-8 text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer transition-colors"
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val);
              if (val) {
                router.push(`/dashboard/projects/${val}/overview`);
              } else {
                router.push(`/dashboard/projects`);
              }
            }}
          >
            {projects.length === 0 ? (
              <option value="">No projects in database</option>
            ) : (
              projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} — {p.name.length > 25 ? p.name.substring(0, 25) + "..." : p.name}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="relative flex-1 hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search active site records..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>
      </div>

      {/* Actions & User Info */}
      <div className="flex items-center gap-3">
        {selectedProjectId && (
          <Link
            href={`/dashboard/projects/${selectedProjectId}/daily-logs`}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Daily Log</span>
          </Link>
        )}

        {/* Dark Mode Toggle */}
        <ThemeToggle />

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-8 h-8 rounded-full object-cover ring-1 border dark:border-slate-700"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm">
              {getInitials(profile.name)}
            </div>
          )}
          <div className="hidden lg:block text-left">
            <span className="block text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              {profile.name}
            </span>
            <span className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
              {profile.role?.replace("_", " ")}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors ml-1 cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}