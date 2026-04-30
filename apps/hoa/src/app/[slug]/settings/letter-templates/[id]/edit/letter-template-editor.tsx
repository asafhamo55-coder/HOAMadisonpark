"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveLetterTemplate } from "@/app/actions/tenant-settings"

type Template = {
  id: string
  name: string
  description: string
  subject: string
  body_html: string
  variables: string[]
  channel: "letter" | "email"
}

type Version = {
  version: number
  edited_by: string | null
  edit_note: string | null
  created_at: string
}

/** Render a template by replacing {{key}} tokens with sample data. */
function renderPreview(html: string, data: Record<string, string>) {
  return html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (match, key) => {
    const v = data[key]
    return v != null ? v : `<mark class="bg-amber-100">${match}</mark>`
  })
}

export function LetterTemplateEditor({
  template,
  sample,
  versions,
}: {
  template: Template
  sample: Record<string, string>
  versions: Version[]
}) {
  const [pending, start] = useTransition()
  const [name, setName] = useState(template.name)
  const [subject, setSubject] = useState(template.subject)
  const [bodyHtml, setBodyHtml] = useState(template.body_html)
  const [variables, setVariables] = useState<string[]>(template.variables)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({}),
      Placeholder.configure({
        placeholder: "Write the letter content here…",
      }),
    ],
    content: template.body_html,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[400px] rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-[var(--tenant-primary,#0F2A47)]",
      },
    },
    onUpdate: ({ editor }) => setBodyHtml(editor.getHTML()),
  })

  const previewHtml = useMemo(
    () => renderPreview(bodyHtml, sample),
    [bodyHtml, sample],
  )

  // Detect variables actually used in body so we keep `variables` honest.
  useEffect(() => {
    const found = new Set<string>()
    const re = /\{\{\s*([\w.]+)\s*\}\}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(bodyHtml)) !== null) found.add(m[1])
    setVariables(Array.from(found))
  }, [bodyHtml])

  const insertField = (key: string) => {
    if (!editor) return
    editor.chain().focus().insertContent(`{{${key}}}`).run()
  }

  const onSave = () => {
    start(async () => {
      const res = await saveLetterTemplate({
        id: template.id,
        name,
        description: template.description,
        subject,
        body_html: bodyHtml,
        variables,
      })
      if (res.ok) toast.success("Template saved (new version recorded)")
      else toast.error(res.error)
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <div className="min-w-0 space-y-4">
        <div className="grid gap-1.5">
          <Label>Template name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        {template.channel === "email" ? (
          <div className="grid gap-1.5">
            <Label>Email subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Notice of Violation — {{violation.category_name}}"
            />
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1.5">
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive("bold")}
          >
            <span className="font-bold">B</span>
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive("italic")}
          >
            <span className="italic">I</span>
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            active={editor?.isActive("strike")}
          >
            <span className="line-through">S</span>
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-slate-300" />
          <ToolbarBtn
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor?.isActive("heading", { level: 2 })}
          >
            H2
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor?.isActive("heading", { level: 3 })}
          >
            H3
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-slate-300" />
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive("bulletList")}
          >
            • List
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive("orderedList")}
          >
            1. List
          </ToolbarBtn>
          <span className="mx-1 h-5 w-px bg-slate-300" />
          <ToolbarBtn
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive("blockquote")}
          >
            Quote
          </ToolbarBtn>
          <ToolbarBtn
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          >
            ── Divider
          </ToolbarBtn>
        </div>

        <EditorContent editor={editor} />

        {/* Preview */}
        <section
          className="rounded-md border border-slate-200 bg-slate-50 p-4"
          aria-label="Live preview with sample data"
        >
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live preview
            </p>
            <p className="text-xs text-slate-500">
              Unfilled fields highlighted yellow
            </p>
          </div>
          <article
            className="prose prose-sm max-w-none rounded-md bg-white p-4 text-slate-900"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </section>

        <div className="flex items-center gap-3">
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : "Save template"}
          </Button>
        </div>
      </div>

      {/* Sidebar — merge fields + version history */}
      <aside className="space-y-6">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Merge fields
          </h3>
          <p className="mb-2 text-xs text-slate-500">
            Click any field to insert it into the editor.
          </p>
          <ul className="grid gap-1">
            {Object.keys(sample).map((key) => (
              <li key={key}>
                <button
                  type="button"
                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left font-mono text-xs text-slate-700 hover:border-[var(--tenant-primary,#0F2A47)] hover:text-[var(--tenant-primary,#0F2A47)]"
                  onClick={() => insertField(key)}
                >
                  {`{{${key}}}`}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Versions
          </h3>
          {versions.length === 0 ? (
            <p className="text-xs text-slate-500">
              No saved versions yet — saving will create v1.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {versions.map((v) => (
                <li
                  key={v.version}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5"
                >
                  <span className="font-medium text-slate-900">
                    v{v.version}
                  </span>
                  <span className="text-slate-500">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>
    </div>
  )
}

function ToolbarBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode
  onClick: () => void
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-700 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  )
}
