"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Search,
  Download,
  Eye,
  FileText,
  Clock,
  HardDrive,
  Loader2,
  Plus,
  CheckCircle2,
  File,
  X,
  Trash2,
  AlertTriangle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DrawingDocument, DocCategory, Project } from "@/types/database";
import { formatFileSize, formatDate } from "@/lib/utils";
import { getSignedFileUrl, batchGetSignedUrls } from "@/lib/storage";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Plans & Specs" },
  { id: "architectural", label: "Architectural (A)" },
  { id: "structural", label: "Structural (S)" },
  { id: "mep", label: "MEP / Electrical (M)" },
  { id: "permits", label: "Permits & Contracts" },
];

export default function DrawingsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DrawingDocument[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [sheetNumber, setSheetNumber] = useState("A-101");
  const [docCategory, setDocCategory] = useState<DocCategory>("architectural");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    setLoading(true);
    const supabase = createClient();

    const [projRes, docsRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", params.id).single(),
      supabase.from("drawings_documents").select("*").eq("project_id", params.id).order("created_at", { ascending: false }),
    ]);

    if (projRes.data) setProject(projRes.data);
    
    if (docsRes.data) {
      const docs = docsRes.data as DrawingDocument[];
      setDocuments(docs);

      // Generate 3600-second signed thumbnail URLs for images in private bucket
      const imageDocs = docs.filter((d) => 
        (d.storage_path && d.storage_path.match(/\.(jpeg|jpg|png|webp|gif)/i)) ||
        (d.file_url && d.file_url.match(/\.(jpeg|jpg|png|webp|gif)/i))
      );

      if (imageDocs.length > 0) {
        const pathsToSign = imageDocs.map((d) => d.storage_path || d.file_url);
        const signedMap = await batchGetSignedUrls(supabase, "blueprints", pathsToSign, 3600);
        setPreviewUrls(signedMap);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [params.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!docTitle) {
        // Default title from file name without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        setDocTitle(nameWithoutExt);
      }
    }
  };

  const handleOpenPlan = async (doc: DrawingDocument) => {
    setOpeningDocId(doc.id);
    setActionError(null);

    try {
      const supabase = createClient();
      const targetPath = doc.storage_path || doc.file_url;
      
      // On-demand signed URL generation (300 seconds expiration)
      const signedUrl = await getSignedFileUrl(supabase, "blueprints", targetPath, 300);

      if (!signedUrl) {
        setActionError(`Failed to generate a secure preview link for "${doc.title}". Please verify your Supabase permissions.`);
        return;
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (err: any) {
      setActionError(`Error opening plan: ${err?.message || "Unknown error"}`);
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleDeleteDoc = async (doc: DrawingDocument) => {
    if (!confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      const supabase = createClient();
      if (doc.storage_path) {
        await supabase.storage.from("blueprints").remove([doc.storage_path]);
      }
      const { error } = await supabase
        .from("drawings_documents")
        .delete()
        .eq("id", doc.id);

      if (error) {
        alert(`Error deleting document: ${error.message}`);
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err: any) {
      alert(`Delete failed: ${err?.message || "Unknown error"}`);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) {
      alert("Please provide a plan title.");
      return;
    }
    if (!selectedFile) {
      alert("Please choose a PDF, JPEG, or PNG plan file to upload.");
      return;
    }

    setUploading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Clean file path in private storage bucket
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${params.id}/${Date.now()}_${sanitizedName}`;

      // 1. Upload to private Supabase Storage bucket 'blueprints'
      const { data: storageData, error: storageError } = await supabase.storage
        .from("blueprints")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (storageError) {
        console.error("Supabase Storage error:", storageError);
        if (
          storageError.message.includes("violates row-level security policy") ||
          storageError.message.includes("row-level security")
        ) {
          alert(
            `Storage RLS Error: Supabase Row-Level Security blocked this upload.\n\n` +
            `Fix: Please run the SQL script in 'supabase/storage_and_drawings_fix.sql' inside your Supabase SQL Editor to grant authenticated storage access.`
          );
        } else {
          alert(`Storage Error: ${storageError.message}`);
        }
        setUploading(false);
        return;
      }

      // 2. Generate initial signed URL (3600s) for display
      const { data: signedData } = await supabase.storage
        .from("blueprints")
        .createSignedUrl(storagePath, 3600);

      const previewUrl = signedData?.signedUrl || "";

      // 3. Insert record into drawings_documents table
      const newDocPayload = {
        project_id: params.id,
        title: docTitle,
        sheet_number: sheetNumber || "PLAN-01",
        category: docCategory,
        version: 1,
        file_url: previewUrl,
        file_size_bytes: selectedFile.size,
        storage_path: storagePath,
        description: `Uploaded ${selectedFile.name} to private blueprints bucket.`,
        uploaded_by: user?.id || null,
      };

      const { data: insertedDoc, error: insertError } = await supabase
        .from("drawings_documents")
        .insert(newDocPayload)
        .select()
        .single();

      if (insertedDoc) {
        setDocuments([insertedDoc, ...documents]);
        if (previewUrl) {
          setPreviewUrls((prev) => ({ ...prev, [storagePath]: previewUrl, [insertedDoc.id]: previewUrl }));
        }
        setShowUploadModal(false);
        setDocTitle("");
        setSheetNumber("A-101");
        setSelectedFile(null);
      } else if (insertError) {
        if (insertError.message.includes("violates row-level security policy")) {
          alert(
            `Database RLS Error on drawings_documents table.\n\n` +
            `Fix: Run 'supabase/storage_and_drawings_fix.sql' in your Supabase SQL Editor.`
          );
        } else {
          alert(`Database Error: ${insertError.message}`);
        }
      }
    } catch (err: any) {
      alert(`Upload failed: ${err?.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = category === "all" || doc.category === category;
    const matchesSearch =
      doc.title?.toLowerCase().includes(search.toLowerCase()) ||
      (doc.sheet_number && doc.sheet_number.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-500/30">
              {project?.code || "MBS"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Drawings, Plans & Blueprints Storage
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Secure private cloud vault for construction plans, CAD blueprints, and contract specs with signed URL access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Plan / Drawing</span>
        </button>
      </div>

      {/* Action Error Alert */}
      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-600 dark:text-rose-400 hover:underline font-semibold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans (e.g. Kitchen Layout, A-101)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                category === cat.id
                  ? "bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage Information Banner */}
      <div className="bg-slate-900 dark:bg-slate-900/90 text-slate-200 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block flex items-center gap-2">
              <span>Supabase Storage: `blueprints` (Private Bucket)</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono">
                Authenticated Signed URLs
              </span>
            </span>
            <span className="text-slate-400">
              Files protected by Row-Level Security &bull; Expiring tokens (300s on-demand &bull; 3600s previews)
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Encrypted Access</span>
        </div>
      </div>

      {/* Document Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Plans & Resolving Secure Signed URLs...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center max-w-lg mx-auto">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Plans Uploaded Yet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Upload your kitchen plans, CAD drawings, permits, or specifications.
          </p>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload First Plan</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const isImage = 
              (doc.storage_path && doc.storage_path.match(/\.(jpeg|jpg|png|webp|gif)/i)) ||
              (doc.file_url && doc.file_url.match(/\.(jpeg|jpg|png|webp|gif)/i));

            const resolvedPreview = previewUrls[doc.storage_path] || previewUrls[doc.id] || previewUrls[doc.file_url] || doc.file_url;
            const isOpening = openingDocId === doc.id;

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isImage ? (
                      <img
                        src={resolvedPreview}
                        alt={doc.title}
                        onError={(e) => {
                          // Fallback to placeholder on broken signed url
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=100&auto=format&fit=crop&q=60";
                        }}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center flex-shrink-0 border border-amber-200 dark:border-amber-500/30 font-bold text-xs">
                        PDF
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-900 dark:bg-slate-800 text-white px-2 py-0.5 rounded border border-slate-700">
                          {doc.sheet_number}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/30 uppercase">
                          Rev {doc.version}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1.5">
                        {doc.title}
                      </h3>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 capitalize">
                        Category: {doc.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    {formatDate(doc.created_at)} &bull; {formatFileSize(doc.file_size_bytes)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenPlan(doc)}
                      disabled={isOpening}
                      className="px-3 py-1.5 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700/80 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                      title="Generate authenticated temporary link (300s)"
                    >
                      {isOpening ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Open Plan</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc)}
                      title="Delete Plan"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Real Upload Blueprint Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Plan / Drawing</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Direct upload to private storage bucket for {project?.name || "Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Select File (PDF, JPEG, PNG, DWG)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.dwg,.doc,.docx"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                    selectedFile
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-500/10"
                      : "border-slate-300 dark:border-slate-700 hover:border-amber-500 bg-slate-50 dark:bg-slate-800/60"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <File className="w-8 h-8 text-amber-600 dark:text-amber-400 mb-2" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{selectedFile.name}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatFileSize(selectedFile.size)} &bull; Ready to upload
                      </span>
                      <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-2 underline">
                        Click to choose a different file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Click here to browse your computer or phone
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Supports PDF plans, blueprints, JPEG photos, PNG drawings up to 100MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Plan / Drawing Title
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Kitchen Cabinetry & Electrical Layout"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Sheet / Plan Code
                  </label>
                  <input
                    type="text"
                    required
                    value={sheetNumber}
                    onChange={(e) => setSheetNumber(e.target.value)}
                    placeholder="e.g. A-101"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocCategory)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="architectural" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Architectural Plan</option>
                    <option value="structural" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Structural Drawing</option>
                    <option value="mep" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">MEP / Electrical / Plumbing</option>
                    <option value="permits" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Permits & Approvals</option>
                    <option value="contracts" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Specifications & Scope</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 rounded-lg shadow-sm cursor-pointer flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading to Secure Vault...</span>
                    </>
                  ) : (
                    <span>Upload & Secure Plan</span>
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