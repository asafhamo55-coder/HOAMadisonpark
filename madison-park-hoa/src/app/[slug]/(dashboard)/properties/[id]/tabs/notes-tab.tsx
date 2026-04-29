"use client"

import { useState, useCallback } from "react"
import { Save, FileUp } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { updatePropertyNotes } from "../actions"

export function NotesTab({
  propertyId,
  notes,
  canManage,
}: {
  propertyId: string
  notes: string | null
  canManage: boolean
}) {
  const [value, setValue] = useState(notes || "")
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  const save = useCallback(async () => {
    if (!dirty) return
    setSaving(true)
    const result = await updatePropertyNotes(propertyId, value)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Notes saved")
      setDirty(false)
    }
    setSaving(false)
  }, [propertyId, value, dirty])

  return (
    <div className="space-y-6">
      {/* Notes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Property Notes</h3>
          {canManage && dirty && (
            <Button size="sm" variant="outline" onClick={save} disabled={saving}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
        <Textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setDirty(true)
          }}
          onBlur={() => {
            if (canManage) save()
          }}
          placeholder="Add notes about this property..."
          className="min-h-[200px]"
          readOnly={!canManage}
        />
      </div>

      {/* Documents placeholder */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Attached Documents</h3>
          {canManage && (
            <Button size="sm" variant="outline" disabled>
              <FileUp className="mr-1.5 h-3.5 w-3.5" />
              Upload
            </Button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
          <FileUp className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No documents attached to this property.
          </p>
          <p className="text-xs text-muted-foreground">
            Document uploads coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
