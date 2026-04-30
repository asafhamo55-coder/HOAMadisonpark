"use client"

import { useState, useCallback, useRef, useEffect, useMemo } from "react"
import { format, addDays } from "date-fns"
import {
  Send,
  Save,
  Eye,
  Loader2,
  Mail,
  FileText,
  Braces,
  FlaskConical,
  Paperclip,
  X,
  Image as ImageIcon,
  File as FileIcon,
  PencilLine,
  Undo2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  sendLetter,
  saveDraft,
  renderTemplatePreview,
  sendTestEmail,
  uploadEmailAttachment,
  removeEmailAttachment,
  type AttachmentMeta,
} from "@/app/actions/email"

// ── Template configuration ───────────────────────────────────

const TEMPLATE_OPTIONS = [
  { value: "custom", label: "Custom Email", type: "custom" },
  { value: "violation-notice", label: "Violation Notice", type: "violation_notice" },
  { value: "warning-letter", label: "Warning Letter", type: "warning" },
  { value: "fine-notice", label: "Fine Notice", type: "fine" },
  { value: "welcome-letter", label: "Welcome Letter", type: "welcome" },
  { value: "general-announcement", label: "General Announcement", type: "announcement" },
  { value: "payment-reminder", label: "Payment Reminder", type: "payment_reminder" },
] as const

const TEMPLATE_SUBJECTS: Record<string, string> = {
  "violation-notice": "Violation Notice — Madison Park HOA",
  "warning-letter": "Warning: Unresolved Violation — Madison Park HOA",
  "fine-notice": "Fine Notice — Madison Park HOA",
  "welcome-letter": "Welcome to Madison Park!",
  "general-announcement": "Community Update — Madison Park HOA",
  "payment-reminder": "HOA Dues Reminder — Madison Park HOA",
}

const VARIABLES = [
  { key: "residentName", label: "Resident Name" },
  { key: "propertyAddress", label: "Property Address" },
  { key: "category", label: "Violation Category" },
  { key: "description", label: "Description" },
  { key: "reportedDate", label: "Reported Date" },
  { key: "dueDate", label: "Due Date" },
  { key: "violationId", label: "Violation ID" },
  { key: "fineAmount", label: "Fine Amount" },
  { key: "amountDue", label: "Amount Due" },
  { key: "period", label: "Payment Period" },
]

// ── Types ────────────────────────────────────────────────────

type ResidentInfo = {
  id: string
  full_name: string
  email: string | null
  property_id: string
}

type PropertyInfo = {
  id: string
  address: string
}

type ViolationInfo = {
  id: string
  property_id?: string
  category: string
  description: string
  severity: string
  reported_date: string | null
  due_date: string | null
  fine_amount: number | null
}

