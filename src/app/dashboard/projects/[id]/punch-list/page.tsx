"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Plus,
  Search,
  MapPin,
  CheckCircle2,
  Clock,
  Loader2,
  X,
  Camera,
  Image as ImageIcon,
  Eye,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PunchItem, PunchStatus, PunchSeverity, Project } from "@/types/database";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/utils";
import { getSignedFileUrl, batchGetSignedUrls } from "@/lib/storage";

export default function PunchListPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [punchItems, setPunchItems] = useState<PunchItem[]>([]);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [openingPhotoId, setOpeningPhotoId] = useState<string | null>(null);

  // New Punch Item Form
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [trade, setTrade] = useState("Drywall / Finishes");
  const [severity, setSeverity] = useState<PunchSeverity>("minor");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const fetchPunchItems = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, punchRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("punch_items").select("*").eq("project_id", params.id).order("item_number", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    
    if (punchRes.data) {
      const items = punchRes.data as PunchItem[];
      setPunchItems(items);

      // Collect all photo paths for batch signed URLs (3600s thumbnail preview)
      const allPhotos = items.flatMap((i) => i.photo_urls || []).filter(Boolean);
      if (allPhotos.length > 0) {
        const signedMap = await batchGetSignedUrls(supabase, "punch-photos", allPhotos, 3600);
        setSignedPhotoUrls(signedMap);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPunchItems();
  }, [params.id]);

  const handleResolveItem = async (id: string) => {
    setPunchItems(
      punchItems.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "approved" as PunchStatus,
              resolved_at: new Date().toISOString(),
              resolution_notes: "Field verified and signed off.",
            }
          : item
      )
    );

    const supabase = createClient();
    await supabase
      .from("punch_items")
      .update({
        status: "approved",
        resolved_at: new Date().toISOString(),
        resolution_notes: "Field verified and signed off.",
      })
      .eq("id", id);
  };

  const handleViewPhoto = async (photoPath: string, itemId: string) => {
    setOpeningPhotoId(itemId);
    try {
      const supabase = createClient();
      // On-demand signed URL generation (300s)
      const signed = await getSignedFileUrl(supabase, "punch-photos", photoPath, 300);
      if (signed) {
        window.open(signed, "_blank", "noopener,noreferrer");
      } else {
        alert("Unable to open photo preview. Check your Supabase storage permissions.");
      }
    } catch (err: any) {
      alert(`Error viewing photo: ${err?.message}`);
    } finally {
      setOpeningPhotoId(null);
    }
  };

  const handleCreatePunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setSaving(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const uploadedPhotoPaths: string[] = [];

      // If a defect photo is attached, upload to private 'punch-photos' bucket
      if (selectedPhoto) {
        const sanitizedName = selectedPhoto.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = `${params.id}/punch_${Date.now()}_${sanitizedName}`;

        const { error: uploadError } = await supabase.storage
          .from("punch-photos")
          .upload(filePath, selectedPhoto, { upsert: true });

        if (uploadError) {
          console.error("Punch photo upload error:", uploadError);
          alert(`Warning: Photo upload failed (${uploadError.message}). Saving punch item without photo.`);
        } else {
          uploadedPhotoPaths.push(filePath);
          // Generate 3600s signed URL for preview
          const signed = await getSignedFileUrl(supabase, "punch-photos", filePath, 3600);
          if (signed) {
            setSignedPhotoUrls((prev) => ({ ...prev, [filePath]: signed }));
          }
        }
      }

      const newPunchPayload = {
        project_id: params.id,
        item_number: punchItems.length + 101,
        title,
        description,
        location: location || "General Site Area",
        status: "open" as PunchStatus,
        severity,
        trade,
        reported_by: user?.id,
        photo_urls: uploadedPhotoPaths,
      };

      const { data, error } = await supabase
        .from("punch_items")
        .insert(newPunchPayload)
        .select()
        .single();

      if (data) {
        setPunchItems([data, ...punchItems]);
        setShowModal(false);
        setTitle("");
        setLocation("");
        setDescription("");
        setSelectedPhoto(null);
      } else if (error) {
        alert(`Error saving punch item: ${error.message}`);
      }
    } catch (err: any) {
      alert(`Error saving punch item: ${err?.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = punchItems.filter((item) => {
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesSearch =
      item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.location?.toLowerCase().includes(search.toLowerCase()) ||
      (item.trade && item.trade.toLowerCase().includes(search.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
              {project?.code || "PRJ"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Punch List & Quality Inspections
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pinpoint site deficiencies and attach photos backed by private Supabase storage.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Punch Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by defect or room location..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {["all", "open", "approved"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filterStatus === st
                  ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Punch Items List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Punch List & Photos...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Zero Open Punch Items</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Site quality inspection is clean! Click below if you need to log an issue.
          </p>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log First Punch Item</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map((item) => {
            const hasPhotos = item.photo_urls && item.photo_urls.length > 0;
            const firstPhotoPath = hasPhotos ? item.photo_urls[0] : null;
            const photoPreview = firstPhotoPath ? signedPhotoUrls[firstPhotoPath] : null;
            const isOpeningPhoto = openingPhotoId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between space-y-4 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded">
                        #{item.item_number}
                      </span>
                      <PriorityBadge priority={item.severity} />
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.trade}</span>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base mt-2.5">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-medium mt-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{item.location}</span>
                  </div>

                  {item.description && (
                    <p className="text-xs text-slate-700 dark:text-slate-200 mt-2 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200/70 dark:border-slate-700 leading-relaxed font-medium">
                      {item.description}
                    </p>
                  )}

                  {/* Attached Defect Photo Thumbnail */}
                  {firstPhotoPath && (
                    <div className="mt-3 flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Defect"
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 flex items-center justify-center flex-shrink-0 font-bold text-xs">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                          Defect Inspection Photo
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          Private storage (`punch-photos`)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewPhoto(firstPhotoPath, item.id)}
                        disabled={isOpeningPhoto}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-medium rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer disabled:opacity-60"
                      >
                        {isOpeningPhoto ? (
                          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                        ) : (
                          <Eye className="w-3 h-3 text-amber-400" />
                        )}
                        <span>View</span>
                      </button>
                    </div>
                  )}

                  {item.resolution_notes && (
                    <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-800 dark:text-emerald-300">
                      <span className="font-bold block">Resolution:</span>
                      <span>{item.resolution_notes}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400 dark:text-slate-500 font-mono">
                    {formatDate(item.created_at)}
                  </span>

                  {item.status !== "approved" ? (
                    <button
                      type="button"
                      onClick={() => handleResolveItem(item.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verify & Sign Off</span>
                    </button>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Signed Off
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Punch Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Punch Item</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add defect or inspection item for {project?.name || "Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePunch} className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Issue Title / Defect Summary
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scuffed drywall and missing cover plate"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Site Location / Room
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Level 14 - Room 1402"
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as PunchSeverity)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="cosmetic" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Cosmetic</option>
                    <option value="minor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Minor</option>
                    <option value="major" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Major</option>
                    <option value="critical_safety" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Critical Safety</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Responsible Trade
                </label>
                <input
                  type="text"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Defect Description & Correction Required
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Specific instructions for remediation..."
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Defect Photo Attachment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Attach Defect Photo (Optional)
                </label>
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-colors ${
                    selectedPhoto
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10"
                      : "border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60"
                  }`}
                >
                  {selectedPhoto ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <Camera className="w-4 h-4 text-amber-500" />
                        <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                          {selectedPhoto.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPhoto(null);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Camera className="w-4 h-4 text-slate-400" />
                      <span>Click to upload defect photo (saved to private bucket)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Securing...</span>
                    </>
                  ) : (
                    <span>Save Punch Item</span>
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