"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Building,
  Lock,
  User,
  AtSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Key,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, UserRole } from "@/types/database";
import { BRAND_CONFIG } from "@/lib/brand.config";

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New User Form State
  const [newUsername, setNewUsername] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("project_manager");
  const [newCompany, setNewCompany] = useState(BRAND_CONFIG.companyName);
  const [newPassword, setNewPassword] = useState("MBS@2026");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchUsersAndProfile = async () => {
    setLoading(true);
    const supabase = createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (myProfile) {
        setCurrentUser(myProfile);
      } else {
        // Current account was deleted from profiles - sign out immediately
        console.warn("Current user profile not found. Signing out.");
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }
    }

    // 2. Get All Users
    const { data: usersList } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (usersList) {
      setAllUsers(usersList);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUsersAndProfile();
  }, []);

  const canManageUsers = currentUser?.role === "admin" || currentUser?.role === "project_manager";

  const handleDeleteUser = async (userToDelete: Profile) => {
    if (userToDelete.role === "admin" || userToDelete.id === currentUser?.id) {
      alert("Administrator and self accounts cannot be deleted.");
      return;
    }

    const usernameDisplay = userToDelete.email ? userToDelete.email.split("@")[0] : "user";
    if (!confirm(`Are you sure you want to permanently delete account "${userToDelete.full_name}" (@${usernameDisplay})?\n\nThis will immediately revoke their access and deactivate their login credentials.`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userToDelete.id);

      if (error) {
        setFeedback({ type: "error", message: `Failed to delete account: ${error.message}` });
        return;
      }

      setAllUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setFeedback({
        type: "success",
        message: `Account for "${userToDelete.full_name}" (@${usernameDisplay}) has been permanently deleted and access revoked.`,
      });
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to delete account." });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    setCreating(true);
    setFeedback(null);

    try {
      const supabase = createClient();
      const cleanUsername = newUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
      const generatedEmail = `${cleanUsername}@mbsdesign.com`;

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: generatedEmail,
        password: newPassword,
        options: {
          data: {
            full_name: newFullName || cleanUsername,
            role: newRole,
            company_name: newCompany,
          },
        },
      });

      if (signupError) {
        setFeedback({ type: "error", message: signupError.message });
        setCreating(false);
        return;
      }

      // Also ensure profile row is created
      if (signupData.user) {
        await supabase.from("profiles").upsert({
          id: signupData.user.id,
          email: generatedEmail,
          full_name: newFullName || cleanUsername,
          role: newRole,
          company_name: newCompany,
        });
      }

      setFeedback({
        type: "success",
        message: `Account created successfully for ${newFullName || cleanUsername}! Username: ${cleanUsername}`,
      });

      setShowAddUserModal(false);
      setNewUsername("");
      setNewFullName("");
      setNewPassword("MBS@2026");

      // Refresh list
      fetchUsersAndProfile();
    } catch (err: any) {
      setFeedback({ type: "error", message: err?.message || "Failed to create user." });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          System Settings & User Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Authorized Admin and Project Manager controls for {BRAND_CONFIG.companyName}.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* User Management Section (Admin & PM only) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Authorized User Accounts ({allUsers.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Only Admin & Project Managers can generate new user credentials.
              </p>
            </div>
          </div>

          {canManageUsers && (
            <button
              type="button"
              onClick={() => setShowAddUserModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New User Account</span>
            </button>
          )}
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs">Loading User Directory...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Member / User</th>
                  <th className="px-4 py-3">Login Username</th>
                  <th className="px-4 py-3">Assigned Role</th>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3 text-right">Access</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {allUsers.map((u) => {
                  const usernameDisplay = u.email ? u.email.split("@")[0] : "user";
                  const isAdmin = u.role === "admin";
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isAdmin ? "bg-amber-500 text-slate-950" : "bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white"}`}>
                            {u.full_name?.substring(0, 2).toUpperCase() || "US"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">{u.full_name}</span>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono font-bold text-amber-600 dark:text-amber-400">
                        {usernameDisplay}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize ${
                          isAdmin
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30"
                            : u.role === "project_manager"
                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-500/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}>
                          {u.role?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {u.company_name || BRAND_CONFIG.companyName}
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {canManageUsers && !isAdmin && !isSelf ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title={`Permanently delete @${usernameDisplay}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            {isAdmin ? "Admin" : isSelf ? "Current" : "Protected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create User Account</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Grant system credentials for {BRAND_CONFIG.companyName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddUserModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Login Username (No Spaces)
                </label>
                <div className="mt-1 relative">
                  <AtSign className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. marco_architect or mang_jose"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="mt-1 relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Architect Marco Santos"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="project_manager">Project Manager</option>
                    <option value="superintendent">Site Supervisor</option>
                    <option value="subcontractor">Subcontractor / Trade</option>
                    <option value="client">Client / Property Owner</option>
                    <option value="safety_officer">QA/QC Safety Inspector</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Initial Password
                  </label>
                  <div className="mt-1 relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="MBS@2026"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Organization / Trade Company
                </label>
                <div className="mt-1 relative">
                  <Building className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Apex Carpentry or MBS Studio"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create User</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}