interface EmailComposerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultTo?: string
  defaultPropertyId?: string
  defaultResidentId?: string
  defaultViolationId?: string
  defaultTemplate?: string
  properties: PropertyInfo[]
  residents: ResidentInfo[]
  violations?: ViolationInfo[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isImageType(type: string): boolean {
  return type.startsWith("image/")
}

// ── Component ────────────────────────────────────────────────

export function EmailComposer({
  open,
  onOpenChange,
  defaultTo = "",
  defaultPropertyId = "",
  defaultResidentId = "",
  defaultViolationId,
  defaultTemplate = "custom",
  properties,
  residents,
  violations = [],
}: EmailComposerProps) {
  // Form state
  const [recipientEmail, setRecipientEmail] = useState(defaultTo)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate)
  const [propertyId, setPropertyId] = useState(defaultPropertyId)
  const [residentId, setResidentId] = useState(defaultResidentId)
  const [violationId, setViolationId] = useState(defaultViolationId || "")

  // Template editing state
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)
  const [templateHtmlOverride, setTemplateHtmlOverride] = useState("")

  // Attachments state
  const [attachments, setAttachments] = useState<AttachmentMeta[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview state
  const [previewHtml, setPreviewHtml] = useState("")
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Action state
  const [sending, setSending] = useState(false)
  const [savingDraft, setSavingDraft] = useState(false)
  const [sendingTest, setSendingTest] = useState(false)

  const bodyRef = useRef<HTMLTextAreaElement>(null)

  // Derived data
  const selectedProperty = properties.find((p) => p.id === propertyId)
  const propertyResidents = useMemo(
    () => residents.filter((r) => r.property_id === propertyId),
    [residents, propertyId]
  )
  const selectedResident = residents.find((r) => r.id === residentId)
  const selectedViolation = violations.find((v) => v.id === violationId)
  const propertyViolations = useMemo(
    () => violations.filter((v) => v.property_id === propertyId),
    [violations, propertyId]
  )

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRecipientEmail(defaultTo)
      setPropertyId(defaultPropertyId)
      setResidentId(defaultResidentId)
      setViolationId(defaultViolationId || "")
      setSelectedTemplate(defaultTemplate)
      setSubject("")
      setBody("")
      setPreviewHtml("")
      setIsEditingTemplate(false)
      setTemplateHtmlOverride("")
      setAttachments([])

      // Auto-fill recipient email from default resident
      if (defaultResidentId) {
        const res = residents.find((r) => r.id === defaultResidentId)
        if (res?.email && !defaultTo) setRecipientEmail(res.email)
      }
    }
  }, [open, defaultTo, defaultPropertyId, defaultResidentId, defaultViolationId, defaultTemplate, residents])

  // When property changes, update resident list
  function handlePropertyChange(id: string) {
    setPropertyId(id)
    setResidentId("")
    setViolationId("")
  }

  // When resident changes, auto-fill email
  function handleResidentChange(id: string) {
    setResidentId(id)
    const res = residents.find((r) => r.id === id)
    if (res?.email) setRecipientEmail(res.email)
  }

  // Build template props from current context
  function buildTemplateProps(): Record<string, string> {
    const today = format(new Date(), "MMMM d, yyyy")
    const due30 = format(addDays(new Date(), 30), "MMMM d, yyyy")

    return {
      residentName: selectedResident?.full_name || "Homeowner",
      propertyAddress: selectedProperty?.address || "",
      category: selectedViolation?.category || "",
      description: selectedViolation?.description || "",
      reportedDate: selectedViolation?.reported_date
        ? format(new Date(selectedViolation.reported_date), "MMMM d, yyyy")
        : today,
      dueDate: selectedViolation?.due_date
        ? format(new Date(selectedViolation.due_date), "MMMM d, yyyy")
        : due30,
      violationId: selectedViolation?.id?.slice(0, 8) || "",
      fineAmount: selectedViolation?.fine_amount
        ? `$${selectedViolation.fine_amount.toFixed(2)}`
        : "$150.00",
      fineDueDate: due30,
      amountDue: "$375.00",
      period: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
      originalNoticeDate: today,
      subject: subject || "Community Update",
      body: body || "",
      date: today,
    }
  }

  // When template changes, auto-fill subject and reset edit mode
  function handleTemplateChange(value: string) {
    setSelectedTemplate(value)
    setIsEditingTemplate(false)
    setTemplateHtmlOverride("")
    if (value !== "custom" && TEMPLATE_SUBJECTS[value]) {
      setSubject(TEMPLATE_SUBJECTS[value])
    }
    // Trigger preview refresh
    requestPreview(value)
  }

  // Enable template editing mode
  async function handleEditTemplate() {
    if (selectedTemplate === "custom") return

    // Render the template to HTML first
    const props = buildTemplateProps()
    const result = await renderTemplatePreview(selectedTemplate, props)
    if (result.html) {
      setTemplateHtmlOverride(result.html)
      setIsEditingTemplate(true)
    }
  }

  // Revert template edits
  function handleRevertTemplate() {
    setIsEditingTemplate(false)
    setTemplateHtmlOverride("")
    requestPreview()
  }

  // Debounced preview generation
  const requestPreview = useCallback(
    (templateOverride?: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)

      debounceRef.current = setTimeout(async () => {
        const tmpl = templateOverride ?? selectedTemplate

        if (tmpl === "custom") {
          // For custom, wrap body in minimal HTML
          setPreviewHtml(wrapCustomBody(body, subject))
          return
        }

        // If user is editing template HTML, use their version
        if (isEditingTemplate && templateHtmlOverride && !templateOverride) {
          setPreviewHtml(templateHtmlOverride)
          return
        }

        setPreviewLoading(true)
        const props = buildTemplateProps()
        const result = await renderTemplatePreview(tmpl, props)
        if (result.html) {
          setPreviewHtml(result.html)
        }
        setPreviewLoading(false)
      }, 500)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedTemplate, body, subject, propertyId, residentId, violationId, isEditingTemplate, templateHtmlOverride]
  )

  // Trigger preview on content changes
  useEffect(() => {
    if (open) requestPreview()
  }, [open, body, subject, selectedTemplate, propertyId, residentId, violationId, requestPreview])

  // Update preview when template HTML override changes
  useEffect(() => {
    if (isEditingTemplate && templateHtmlOverride) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setPreviewHtml(templateHtmlOverride)
      }, 500)
    }
  }, [isEditingTemplate, templateHtmlOverride])

  // Insert variable at cursor in body
  function insertVariable(key: string) {
    const ta = bodyRef.current
    if (!ta) {
      setBody((prev) => prev + `{{${key}}}`)
      return
    }
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const text = `{{${key}}}`
    const newBody = body.slice(0, start) + text + body.slice(end)
    setBody(newBody)
    // Restore cursor
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }

  // Replace {{variables}} with actual values in body
  function resolveVariables(text: string): string {
    const props = buildTemplateProps()
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => props[key] || `{{${key}}}`)
  }

  // Get the letter type for DB storage
  function getLetterType(): string {
    const tmpl = TEMPLATE_OPTIONS.find((t) => t.value === selectedTemplate)
    return tmpl?.type || "custom"
  }

  // Get the HTML to send/save
  async function getFinalHtml(): Promise<string> {
    // If user edited the template HTML, use their version
    if (isEditingTemplate && templateHtmlOverride) {
      return templateHtmlOverride
    }

    if (selectedTemplate !== "custom") {
      const props = buildTemplateProps()
      const result = await renderTemplatePreview(selectedTemplate, props)
      return result.html || wrapCustomBody(resolveVariables(body), subject)
    }
    return wrapCustomBody(resolveVariables(body), subject)
  }

  // Handle file attachment upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newAttachments: AttachmentMeta[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`)
        continue
      }

      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadEmailAttachment(formData)
      if (result.error) {
        toast.error(`Failed to upload ${file.name}: ${result.error}`)
      } else if (result.attachment) {
        newAttachments.push(result.attachment)
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments])
      toast.success(
        `${newAttachments.length} file${newAttachments.length > 1 ? "s" : ""} attached`
      )
    }

    setUploading(false)
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Remove an attachment
  async function handleRemoveAttachment(index: number) {
    const att = attachments[index]
    await removeEmailAttachment(att.storagePath)
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  // Send email
  async function handleSend() {
    if (!recipientEmail || !subject || !propertyId) {
      toast.error("Please fill in recipient, subject, and property")
      return
    }

    setSending(true)
    const html = await getFinalHtml()
    const result = await sendLetter({
      propertyId,
      residentId: residentId || null,
      violationId: violationId || null,
      subject,
      bodyHtml: html,
      recipientEmail,
      type: getLetterType(),
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Email sent successfully (ID: ${result.messageId})`)
      onOpenChange(false)
    }
    setSending(false)
  }

  // Save draft
  async function handleSaveDraft() {
    if (!subject || !propertyId) {
      toast.error("Please fill in subject and property")
      return
    }

    setSavingDraft(true)
    const html = await getFinalHtml()
    const result = await saveDraft({
      propertyId,
      residentId: residentId || null,
      violationId: violationId || null,
      subject,
      bodyHtml: html,
      recipientEmail,
      type: getLetterType(),
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Draft saved")
      onOpenChange(false)
    }
    setSavingDraft(false)
  }

  // Send test
  async function handleSendTest() {
    if (!subject) {
      toast.error("Please fill in a subject line")
      return
    }

    setSendingTest(true)
    const html = await getFinalHtml()
    const result = await sendTestEmail(subject, html)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Test email sent to your address")
    }
    setSendingTest(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-6xl">
        <div className="flex h-[85vh] flex-col">
          {/* Header */}
          <div className="border-b px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Compose Email
              </DialogTitle>
              <DialogDescription>
                Send correspondence to a resident or property owner.
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body: Two panels */}
          <div className="flex min-h-0 flex-1">
            {/* Left Panel — Editor (60%) */}
            <div className="flex w-[60%] flex-col overflow-y-auto border-r p-6">
              <div className="space-y-4">
                {/* Property + Resident Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Property *</Label>
                    <Select value={propertyId} onValueChange={handlePropertyChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select property..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {properties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Resident</Label>
                    <Select value={residentId} onValueChange={handleResidentChange}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select resident..." />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyResidents.length === 0 ? (
                          <SelectItem value="__none" disabled>
                            No residents
                          </SelectItem>
                        ) : (
                          propertyResidents.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.full_name}
                              {r.email && (
                                <span className="ml-1 text-muted-foreground">
                                  ({r.email})
                                </span>
                              )}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Violation (if applicable) */}
                {propertyViolations.length > 0 && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link to Violation</Label>
                    <Select value={violationId} onValueChange={setViolationId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="None (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none">None</SelectItem>
                        {propertyViolations.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.category} — {v.description.slice(0, 40)}
                            {v.description.length > 40 ? "…" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* To + Template Row */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">To (Email) *</Label>
                    <div className="relative">
                      <Input
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="resident@email.com"
                        className="h-9"
                      />
                      {selectedResident && recipientEmail && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                          {selectedResident.full_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">Template</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={handleTemplateChange}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATE_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Subject */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Subject *</Label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject line..."
                    className="h-9"
                  />
                </div>

                {/* Body (for custom or override) */}
                {selectedTemplate === "custom" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Body</Label>
                        <span className="text-[10px] text-muted-foreground">
                          Use {"{{variables}}"} for dynamic content
                        </span>
                      </div>
                      <Textarea
                        ref={bodyRef}
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write your email content here..."
                        rows={12}
                        className="resize-none font-mono text-sm"
                      />
                    </div>

                    {/* Variable Helper */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Braces className="h-3 w-3" />
                        Insert Variable
                      </Label>
                      <div className="flex flex-wrap gap-1.5">
                        {VARIABLES.map((v) => (
                          <button
                            key={v.key}
                            type="button"
                            onClick={() => insertVariable(v.key)}
                            className="rounded-md border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Template info + edit button */}
                {selectedTemplate !== "custom" && !isEditingTemplate && (
                  <div className="rounded-md border border-blue-200 bg-blue-50/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <FileText className="mt-0.5 h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Using{" "}
                            {TEMPLATE_OPTIONS.find(
                              (t) => t.value === selectedTemplate
                            )?.label}{" "}
                            template
                          </p>
                          <p className="mt-0.5 text-xs text-blue-700">
                            The template will be auto-filled with data from the
                            selected property, resident, and violation. Preview
                            updates live on the right.
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={handleEditTemplate}
                      >
                        <PencilLine className="mr-1 h-3 w-3" />
                        Edit Template
                      </Button>
                    </div>
                  </div>
                )}

                {/* Template HTML editor (when editing) */}
                {selectedTemplate !== "custom" && isEditingTemplate && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-1.5 text-xs">
                        <PencilLine className="h-3 w-3 text-amber-600" />
                        <span className="text-amber-700">Editing Template HTML</span>
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={handleRevertTemplate}
                      >
                        <Undo2 className="mr-1 h-3 w-3" />
                        Revert to Original
                      </Button>
                    </div>
                    <div className="rounded-md border border-amber-200 bg-amber-50/30 p-2">
                      <p className="mb-2 text-[11px] text-amber-700">
                        You can modify the template HTML below. Changes apply only to this email and won&apos;t affect the saved template.
                      </p>
                      <Textarea
                        value={templateHtmlOverride}
                        onChange={(e) => setTemplateHtmlOverride(e.target.value)}
                        rows={14}
                        className="resize-none font-mono text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Attachments Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-1.5 text-xs">
                      <Paperclip className="h-3 w-3" />
                      Attachments
                      {attachments.length > 0 && (
                        <span className="rounded-full bg-sidebar-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-sidebar-accent">
                          {attachments.length}
                        </span>
                      )}
                    </Label>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-1 h-3 w-3" />
                        )}
                        Add Images
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <FileIcon className="mr-1 h-3 w-3" />
                        )}
                        Add Files
                      </Button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Attachment list */}
                  {attachments.length > 0 && (
                    <div className="space-y-1.5">
                      {attachments.map((att, i) => (
                        <div
                          key={att.storagePath}
                          className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
                        >
                          {isImageType(att.type) ? (
                            <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                          ) : (
                            <FileIcon className="h-4 w-4 shrink-0 text-gray-500" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {att.name}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatFileSize(att.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(i)}
                            className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground">
                        Max 10MB per file. Attachments will be included in the email.
                      </p>
                    </div>
                  )}

                  {attachments.length === 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      No attachments. Click above to attach images or documents.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel — Preview (40%) */}
            <div className="flex w-[40%] flex-col bg-muted/30">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  Live Preview
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={handleSendTest}
                  disabled={sendingTest || !subject}
                >
                  {sendingTest ? (
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  ) : (
                    <FlaskConical className="mr-1.5 h-3 w-3" />
                  )}
                  Send Test to Me
                </Button>
              </div>
              <div className="relative min-h-0 flex-1">
                {previewLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                )}
                {previewHtml ? (
                  <iframe
                    srcDoc={previewHtml}
                    className="h-full w-full border-0"
                    title="Email Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center">
                    <div className="space-y-2">
                      <Mail className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Select a template or start typing to see a preview
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Attachment preview in sidebar */}
              {attachments.length > 0 && (
                <div className="border-t px-4 py-2.5">
                  <p className="mb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Attachments ({attachments.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {attachments.map((att) => (
                      <span
                        key={att.storagePath}
                        className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        {isImageType(att.type) ? (
                          <ImageIcon className="h-2.5 w-2.5" />
                        ) : (
                          <FileIcon className="h-2.5 w-2.5" />
                        )}
                        {att.name.length > 20
                          ? att.name.slice(0, 17) + "..."
                          : att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={savingDraft || !subject || !propertyId}
              >
                {savingDraft ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save as Draft
              </Button>

              <Button
                size="sm"
                onClick={handleSend}
                disabled={
                  sending || !recipientEmail || !subject || !propertyId
                }
              >
                {sending ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                )}
                Send Now
                {attachments.length > 0 && (
                  <span className="ml-1 rounded-full bg-white/20 px-1.5 text-[10px]">
                    {attachments.length} file{attachments.length > 1 ? "s" : ""}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Helpers ──────────────────────────────────────────────────

function wrapCustomBody(body: string, subject: string): string {
  const escapedBody = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br />")

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Georgia,'Times New Roman',Times,serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background-color:#1e3a5f;padding:32px 24px 24px;text-align:center;">
    <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 4px;">Madison Park Homeowners Association</p>
    <p style="color:#94a3b8;font-size:13px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Johns Creek, Georgia 30022</p>
  </div>
  <div style="padding:32px;">
    <h1 style="font-size:24px;color:#1e3a5f;margin:0 0 24px;">${subject.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</h1>
    <div style="font-size:15px;line-height:24px;color:#27272a;">${escapedBody}</div>
  </div>
  <div style="padding:0 32px 32px;">
    <hr style="border-color:#e4e4e7;margin:0 0 20px;" />
    <p style="font-size:12px;color:#1e3a5f;font-weight:600;text-align:center;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Sent on behalf of Madison Park HOA Board</p>
    <p style="font-size:12px;line-height:18px;color:#71717a;text-align:center;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      Madison Park Homeowners Association<br/>
      123 Madison Park Drive, Johns Creek, GA 30022<br/>
      (770) 555-0142
    </p>
  </div>
</div>
</body>
</html>`
}
