"use client"

import { useRouter } from "next/navigation"
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
  upsertKnowledgeBaseEntry,
  deleteKnowledgeBaseEntry,
} from "@/app/actions/tenant-settings"
import type { KnowledgeBaseEntry } from "@/lib/tenant-settings"

type EntryDraft = {
  id: string | null
  section_path: string
  title: string
  content: string
  citations: string
  is_published: boolean
}

const blank = (): EntryDraft => ({
  id: null,
  section_path: "",
  title: "",
  content: "",
  citations: "",
  is_published: true,
})

export function KnowledgeBaseManager({
  initialQuery,
  entries,
}: {
  initialQuery: string
  entries: KnowledgeBaseEntry[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [q, setQ] = useState(initialQuery)
  const [editing, setEditing] = useState<EntryDraft | null>(null)
  const [open, setOpen] = useState(false)

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const url = new URL(window.location.href)
    if (q.trim()) url.searchParams.set("q", q.trim())
    else url.searchParams.delete("q")
    router.push(url.pathname + url.search)
  }

  const onAdd = () => {
    setEditing(blank())
    setOpen(true)
  }
  const onEdit = (e: KnowledgeBaseEntry) => {
    setEditing({
      id: e.id,
      section_path: e.section_path ?? "",
      title: e.title ?? "",
      content: e.content ?? "",
      citations:
        (e.citations as { note?: string } | null)?.note ?? "",
      is_published: e.is_published,
    })
    setOpen(true)
  }
  const onDelete = (id: string) => {
    if (!confirm("Delete this knowledge base entry?")) return
    start(async () => {
      const res = await deleteKnowledgeBaseEntry(id)
      if (res.ok) toast.success("Entry deleted")
      else toast.error(res.error)
    })
  }

  const onSave = () => {
    if (!editing) return
    start(async () => {
      const res = await upsertKnowledgeBaseEntry({
        id: editing.id,
        section_path: editing.section_path,
        title: editing.title,
        content: editing.content,
        citations: editing.citations || null,
        is_published: editing.is_published,
      })
      if (res.ok) {
        toast.success("Entry saved")
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="space-y-4">
      <form className="flex items-center gap-2" onSubmit={onSearch}>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search the knowledge base… (full-text)"
          className="max-w-md"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {initialQuery ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQ("")
              router.push(window.location.pathname)
            }}
          >
            Clear
          </Button>
        ) : null}
        <div className="flex-1" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={onAdd}>+ New entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing?.id ? "Edit entry" : "New knowledge base entry"}
              </DialogTitle>
            </DialogHeader>
            {editing ? (
              <div className="grid gap-3">
                <div className="grid gap-1.5">
                  <Label>Section path</Label>
                  <Input
                    value={editing.section_path}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        section_path: e.target.value,
                      })
                    }
                    placeholder="leasing.restrictions"
                  />
                  <p className="text-xs text-slate-500">
                    Dotted path used for direct lookups,
                    e.g. <code>leasing.cap_pct</code> or{" "}
                    <code>fines.schedule</code>.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label>Title</Label>
                  <Input
                    value={editing.title}
                    onChange={(e) =>
                      setEditing({ ...editing, title: e.target.value })
                    }
                    placeholder="Leasing restrictions"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Content</Label>
                  <Textarea
                    rows={6}
                    value={editing.content}
                    onChange={(e) =>
                      setEditing({ ...editing, content: e.target.value })
                    }
                    placeholder="The community has a 15% leasing cap. Owners may not lease their units for less than 12 months at a time…"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Citation (optional)</Label>
                  <Input
                    value={editing.citations}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        citations: e.target.value,
                      })
                    }
                    placeholder="CC&Rs §7.2, page 14"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="kb-pub"
                    checked={editing.is_published}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        is_published: e.target.checked,
                      })
                    }
                  />
                  <Label htmlFor="kb-pub">
                    Published (visible to residents in portal)
                  </Label>
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
                {pending ? "Saving…" : "Save entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </form>

      {initialQuery ? (
        <p className="text-sm text-slate-600">
          {entries.length} result{entries.length === 1 ? "" : "s"} for{" "}
          <strong>{initialQuery}</strong>
        </p>
      ) : null}

      <div className="space-y-2">
        {entries.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-600">
              {initialQuery
                ? "No entries match your search."
                : "No knowledge base entries yet. Click \"New entry\" to add one."}
            </p>
          </div>
        ) : (
          entries.map((e) => (
            <article
              key={e.id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {e.title ?? "(untitled)"}
                    </h3>
                    {e.is_published ? (
                      <Badge variant="default">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  {e.section_path ? (
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {e.section_path}
                    </p>
                  ) : null}
                  <p className="mt-2 whitespace-pre-line text-sm text-slate-700">
                    {e.content}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(e)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(e.id)}
                    disabled={pending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  )
}
