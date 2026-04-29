"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitStep7 } from "@/app/actions/onboarding"

type Invite = { email: string; role: "admin" | "board" | "committee" | "readonly" }

export function Step7Form() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "board" }])
  const [error, setError] = useState<string | null>(null)

  function update(idx: number, patch: Partial<Invite>) {
    setInvites((current) => current.map((inv, i) => (i === idx ? { ...inv, ...patch } : inv)))
  }
  function add() {
    if (invites.length >= 50) return
    setInvites((c) => [...c, { email: "", role: "board" }])
  }
  function remove(idx: number) {
    setInvites((c) => c.filter((_, i) => i !== idx))
  }

  function onSubmit() {
    setError(null)
    const filtered = invites.filter((i) => i.email.trim().length > 0)
    startTransition(async () => {
      const r = await submitStep7({ invites: filtered })
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  function onSkip() {
    setError(null)
    startTransition(async () => {
      const r = await submitStep7({ invites: [] })
      if (r.ok) router.push(r.next)
      else setError(r.error)
    })
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-3">
          {invites.map((inv, i) => (
            <div key={i} className="grid grid-cols-12 items-end gap-3">
              <div className="col-span-7">
                <Label htmlFor={`email-${i}`} className={i === 0 ? "" : "sr-only"}>Email</Label>
                <Input
                  id={`email-${i}`}
                  type="email"
                  placeholder="alex@example.com"
                  value={inv.email}
                  onChange={(e) => update(i, { email: e.target.value })}
                />
              </div>
              <div className="col-span-4">
                <Label htmlFor={`role-${i}`} className={i === 0 ? "" : "sr-only"}>Role</Label>
                <Select value={inv.role} onValueChange={(v) => update(i, { role: v as Invite["role"] })}>
                  <SelectTrigger id={`role-${i}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="board">Board</SelectItem>
                    <SelectItem value="committee">Committee</SelectItem>
                    <SelectItem value="readonly">Read-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-1">
                {invites.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" onClick={add} className="mt-4">
          <Plus className="mr-2 h-4 w-4" /> Add another
        </Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/onboarding/step-6">← Back</Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip} disabled={pending}>
            Skip — I&apos;ll invite later
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? "Sending invites…" : "Send invites & finish setup ✓"}
          </Button>
        </div>
      </div>
    </div>
  )
}
