"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, PlusCircle, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Project } from "@/types/database";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Sidebar } from "@/components/layout/sidebar";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    name: "Admin",
    email: "vonn@test.com",
    role: "admin",
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  useEffect(() => {
    // Close mobile drawer on route change
    setMobileNavOpen(false);
  }, [pathname]);

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
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-colors">
        {/* Left: Mobile Hamburger & Project Switcher */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1 max-w-xl">
          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label="Open mobile navigation menu"
            className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="relative w-full max-w-[200px] sm:max-w-xs">
            <label htmlFor="project-selector" className="sr-only">Select Project</label>
            <select
              id="project-selector"
              aria-label="Select active project"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 pl-2 sm:pl-3 pr-7 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer transition-colors truncate"
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
                <option value="">No projects</option>
              ) : (
                projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name.length > 20 ? p.name.substring(0, 20) + "..." : p.name}
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
        <div className="flex items-center gap-1.5 sm:gap-3">
          {selectedProjectId && (
            <Link
              href={`/dashboard/projects/${selectedProjectId}/daily-logs`}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-xs shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Daily Log</span>
            </Link>
          )}

          {/* Dark Mode Toggle */}
          <ThemeToggle />

          <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-1 border dark:border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
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
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10">
            <Sidebar
              className="flex w-full h-full border-r-0"
              onClose={() => setMobileNavOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}