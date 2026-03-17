"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import {
  FileText,
  FileImage,
  File as FileIcon,
  Upload,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Plus,
  FolderOpen,
  Scale,
  MessageSquareWarning,
  Car,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Document } from "./page"
import {
  uploadDocument,
  deleteDocument,
  toggleDocumentVisibility,
} from "@/app/actions/documents"

/* ── Constants ──────────────────────────────────────────────── */

const CATEGORIES = [
  { value: "all", label: "All Documents" },
  { value: "rules_and_regulations", label: "Rules & Regulations" },
  { value: "meeting_minutes", label: "Meeting Minutes" },
  { value: "forms", label: "Forms" },
  { value: "budgets", label: "Budgets" },
  { value: "insurance", label: "Insurance" },
  { value: "other", label: "Other" },
] as const

const CATEGORY_LABELS: Record<string, string> = {
  rules_and_regulations: "Rules & Regulations",
  meeting_minutes: "Meeting Minutes",
  forms: "Forms",
  budgets: "Budgets",
  insurance: "Insurance",
  other: "Other",
}

const CATEGORY_COLORS: Record<string, string> = {
  rules_and_regulations: "bg-blue-100 text-blue-800",
  meeting_minutes: "bg-purple-100 text-purple-800",
  forms: "bg-green-100 text-green-800",
  budgets: "bg-yellow-100 text-yellow-800",
  insurance: "bg-orange-100 text-orange-800",
  other: "bg-gray-100 text-gray-800",
}

const ACCEPT_TYPES =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"

/* ── Pre-built forms ─────────────────────────────────────── */

const PREBUILT_FORMS = [
  {
    id: "arc-request",
    title: "ARC Request Form",
    description: "Architectural Review Committee request for exterior modifications",
    icon: Scale,
    filename: "ARC_Request_Form.pdf",
  },
  {
    id: "complaint",
    title: "Complaint Form",
    description: "Submit a formal complaint about a community issue",
    icon: MessageSquareWarning,
    filename: "Complaint_Form.pdf",
  },
  {
    id: "parking-variance",
    title: "Parking Variance Request",
    description: "Request an exception to community parking rules",
    icon: Car,
    filename: "Parking_Variance_Request.pdf",
  },
]

/* ── Helpers ─────────────────────────────────────────────── */

function getFileIcon(fileName: string | null) {
  if (!fileName) return FileIcon
  const ext = fileName.split(".").pop()?.toLowerCase()
  if (ext === "pdf") return FileText
  if (["doc", "docx"].includes(ext || "")) return FileText
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext || ""))
    return FileImage
  return FileIcon
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return "—"
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/* ── Upload Modal ────────────────────────────────────────── */

function UploadModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("other")
  const [isPublic, setIsPublic] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) {
      setFile(dropped)
      if (!title) setTitle(dropped.name.replace(/\.[^.]+$/, ""))
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      if (!title) setTitle(selected.name.replace(/\.[^.]+$/, ""))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return

    const formData = new FormData()
    formData.set("file", file)
    formData.set("title", title)
    formData.set("category", category)
    formData.set("is_public", String(isPublic))

    startTransition(async () => {
      const result = await uploadDocument(formData)
      if (result.error) {
        alert(result.error)
      } else {
        onClose()
      }
    })
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Add a new document to the library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
              dragging
                ? "border-blue-400 bg-blue-50"
                : file
                ? "border-green-300 bg-green-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload
              className={`h-8 w-8 ${
                file ? "text-green-500" : "text-gray-400"
              }`}
            />
            {file ? (
              <div className="text-center">
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOC, DOCX, or images
                </p>
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_TYPES}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            >
              {CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Visibility</label>
            <div className="mt-2 flex gap-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={isPublic}
                  onChange={() => setIsPublic(true)}
                />
                <Eye className="h-4 w-4 text-green-600" />
                Public
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="visibility"
                  checked={!isPublic}
                  onChange={() => setIsPublic(false)}
                />
                <EyeOff className="h-4 w-4 text-yellow-600" />
                Board Only
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || !file}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {pending ? "Uploading..." : "Upload Document"}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* ── Main View ───────────────────────────────────────────── */

export function DocumentsView({
  documents,
  isBoardOrAdmin,
  isAdmin,
}: {
  documents: Document[]
  isBoardOrAdmin: boolean
  isAdmin: boolean
}) {
  const [activeCategory, setActiveCategory] = useState("all")
  const [showUpload, setShowUpload] = useState(false)
  const [pending, startTransition] = useTransition()

  const filtered =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.category === activeCategory)

  function handleDelete(doc: Document) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteDocument(doc.id)
      if (result.error) alert(result.error)
    })
  }

  function handleToggleVisibility(doc: Document) {
    startTransition(async () => {
      const result = await toggleDocumentVisibility(doc.id, !doc.is_public)
      if (result.error) alert(result.error)
    })
  }

  // Count documents by category for badges
  const counts: Record<string, number> = { all: documents.length }
  for (const d of documents) {
    const cat = d.category || "other"
    counts[cat] = (counts[cat] || 0) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Document Library</h1>
        {isBoardOrAdmin && (
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Upload Document
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Category sidebar */}
        <div className="space-y-1">
          {CATEGORIES.map((cat) => {
            const count = counts[cat.value] || 0
            const isActive = activeCategory === cat.value
            return (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-50 font-medium text-blue-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  {cat.label}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Document list */}
        <div className="space-y-6">
          {/* Pre-built forms section when Forms category is active or All */}
          {(activeCategory === "all" || activeCategory === "forms") && (
            <div>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Downloadable Forms
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {PREBUILT_FORMS.map((form) => {
                  const Icon = form.icon
                  return (
                    <a
                      key={form.id}
                      href={`/forms/${form.filename}`}
                      download
                      className="flex items-start gap-3 rounded-xl border bg-white p-4 shadow-sm transition-colors hover:bg-gray-50"
                    >
                      <div className="rounded-lg bg-green-50 p-2 text-green-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{form.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {form.description}
                        </p>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          )}

          {/* Uploaded documents */}
          <div>
            {(activeCategory === "all" || activeCategory === "forms") && (
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Uploaded Documents
              </h2>
            )}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-muted-foreground">
                <FileText className="mb-2 h-10 w-10" />
                <p className="text-sm">No documents in this category.</p>
                {isBoardOrAdmin && (
                  <button
                    onClick={() => setShowUpload(true)}
                    className="mt-2 text-sm text-blue-600 hover:underline"
                  >
                    Upload one now
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Uploaded</th>
                      <th className="px-4 py-3">Size</th>
                      {isBoardOrAdmin && (
                        <th className="px-4 py-3">Visibility</th>
                      )}
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((doc) => {
                      const Icon = getFileIcon(doc.file_name)
                      const catColor =
                        CATEGORY_COLORS[doc.category || "other"] ||
                        CATEGORY_COLORS.other
                      const catLabel =
                        CATEGORY_LABELS[doc.category || "other"] || "Other"

                      return (
                        <tr key={doc.id} className="border-b">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5 shrink-0 text-gray-400" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {doc.title}
                                </p>
                                {doc.file_name && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {doc.file_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${catColor}`}
                            >
                              {catLabel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatDate(doc.created_at)}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatFileSize(doc.file_size)}
                          </td>
                          {isBoardOrAdmin && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleToggleVisibility(doc)}
                                disabled={pending}
                                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                  doc.is_public
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                                title={
                                  doc.is_public
                                    ? "Click to make Board Only"
                                    : "Click to make Public"
                                }
                              >
                                {doc.is_public ? (
                                  <>
                                    <Eye className="h-3 w-3" /> Public
                                  </>
                                ) : (
                                  <>
                                    <EyeOff className="h-3 w-3" /> Board Only
                                  </>
                                )}
                              </button>
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <a
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="rounded p-1 hover:bg-gray-100"
                                title="Download"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDelete(doc)}
                                  disabled={pending}
                                  className="rounded p-1 text-red-500 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  )
}
