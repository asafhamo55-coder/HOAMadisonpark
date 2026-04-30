"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Megaphone,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
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
import type { BroadcastResident } from "./page-data"
import {
  sendBroadcast,
  type BroadcastRecipient,
  type BroadcastResult,
} from "./actions"

// Default announcement body wrapper
function wrapAnnouncementBody(body: string): string {
  return `<!DOCTYPE html>
<html>
<body style="font-family:Georgia,'Times New Roman',Times,serif;margin:0;padding:0;background-color:#f4f4f5;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background-color:#1e3a5f;padding:32px 24px 24px;text-align:center;">
    <p style="color:#ffffff;font-size:20px;font-weight:700;margin:0 0 4px;">Madison Park Homeowners Association</p>
    <p style="color:#94a3b8;font-size:13px;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Johns Creek, Georgia 30022</p>
  </div>
  <div style="padding:32px;">
    <p style="font-size:15px;line-height:24px;color:#27272a;">Dear {{resident_name}},</p>
    <div style="font-size:15px;line-height:24px;color:#27272a;">${body.replace(/\n/g, "<br/>")}</div>
    <br/>
    <p style="font-size:15px;color:#27272a;">Best regards,<br/><strong>Madison Park HOA Board</strong></p>
  </div>
  <div style="padding:0 32px 32px;">
    <hr style="border-color:#e4e4e7;margin:0 0 20px;"/>
    <p style="font-size:12px;color:#1e3a5f;font-weight:600;text-align:center;margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Sent on behalf of Madison Park HOA Board</p>
    <p style="font-size:12px;line-height:18px;color:#71717a;text-align:center;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">123 Madison Park Drive, Johns Creek, GA 30022 | (770) 555-0142</p>
  </div>
</div>
</body>
</html>`
}

