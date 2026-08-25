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
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DrawingDocument, DocCategory, Project } from "@/types/database";
import { formatFileSize, formatDate } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

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
    if (docsRes.data) setDocuments(docsRes.data);
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

      // Clean file path in storage bucket
      const sanitizedName = selectedFile.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `${params.id}/${Date.now()}_${sanitizedName}`;

      // 1. Real Upload to Supabase Storage bucket 'blueprints'
      const { data: storageData, error: storageError } = await supabase.storage
        .from("blueprints")
        .upload(storagePath, selectedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (storageError) {
        console.error("Supabase Storage error:", storageError);
        alert(`Storage Error: ${storageError.message}`);
        setUploading(false);
        return;
      }

      // 2. Get Public Download / Preview URL
      const { data: { publicUrl } } = supabase.storage
        .from("blueprints")
        .getPublicUrl(storagePath);

      // 3. Insert record into drawings_documents table
      const newDocPayload = {
        project_id: params.id,
        title: docTitle,
        sheet_number: sheetNumber || "PLAN-01",
        category: docCategory,
        version: 1,
        file_url: publicUrl,
        file_size_bytes: selectedFile.size,
        storage_path: storagePath,
        description: `Uploaded ${selectedFile.name} to Supabase Storage.`,
        uploaded_by: user?.id || null,
      };

      const { data: insertedDoc, error: insertError } = await supabase
        .from("drawings_documents")
        .insert(newDocPayload)
        .select()
        .single();

      if (insertedDoc) {
        setDocuments([insertedDoc, ...documents]);
        setShowUploadModal(false);
        setDocTitle("");
        setSheetNumber("A-101");
        setSelectedFile(null);
      } else if (insertError) {
        alert(`Database Error: ${insertError.message}`);
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
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project?.code || "MBS"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Drawings, Plans & Blueprints Storage
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload and view PDF, JPEG, and PNG construction plans backed by Supabase Storage.
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plans (e.g. Kitchen Layout, A-101)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
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
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Storage Information Banner */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white block">Supabase Storage Bucket: `blueprints`</span>
            <span className="text-slate-400">Direct cloud upload for PDF, PNG, JPEG &bull; CDN fast delivery</span>
          </div>
        </div>
        <span className="text-emerald-400 font-semibold hidden sm:inline-block">
          Active
        </span>
      </div>

      {/* Document Cards Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          <span className="text-sm font-medium">Loading Plans from Supabase Storage...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto">
          <FileSpreadsheet className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900">No Plans Uploaded Yet</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
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
            const isImage = doc.file_url?.match(/\.(jpeg|jpg|png|webp|gif)/i);
            return (
              <div
                key={doc.id}
                className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isImage ? (
                      <img
                        src={doc.file_url}
                        alt={doc.title}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200 font-bold text-xs">
                        PDF
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                          {doc.sheet_number}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                          Rev {doc.version}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">
                        {doc.title}
                      </h3>
                      <span className="text-[11px] text-slate-500 block mt-0.5 capitalize">
                        Category: {doc.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(doc.created_at)} &bull; {formatFileSize(doc.file_size_bytes)}
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open Plan</span>
                    </a>
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
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Upload Plan / Drawing</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct upload to Supabase Storage for {project?.name || "Project"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-4">
              {/* File Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                      ? "border-amber-500 bg-amber-50/50"
                      : "border-slate-300 hover:border-amber-500 bg-slate-50"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col items-center">
                      <File className="w-8 h-8 text-amber-600 mb-2" />
                      <span className="text-xs font-bold text-slate-900">{selectedFile.name}</span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {formatFileSize(selectedFile.size)} &bull; Ready to upload
                      </span>
                      <span className="text-[11px] text-amber-700 font-semibold mt-2 underline">
                        Click to choose a different file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <Upload className="w-8 h-8 text-slate-400 mb-2" />
                      <span className="text-xs font-bold text-slate-800">
                        Click here to browse your computer or phone
                      </span>
                      <span className="text-[11px] text-slate-500 mt-1">
                        Supports PDF plans, blueprints, JPEG photos, PNG drawings up to 100MB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Plan / Drawing Title
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Kitchen Cabinetry & Electrical Layout"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Sheet / Plan Code
                  </label>
                  <input
                    type="text"
                    required
                    value={sheetNumber}
                    onChange={(e) => setSheetNumber(e.target.value)}
                    placeholder="e.g. A-101"
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Category
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value as DocCategory)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="architectural">Architectural Plan</option>
                    <option value="structural">Structural Drawing</option>
                    <option value="mep">MEP / Electrical / Plumbing</option>
                    <option value="permits">Permits & Approvals</option>
                    <option value="contracts">Specifications & Scope</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
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
                      <span>Uploading to Supabase...</span>
                    </>
                  ) : (
                    <span>Upload & Save Plan</span>
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