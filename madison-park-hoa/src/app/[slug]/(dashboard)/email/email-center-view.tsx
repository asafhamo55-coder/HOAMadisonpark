"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Mail,
  Send,
  Plus,
  Eye,
  Megaphone,
  AlertTriangle,
  HandHeart,
  Pencil,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
  Loader2,
  X,
  Paperclip,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { EmailComposer } from "@/components/email/email-composer"
import type {
  SentLetter,
  EmailTemplate,
  PropertyOption,
  ResidentOption,
  ViolationOption,
  LetterAttachment,
} from "./page-data"
import {
  updateEmailTemplate,
  createEmailTemplate,
  toggleTemplateActive,
} from "./actions"

// ── Config ───────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  violation_notice: "Violation Notice",
  warning: "Warning",
  fine: "Fine Notice",
  welcome: "Welcome",
  announcement: "Announcement",
  payment_reminder: "Payment",
  custom: "Custom",
}

const typeBadgeColors: Record<string, string> = {
  violation_notice: "bg-red-500/10 text-red-700 border-red-500/20",
  warning: "bg-amber-500/10 text-amber-700 border-amber-500/20",
  fine: "bg-rose-500/10 text-rose-700 border-rose-500/20",
  welcome: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  announcement: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  payment_reminder: "bg-purple-500/10 text-purple-700 border-purple-500/20",
  custom: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

const statusConfig: Record<
  string,
  { icon: typeof CheckCircle2; color: string; label: string }
> = {
  draft: { icon: Clock, color: "text-gray-500", label: "Draft" },
  sent: { icon: Send, color: "text-blue-500", label: "Sent" },
  delivered: { icon: CheckCircle2, color: "text-emerald-500", label: "Delivered" },
  failed: { icon: XCircle, color: "text-red-500", label: "Failed" },
}

const TEMPLATE_VARIABLES = [
  "{{resident_name}}",
  "{{property_address}}",
  "{{violation_description}}",
  "{{due_date}}",
  "{{fine_amount}}",
  "{{hoa_name}}",
  "{{board_president_name}}",
]

// ── Main Component ───────────────────────────────────────────

export function EmailCenterView({
  letters,
  emailTemplates,
  properties,
  residents,
  violations,
  canManage,
}: {
  letters: SentLetter[]
  emailTemplates: EmailTemplate[]
  properties: PropertyOption[]
  residents: ResidentOption[]
  violations: ViolationOption[]
  canManage: boolean
}) {
  // Composer state
  const [composerOpen, setComposerOpen] = useState(false)
  const [composerDefaults, setComposerDefaults] = useState<{
    template?: string
    propertyId?: string
    violationId?: string
  }>({})

  // Letter preview
  const [viewLetter, setViewLetter] = useState<SentLetter | null>(null)

  // Letter filters
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [letterSearch, setLetterSearch] = useState("")

  // Template state
  const [editTemplate, setEditTemplate] = useState<EmailTemplate | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null)
  const [createTemplateOpen, setCreateTemplateOpen] = useState(false)

  // Filtered letters
  const filteredLetters = useMemo(() => {
    let data = letters
    if (typeFilter !== "all") data = data.filter((l) => l.type === typeFilter)
    if (statusFilter !== "all") data = data.filter((l) => l.status === statusFilter)
    if (letterSearch) {
      const q = letterSearch.toLowerCase()
      data = data.filter(
        (l) =>
          l.subject.toLowerCase().includes(q) ||
          l.recipient_email?.toLowerCase().includes(q) ||
          l.property_address.toLowerCase().includes(q)
      )
    }
    return data
  }, [letters, typeFilter, statusFilter, letterSearch])

  // Get unique types from letters
  const letterTypes = useMemo(() => {
    const set = new Set<string>()
    letters.forEach((l) => set.add(l.type))
    return Array.from(set).sort()
  }, [letters])

  function openComposer(opts?: { template?: string; propertyId?: string; violationId?: string }) {
    setComposerDefaults(opts || {})
    setComposerOpen(true)
  }

  return (
    <div className="space-y-8">
      {/* ── Section 1: Send New Email ──────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-bold">Send New Email</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Compose */}
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => openComposer()}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent/10">
                <Mail className="h-6 w-6 text-sidebar-accent" />
              </div>
              <div>
                <p className="font-semibold">Compose Email</p>
                <p className="text-xs text-muted-foreground">
                  Write a custom email
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Letter */}
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => openComposer({ template: "welcome-letter" })}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <HandHeart className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Welcome Letter</p>
                <p className="text-xs text-muted-foreground">
                  Greet a new resident
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Violation Notice */}
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => openComposer({ template: "violation-notice" })}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold">Violation Notice</p>
                <p className="text-xs text-muted-foreground">
                  Notify of a violation
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Community Announcement */}
          <Link href="/dashboard/email/broadcast">
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                  <Megaphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold">Announcement</p>
                  <p className="text-xs text-muted-foreground">
                    Broadcast to all residents
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* ── Section 2: Recent Sent Letters ─────────────────────── */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold">
            Recent Sent Letters ({filteredLetters.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={letterSearch}
                onChange={(e) => setLetterSearch(e.target.value)}
                placeholder="Search..."
                className="h-8 w-48 pl-8 text-xs"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {letterTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {typeLabels[t] || t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {(typeFilter !== "all" || statusFilter !== "all" || letterSearch) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setTypeFilter("all")
                  setStatusFilter("all")
                  setLetterSearch("")
                }}
              >
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-2.5 text-left font-medium">Date</th>
                <th className="px-3 py-2.5 text-left font-medium">Recipient</th>
                <th className="px-3 py-2.5 text-left font-medium">Property</th>
                <th className="px-3 py-2.5 text-left font-medium">Type</th>
                <th className="px-3 py-2.5 text-left font-medium">Subject</th>
                <th className="px-3 py-2.5 text-center font-medium">
                  <Paperclip className="mx-auto h-3.5 w-3.5" />
                </th>
                <th className="px-3 py-2.5 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLetters.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No letters found.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => {
                  const sCfg = statusConfig[l.status] || statusConfig.draft
                  const StatusIcon = sCfg.icon
                  return (
                    <tr
                      key={l.id}
                      className="cursor-pointer border-b last:border-0 hover:bg-muted/30"
                      onClick={() => setViewLetter(l)}
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {l.sent_at
                          ? format(new Date(l.sent_at), "MMM d, yyyy")
                          : format(new Date(l.created_at), "MMM d, yyyy")}
                      </td>
                      <td className="px-3 py-2">
                        {l.recipient_email || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{l.property_address}</td>
                      <td className="px-3 py-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px]",
                            typeBadgeColors[l.type] || typeBadgeColors.custom
                          )}
                        >
                          {typeLabels[l.type] || l.type}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate px-3 py-2 font-medium">
                        {l.subject}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {l.attachments && l.attachments.length > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-muted-foreground" title={`${l.attachments.length} attachment${l.attachments.length > 1 ? "s" : ""}`}>
                            <Paperclip className="h-3 w-3" />
                            <span className="text-[10px]">{l.attachments.length}</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={cn(
                            "flex items-center gap-1 text-xs",
                            sCfg.color
                          )}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {sCfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Section 3: Manage Templates ────────────────────────── */}
      {canManage && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Manage Templates</h2>
            <Button size="sm" onClick={() => setCreateTemplateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create Template
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {emailTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                onEdit={() => setEditTemplate(tmpl)}
                onPreview={() => setPreviewTemplate(tmpl)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}

      {/* Email Composer */}
      <EmailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        defaultTemplate={composerDefaults.template}
        defaultPropertyId={composerDefaults.propertyId}
        defaultViolationId={composerDefaults.violationId}
        properties={properties}
        residents={residents}
        violations={violations}
      />

      {/* Letter Preview Modal */}
      <Dialog
        open={viewLetter !== null}
        onOpenChange={(o) => !o && setViewLetter(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewLetter?.subject}</DialogTitle>
            <DialogDescription>
              {viewLetter?.sent_at
                ? `Sent ${format(new Date(viewLetter.sent_at), "MMM d, yyyy h:mm a")}`
                : "Draft"}
              {viewLetter?.recipient_email &&
                ` to ${viewLetter.recipient_email}`}
              {viewLetter?.sent_by_name &&
                ` by ${viewLetter.sent_by_name}`}
            </DialogDescription>
          </DialogHeader>
          {viewLetter && (
            <>
              <iframe
                srcDoc={viewLetter.body_html}
                className="h-[55vh] w-full rounded border-0"
                title="Letter Preview"
                sandbox="allow-same-origin"
              />
              {viewLetter.attachments && viewLetter.attachments.length > 0 && (
                <div className="mt-3 rounded-md border p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3 w-3" />
                    Attachments ({viewLetter.attachments.length})
                  </p>
                  <div className="space-y-1.5">
                    {viewLetter.attachments.map((att: LetterAttachment) => (
                      <a
                        key={att.storagePath}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded border px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors"
                      >
                        <Paperclip className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium">{att.name}</span>
                        <span className="shrink-0 text-muted-foreground">
                          {att.size < 1024 * 1024
                            ? `${(att.size / 1024).toFixed(1)} KB`
                            : `${(att.size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Template Preview Modal */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(o) => !o && setPreviewTemplate(null)}
      >
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Subject: {previewTemplate?.subject_template}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <iframe
              srcDoc={previewTemplate.body_template}
              className="h-[60vh] w-full rounded border-0"
              title="Template Preview"
              sandbox="allow-same-origin"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Template Edit Modal */}
      {editTemplate && (
        <EditTemplateDialog
          template={editTemplate}
          onClose={() => setEditTemplate(null)}
        />
      )}

      {/* Create Template Modal */}
      {createTemplateOpen && (
        <CreateTemplateDialog onClose={() => setCreateTemplateOpen(false)} />
      )}
    </div>
  )
}

// ── Template Card ────────────────────────────────────────────

function TemplateCard({
  template,
  onEdit,
  onPreview,
}: {
  template: EmailTemplate
  onEdit: () => void
  onPreview: () => void
}) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const result = await toggleTemplateActive(template.id, !template.is_active)
    if (result.error) toast.error(result.error)
    else toast.success(template.is_active ? "Template deactivated" : "Template activated")
    setToggling(false)
  }

  return (
    <Card className={cn(!template.is_active && "opacity-60")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm">{template.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</CardTitle>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                typeBadgeColors[template.type] || typeBadgeColors.custom
              )}
            >
              {typeLabels[template.type] || template.type}
            </Badge>
          </div>
          <button
            onClick={handleToggle}
            disabled={toggling}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {template.is_active ? (
              <ToggleRight className="h-5 w-5 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-xs text-muted-foreground line-clamp-2">
          {template.subject_template}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onPreview}>
            <Eye className="mr-1 h-3 w-3" />
            Preview
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onEdit}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Edit Template Dialog ─────────────────────────────────────

function EditTemplateDialog({
  template,
  onClose,
}: {
  template: EmailTemplate
  onClose: () => void
}) {
  const [subjectTemplate, setSubjectTemplate] = useState(template.subject_template)
  const [bodyTemplate, setBodyTemplate] = useState(template.body_template)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const result = await updateEmailTemplate(template.id, {
      subject_template: subjectTemplate,
      body_template: bodyTemplate,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Template updated")
      onClose()
    }
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit: {template.name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </DialogTitle>
          <DialogDescription>
            Edit the subject and body templates. Use {"{{variables}}"} for
            dynamic content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Subject Template</Label>
            <Input
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Body Template (HTML)</Label>
            <Textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={16}
              className="resize-none font-mono text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Available Variables
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <span
                  key={v}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Create Template Dialog ───────────────────────────────────

function CreateTemplateDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("")
  const [type, setType] = useState("custom")
  const [subjectTemplate, setSubjectTemplate] = useState("")
  const [bodyTemplate, setBodyTemplate] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!name || !subjectTemplate || !bodyTemplate) {
      toast.error("Please fill in all fields")
      return
    }

    setSaving(true)
    const result = await createEmailTemplate({
      name: name.toLowerCase().replace(/\s+/g, "_"),
      type,
      subject_template: subjectTemplate,
      body_template: bodyTemplate,
    })

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Template created")
      onClose()
    }
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Template</DialogTitle>
          <DialogDescription>
            Create a reusable email template. Use {"{{variables}}"} for dynamic
            content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Template Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Payment Thank You"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="violation_notice">Violation Notice</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="fine">Fine Notice</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Subject Template *</Label>
            <Input
              value={subjectTemplate}
              onChange={(e) => setSubjectTemplate(e.target.value)}
              placeholder="e.g. {{hoa_name}} — Payment Received"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Body Template (HTML) *</Label>
            <Textarea
              value={bodyTemplate}
              onChange={(e) => setBodyTemplate(e.target.value)}
              rows={12}
              className="resize-none font-mono text-xs"
              placeholder="<html>&#10;<body>&#10;  <p>Dear {{resident_name}},</p>&#10;  ...&#10;</body>&#10;</html>"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Available Variables
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_VARIABLES.map((v) => (
                <span
                  key={v}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
