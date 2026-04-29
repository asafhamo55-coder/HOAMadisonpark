"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  inviteMember,
  changeMemberRole,
  removeMember,
} from "@/app/actions/tenant-settings"
import type { TenantRole } from "@/lib/tenant"

type Role =
  | "owner"
  | "admin"
  | "board"
  | "committee"
  | "resident"
  | "vendor"
  | "readonly"

const ROLES: Role[] = [
  "owner",
  "admin",
  "board",
  "committee",
  "resident",
  "vendor",
  "readonly",
]

type MemberRow = {
  user_id: string
  role: string
  status: string
  email: string | null
  full_name: string | null
}

type InviteRow = {
  id: string
  email: string
  role: string
  status: string
  created_at: string
}

export function MembersList({
  members,
  invites,
  currentRole,
}: {
  members: MemberRow[]
  invites: InviteRow[]
  currentRole: TenantRole
}) {
  const [pending, start] = useTransition()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("resident")

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault()
    start(async () => {
      const res = await inviteMember({ email, role })
      if (res.ok) {
        toast.success(`Invitation queued for ${email}`)
        setEmail("")
      } else {
        toast.error(res.error)
      }
    })
  }

  const onRoleChange = (user_id: string, newRole: Role) => {
    start(async () => {
      const res = await changeMemberRole({ user_id, role: newRole })
      if (res.ok) toast.success("Role updated")
      else toast.error(res.error)
    })
  }
  const onRemove = (user_id: string) => {
    if (!confirm("Remove this member?")) return
    start(async () => {
      const res = await removeMember(user_id)
      if (res.ok) toast.success("Member removed")
      else toast.error(res.error)
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Invite a new member
        </h2>
        <form
          className="grid items-end gap-2 sm:grid-cols-[1fr_12rem_auto]"
          onSubmit={onInvite}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.filter(
                  (r) => r !== "owner" || currentRole === "owner",
                ).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Sending…" : "Send invite"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">Members</h2>
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Name / email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {members.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-slate-500"
                  >
                    No members yet.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.user_id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-900">
                        {m.full_name ?? m.email ?? m.user_id}
                      </div>
                      {m.email && m.full_name ? (
                        <div className="text-xs text-slate-500">{m.email}</div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <Select
                        value={m.role}
                        onValueChange={(v) =>
                          onRoleChange(m.user_id, v as Role)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.filter(
                            (r) => r !== "owner" || currentRole === "owner",
                          ).map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        variant={
                          m.status === "active" ? "default" : "secondary"
                        }
                      >
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemove(m.user_id)}
                        disabled={pending}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-900">
          Pending invitations
        </h2>
        {invites.length === 0 ? (
          <p className="text-sm text-slate-500">No pending invitations.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Role</th>
                  <th className="px-3 py-2">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invites.map((i) => (
                  <tr key={i.id}>
                    <td className="px-3 py-2">{i.email}</td>
                    <td className="px-3 py-2 capitalize">{i.role}</td>
                    <td className="px-3 py-2 text-slate-500">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
