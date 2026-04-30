"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  upsertViolationCategory,
  deleteViolationCategory,
} from "@/app/actions/tenant-settings"

type Row = {
  id: string
  name: string
  slug: string
  description: string | null
  default_fine_cents: number
  first_offense_cents: number | null
  second_offense_cents: number | null
  third_offense_cents: number | null
  active: boolean
  sort_order: number
}

const blank = (): Row => ({
  id: "",
  name: "",
  slug: "",
  description: "",
  default_fine_cents: 0,
  first_offense_cents: 0,
  second_offense_cents: 0,
  third_offense_cents: 0,
  active: true,
  sort_order: 0,
})

export function ViolationCategoryList({ rows }: { rows: Row[] }) {
  const [editing, setEditing] = useState<Row | null>(null)
  const [open, setOpen] = useState(false)
  const [pending, start] = useTransition()

  const onAdd = () => {
    setEditing(blank())
    setOpen(true)
  }
  const onEdit = (r: Row) => {
    setEditing({ ...r, description: r.description ?? "" })
    setOpen(true)
  }

  const onDelete = (r: Row) => {
    if (!confirm(`Delete "${r.name}"? This cannot be undone.`)) return
    start(async () => {
      const res = await deleteViolationCategory(r.id)
      if (res.ok) toast.success("Category deleted")
      else toast.error(res.error)
    })
  }

  const onSave = () => {
    if (!editing) return
    start(async () => {
      const res = await upsertViolationCategory({
        id: editing.id || null,
        name: editing.name,
        slug: editing.slug,
        description: editing.description,
        default_fine_cents: editing.default_fine_cents,
        first_offense_cents: editing.first_offense_cents,
        second_offense_cents: editing.second_offense_cents,
        third_offense_cents: editing.third_offense_cents,
        active: editing.active,
        sort_order: editing.sort_order,
      })
      if (res.ok) {
        toast.success("Category saved")
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={onAdd}>+ Add category</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editing?.id ? "Edit category" : "New category"}
              </DialogTitle>
            </DialogHeader>
            {editing ? (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) =>
                      setEditing({ ...editing, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Slug (lowercase, underscores)</Label>
                  <Input
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_]/g, "_"),
                      })
                    }
                    placeholder="lawn"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={editing.description ?? ""}
                    onChange={(e) =>
                      setEditing({ ...editing, description: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="grid gap-1.5">
                    <Label>1st offense ($)</Label>
                    <Input
                      inputMode="decimal"
                      value={(
                        (editing.first_offense_cents ?? 0) / 100
                      ).toFixed(2)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          first_offense_cents: Math.round(
                            Number(e.target.value || 0) * 100,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>2nd offense ($)</Label>
                    <Input
                      inputMode="decimal"
                      value={(
                        (editing.second_offense_cents ?? 0) / 100
                      ).toFixed(2)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          second_offense_cents: Math.round(
                            Number(e.target.value || 0) * 100,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>3rd offense ($)</Label>
                    <Input
                      inputMode="decimal"
                      value={(
                        (editing.third_offense_cents ?? 0) / 100
                      ).toFixed(2)}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          third_offense_cents: Math.round(
                            Number(e.target.value || 0) * 100,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button onClick={onSave} disabled={pending}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Default fine</th>
              <th className="px-3 py-2 w-32"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-slate-500"
                >
                  No violation categories yet. Click &ldquo;Add category&rdquo;
                  to create one.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {r.name}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-600">
                    {r.slug}
                  </td>
                  <td className="px-3 py-2">
                    {r.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Hidden</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    ${(r.default_fine_cents / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(r)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(r)}
                      disabled={pending}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
