"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveEmailSettings } from "@/app/actions/tenant-settings"

type FormState = {
  from_name: string
  reply_to: string
  footer: string
  signature: string
}

export function EmailForm({ initial }: { initial: FormState }) {
  const [pending, start] = useTransition()
  const [form, setForm] = useState<FormState>(initial)

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await saveEmailSettings({
        from_name: form.from_name || null,
        reply_to: form.reply_to || null,
        footer: form.footer || null,
        signature: form.signature || null,
      })
      if (res.ok) toast.success("Email settings saved")
      else toast.error(res.error)
    })
  }

  return (
    <form className="grid max-w-3xl gap-6" onSubmit={onSubmit}>
      <Field
        label="From name"
        help={`Shown as the sender on every email — e.g. "Madison Park HOA".`}
      >
        <Input
          value={form.from_name}
          onChange={(e) => set("from_name", e.target.value)}
          placeholder="Madison Park HOA"
        />
      </Field>

      <Field
        label="Reply-to address"
        help="Where resident replies are routed. Leave blank to use the sending address."
      >
        <Input
          type="email"
          value={form.reply_to}
          onChange={(e) => set("reply_to", e.target.value)}
          placeholder="board@madisonparkhoa.com"
        />
      </Field>

      <Field
        label="Email signature"
        help="Appended to every transactional email after the body content."
      >
        <Textarea
          rows={4}
          value={form.signature}
          onChange={(e) => set("signature", e.target.value)}
          placeholder="— The Madison Park Board"
        />
      </Field>

      <Field
        label="Footer"
        help={`Shown at the bottom of every email. The "Powered by HOA Pro Hub" line is added automatically on all plans.`}
      >
        <Textarea
          rows={3}
          value={form.footer}
          onChange={(e) => set("footer", e.target.value)}
          placeholder="123 Main St, Anytown, GA 12345 · (555) 555-1234"
        />
      </Field>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save email settings"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            toast.info("Test send is wired up by Stream G's email runtime.")
          }
        >
          Send test email
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  help,
  children,
}: {
  label: string
  help?: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {help ? <p className="text-xs text-slate-500">{help}</p> : null}
    </div>
  )
}
