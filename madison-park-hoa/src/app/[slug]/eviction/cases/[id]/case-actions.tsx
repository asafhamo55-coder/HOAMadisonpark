"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { advanceEvStageAction, closeEvCaseAction } from "../../actions"

export function CaseActions({
  caseId,
  canAdvance,
  nextStageLabel,
  canClose,
}: {
  caseId: string
  canAdvance: boolean
  nextStageLabel: string | null
  canClose: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [notes, setNotes] = useState("")
  const [closeStatus, setCloseStatus] = useState("closed")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Move case forward</CardTitle>
        <CardDescription>
          Advance to the next stage or close the case with an outcome.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {canAdvance && nextStageLabel && (
          <div className="grid gap-2">
            <Textarea
              placeholder="Optional notes for this transition…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <Button
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData()
                  fd.set("case_id", caseId)
                  if (notes) fd.set("notes", notes)
                  const res = await advanceEvStageAction(fd)
                  if (res?.error) toast.error(res.error)
                  else {
                    toast.success(`Advanced to ${nextStageLabel}`)
                    setNotes("")
                    router.refresh()
                  }
                })
              }
            >
              Advance to: {nextStageLabel}
            </Button>
          </div>
        )}

        {canClose && (
          <div className="grid gap-2 border-t pt-4">
            <div className="text-sm font-medium">Close case</div>
            <Select value={closeStatus} onValueChange={setCloseStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="possession">Possession recovered</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const fd = new FormData()
                  fd.set("case_id", caseId)
                  fd.set("status", closeStatus)
                  const res = await closeEvCaseAction(fd)
                  if (res?.error) toast.error(res.error)
                  else {
                    toast.success("Case closed")
                    router.refresh()
                  }
                })
              }
            >
              Close case
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