export function BroadcastView({
  residents,
  streets,
}: {
  residents: BroadcastResident[]
  streets: string[]
}) {
  // Filter state
  const [audienceFilter, setAudienceFilter] = useState("all")
  const [streetFilter, setStreetFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  // Compose state
  const [subject, setSubject] = useState("Community Update — Madison Park HOA")
  const [body, setBody] = useState("")

  // Send state
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<BroadcastResult | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Filter recipients
  const filteredRecipients = useMemo(() => {
    let data = residents

    // Only include residents with email
    data = data.filter((r) => r.email)

    if (streetFilter !== "all") {
      data = data.filter((r) => r.property_street === streetFilter)
    }

    if (typeFilter !== "all") {
      data = data.filter((r) => r.type === typeFilter)
    }

    return data
  }, [residents, streetFilter, typeFilter])

  const recipientCount = filteredRecipients.length

  async function handleSend() {
    if (!subject.trim() || !body.trim()) {
      toast.error("Please fill in subject and body")
      return
    }

    if (recipientCount === 0) {
      toast.error("No recipients with email addresses found")
      return
    }

    setSending(true)
    setResult(null)

    const recipients: BroadcastRecipient[] = filteredRecipients.map((r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email!,
      property_id: r.property_id,
      property_address: r.property_address,
    }))

    const bodyHtml = wrapAnnouncementBody(body)

    const broadcastResult = await sendBroadcast({
      recipients,
      subject,
      bodyTemplate: bodyHtml,
      type: "announcement",
    })

    setResult(broadcastResult)
    setSending(false)

    if (broadcastResult.failed === 0) {
      toast.success(`All ${broadcastResult.sent} emails sent successfully`)
    } else {
      toast.warning(
        `${broadcastResult.sent} sent, ${broadcastResult.failed} failed`
      )
    }
  }

  // Preview HTML
  const previewHtml = useMemo(() => {
    if (!body) return ""
    return wrapAnnouncementBody(body)
      .replace(/\{\{resident_name\}\}/g, "John Doe")
      .replace(/\{\{property_address\}\}/g, "123 Madison Park Dr")
      .replace(/\{\{hoa_name\}\}/g, "Madison Park Homeowners Association")
      .replace(/\{\{board_president_name\}\}/g, "The Board")
  }, [body])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/email">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Megaphone className="h-5 w-5" />
            Community Broadcast
          </h2>
          <p className="text-sm text-muted-foreground">
            Send a personalized announcement to all or selected residents
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Compose + Audience (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Audience Selection */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Select Audience</h3>
                <Badge variant="secondary" className="text-xs">
                  <Users className="mr-1 h-3 w-3" />
                  {recipientCount} recipient{recipientCount !== 1 && "s"}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Select value={audienceFilter} onValueChange={setAudienceFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Current Residents</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Street</Label>
                  <Select value={streetFilter} onValueChange={setStreetFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Streets</SelectItem>
                      {streets.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Resident Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="owner">Owners Only</SelectItem>
                      <SelectItem value="tenant">Tenants Only</SelectItem>
                      <SelectItem value="co-owner">Co-Owners Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recipient preview list */}
              {recipientCount > 0 && recipientCount <= 20 && (
                <div className="max-h-32 overflow-y-auto rounded border p-2">
                  <div className="space-y-1">
                    {filteredRecipients.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="font-medium">{r.full_name}</span>
                        <span className="text-muted-foreground">
                          {r.email} · {r.property_address}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {recipientCount > 20 && (
                <p className="text-xs text-muted-foreground">
                  Showing summary — {recipientCount} residents will receive this
                  email
                </p>
              )}
              {recipientCount === 0 && (
                <p className="text-xs text-amber-600">
                  No residents with email addresses match the current filters
                </p>
              )}
            </CardContent>
          </Card>

          {/* Compose */}
          <Card>
            <CardContent className="space-y-4 p-5">
              <h3 className="font-semibold">Compose Announcement</h3>

              <div className="space-y-1.5">
                <Label className="text-xs">Subject</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Announcement subject..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Message</Label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your announcement here...&#10;&#10;Each recipient will receive a personalized email with their name and property address."
                  rows={10}
                />
                <p className="text-[11px] text-muted-foreground">
                  Each email will be personalized with the resident&apos;s name
                  via {"{{resident_name}}"} and their property address via{" "}
                  {"{{property_address}}"}. The HOA branded header and footer
                  are added automatically.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewOpen(true)}
                  disabled={!body}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sending || !subject || !body || recipientCount === 0}
                >
                  {sending ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Send to {recipientCount} Recipient{recipientCount !== 1 && "s"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results panel */}
        <div className="space-y-4">
          {/* Sending indicator */}
          {sending && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 p-6">
                <Loader2 className="h-8 w-8 animate-spin text-sidebar-accent" />
                <p className="text-sm font-medium">
                  Sending to {recipientCount} recipients...
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take a moment
                </p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {result && (
            <Card>
              <CardContent className="space-y-4 p-5">
                <h3 className="font-semibold">Broadcast Report</h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{result.total}</p>
                    <p className="text-[11px] text-muted-foreground">Total</p>
                  </div>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700">
                      {result.sent}
                    </p>
                    <p className="text-[11px] text-emerald-600">Sent</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-center",
                      result.failed > 0
                        ? "border-red-200 bg-red-50/50"
                        : "border-gray-200"
                    )}
                  >
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        result.failed > 0 ? "text-red-700" : "text-gray-400"
                      )}
                    >
                      {result.failed}
                    </p>
                    <p
                      className={cn(
                        "text-[11px]",
                        result.failed > 0
                          ? "text-red-600"
                          : "text-muted-foreground"
                      )}
                    >
                      Failed
                    </p>
                  </div>
                </div>

                {/* Detailed results */}
                <div className="max-h-64 space-y-1 overflow-y-auto">
                  {result.results.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded px-2 py-1 text-xs"
                    >
                      {r.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                      )}
                      <span className="min-w-0 truncate font-medium">
                        {r.residentName}
                      </span>
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {r.recipientEmail}
                      </span>
                    </div>
                  ))}
                </div>

                {result.failed > 0 && (
                  <div className="rounded border border-red-200 bg-red-50/50 p-3">
                    <p className="text-xs font-medium text-red-700">
                      Failed deliveries:
                    </p>
                    {result.results
                      .filter((r) => !r.success)
                      .map((r, i) => (
                        <p key={i} className="text-xs text-red-600">
                          {r.recipientEmail}: {r.error}
                        </p>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help text when idle */}
          {!sending && !result && (
            <Card>
              <CardContent className="p-5">
                <h3 className="mb-2 text-sm font-semibold">How it works</h3>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>
                    1. Select your audience using the filters above
                  </p>
                  <p>
                    2. Compose your announcement with the subject and body
                  </p>
                  <p>
                    3. Preview to see how it will look
                  </p>
                  <p>
                    4. Click Send — each resident receives a personalized email
                    with their name and property address
                  </p>
                  <p>
                    All sent emails are recorded in the letters table and visible
                    on each property&apos;s correspondence tab.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Announcement Preview</DialogTitle>
            <DialogDescription>
              This is how the email will look. Names and addresses are replaced
              with sample data.
            </DialogDescription>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              className="h-[60vh] w-full rounded border-0"
              title="Announcement Preview"
              sandbox="allow-same-origin"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
