"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Mail,
  Plus,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Letter } from "../detail-data"

const statusIcons: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  draft: { icon: Clock, color: "text-gray-500" },
  sent: { icon: Send, color: "text-blue-500" },
  delivered: { icon: CheckCircle2, color: "text-emerald-500" },
  failed: { icon: XCircle, color: "text-red-500" },
}

const typeLabels: Record<string, string> = {
  violation_notice: "Violation Notice",
  warning: "Warning",
  fine: "Fine Notice",
  welcome: "Welcome Letter",
  announcement: "Announcement",
  custom: "Custom",
}

export function LettersTab({
  propertyId,
  letters,
  canManage,
}: {
  propertyId: string
  letters: Letter[]
  canManage: boolean
}) {
  const [viewLetter, setViewLetter] = useState<Letter | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Correspondence ({letters.length})
        </h3>
        {canManage && (
          <Link href={`/dashboard/email?property=${propertyId}`}>
            <Button size="sm">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Send New Letter
            </Button>
          </Link>
        )}
      </div>

      {letters.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No correspondence on record.
        </p>
      ) : (
        <div className="space-y-2">
          {letters.map((l) => {
            const statusCfg = statusIcons[l.status] || statusIcons.draft
            const StatusIcon = statusCfg.icon

            return (
              <div
                key={l.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted",
                    statusCfg.color
                  )}
                >
                  <Mail className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{l.subject}</p>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {typeLabels[l.type] || l.type}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className={cn("flex items-center gap-1", statusCfg.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {l.status}
                    </span>
                    {l.sent_at && (
                      <span>
                        {format(new Date(l.sent_at), "MMM d, yyyy h:mm a")}
                      </span>
                    )}
                    {!l.sent_at && l.created_at && (
                      <span>
                        Created{" "}
                        {format(new Date(l.created_at), "MMM d, yyyy")}
                      </span>
                    )}
                    {l.sent_by_name && <span>By {l.sent_by_name}</span>}
                    {l.recipient_email && <span>To {l.recipient_email}</span>}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setViewLetter(l)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Letter Content Modal */}
      <Dialog
        open={viewLetter !== null}
        onOpenChange={(open) => {
          if (!open) setViewLetter(null)
        }}
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
            </DialogDescription>
          </DialogHeader>
          {viewLetter && (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: viewLetter.body_html }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
