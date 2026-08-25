"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import { MOCK_PROJECTS, MOCK_DRAWINGS } from "@/lib/mock-data";
import { DrawingDocument, DocCategory } from "@/types/database";
import { formatFileSize, formatDate } from "@/lib/utils";

const CATEGORIES: { id: string; label: string }[] = [
  { id: "all", label: "All Documents" },
  { id: "architectural", label: "Architectural (A)" },
  { id: "structural", label: "Structural (S)" },
  { id: "mep", label: "MEP / Mechanical (M)" },
  { id: "permits", label: "Permits & Legal" },
];

export default function DrawingsPage({ params }: { params: { id: string } }) {
  const project = MOCK_PROJECTS.find((p) => p.id === params.id) || MOCK_PROJECTS[0];
  const [documents, setDocuments] = useState<DrawingDocument[]>(MOCK_DRAWINGS);
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [docTitle, setDocTitle] = useState("");
  const [sheetNumber, setSheetNumber] = useState("");
  const [docCategory, setDocCategory] = useState<DocCategory>("architectural");

  const filteredDocs = documents.filter((doc) => {
    const matchesCat = category === "all" || doc.category === category;
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      (doc.sheet_number && doc.sheet_number.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle) return;
    setUploading(true);

    setTimeout(() => {
      const newDoc: DrawingDocument = {
        id: `doc-${Date.now()}`,
        project_id: project.id,
        title: docTitle,
        sheet_number: sheetNumber || "A-999",
        category: docCategory,
        version: 1,
        file_url: "https://example.com/mock-blueprint.pdf",
        file_size_bytes: 12500000,
        storage_path: `blueprints/${project.id}/${docTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        description: "Uploaded drawing revision to Supabase Storage bucket.",
        created_at: new Date().toISOString(),
      };

      setDocuments([newDoc, ...documents]);
      setUploading(false);
      setShowUploadModal(false);
      setDocTitle("");
      setSheetNumber("");
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
              {project.code}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Drawings, Blueprints & Document Storage
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Official stamped revisions backed by Supabase Storage bucket (`blueprints`).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Blueprint / Spec</span>
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
            placeholder="Search sheets (e.g. A-118, S-204)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
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
            <span className="text-slate-400">Direct multipart upload &bull; Fast global CDN distribution</span>
          </div>
        </div>
        <span className="text-emerald-400 font-semibold hidden sm:inline-block">
          RLS Policy: Authenticated Read/Write Active
        </span>
      </div>

      {/* Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
                  <FileText className="w-5 h-5" />
                </div>
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
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {doc.description}
                  </p>
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
                  rel="noreferrer"
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>
                <a
                  href={doc.file_url}
                  download
                  className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-amber-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Blueprint Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Upload Drawing Set</h2>
            <p className="text-xs text-slate-500 mt-1">
              File will be uploaded to Supabase Storage bucket for {project.name}
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 mt-5">
              {/* Drag and Drop Zone */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-amber-500 transition-colors bg-slate-50 cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-700 block">Click to select or drag PDF / DWG here</span>
                <span className="text-[11px] text-slate-400 block mt-1">Supports PDF, DWG, DXF, PNG up to 100MB</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Drawing Title
                </label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Electrical Power Plan Level 19"
                  className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    Sheet Number
                  </label>
                  <input
                    type="text"
                    required
                    value={sheetNumber}
                    onChange={(e) => setSheetNumber(e.target.value)}
                    placeholder="e.g. E-201"
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
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="architectural">Architectural</option>
                    <option value="structural">Structural</option>
                    <option value="mep">MEP / HVAC</option>
                    <option value="permits">Permits</option>
                    <option value="contracts">Contracts</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow-sm flex items-center gap-2"
                >
                  {uploading ? "Uploading to Supabase..." : "Upload Blueprint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}