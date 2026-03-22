"use client"

import { useState, useTransition, useRef } from "react"
import Link from "next/link"
import {
  Building2,
  Users,
  Mail,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  Pencil,
  UserX,
  UserPlus,
  Plus,
  Trash2,
  Upload,
  Save,
  X,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  Profile,
  AuditEntry,
  HoaProfile,
  DuesSettings,
  ViolationCategoryConfig,
} from "./page"
import {
  updateSettings,
  uploadLogo,
  updateUserRole,
  inviteUser,
  deactivateUser,
  deleteUser,
} from "@/app/actions/settings"

/* ── Helpers ──────────────────────────────────────────────── */

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  board: "bg-blue-100 text-blue-800",
  resident: "bg-green-100 text-green-800",
  vendor: "bg-purple-100 text-purple-800",
}

const ROLES = ["admin", "board", "resident", "vendor"] as const

const SEVERITY_OPTIONS = ["low", "medium", "high"] as const

/* ── Tab 1: HOA Profile ─────────────────────────────────── */

function HoaProfileTab({
  profile: initial,
}: {
  profile: HoaProfile
}) {
  const [form, setForm] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  function update(field: keyof HoaProfile, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSettings("hoa_profile", form)
      if (result.error) alert(result.error)
      else setSaved(true)
    })
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set("logo", file)
    startTransition(async () => {
      const result = await uploadLogo(fd)
      if (result.error) alert(result.error)
      else if (result.url) {
        setForm((f) => ({ ...f, logo_url: result.url! }))
        setSaved(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">HOA Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">HOA Name</label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Website</label>
            <input
              value={form.website}
              onChange={(e) => update("website", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="https://"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Board President Name</label>
            <input
              value={form.board_president}
              onChange={(e) => update("board_president", e.target.value)}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Used in email signatures"
            />
          </div>
        </div>

        {/* Logo */}
        <div>
          <label className="text-sm font-medium">Logo</label>
          <div className="mt-2 flex items-center gap-4">
            {form.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logo_url}
                alt="HOA Logo"
                className="h-16 w-16 rounded-lg border object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border bg-gray-50 text-gray-400">
                <Building2 className="h-8 w-8" />
              </div>
            )}
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={pending}
              className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              <Upload className="h-4 w-4" /> Upload Logo
            </button>
            <input
              ref={logoRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-4">
          <button
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save Changes"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Tab 2: User Management ─────────────────────────────── */

function UserManagementTab({
  profiles,
  currentUserId,
}: {
  profiles: Profile[]
  currentUserId: string
}) {
  const [pending, startTransition] = useTransition()
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<string>("resident")
  const [editingRole, setEditingRole] = useState<string | null>(null)

  function handleRoleChange(userId: string, role: string) {
    startTransition(async () => {
      const result = await updateUserRole(
        userId,
        role as "admin" | "board" | "resident" | "vendor"
      )
      if (result.error) alert(result.error)
      setEditingRole(null)
    })
  }

  function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Deactivate "${name}"? They will no longer be able to log in.`))
      return
    startTransition(async () => {
      const result = await deactivateUser(userId)
      if (result.error) alert(result.error)
    })
  }

  function handleDelete(userId: string, name: string) {
    if (
      !confirm(
        `Permanently delete "${name}"? This removes them from the system entirely and cannot be undone.`
      )
    )
      return
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) alert(result.error)
    })
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await inviteUser(inviteEmail, inviteRole)
      if (result.error) alert(result.error)
      else {
        setInviteEmail("")
        setShowInvite(false)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="text-base">User Management</CardTitle>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" /> Invite User
        </button>
      </CardHeader>
      <CardContent>
        {showInvite && (
          <form
            onSubmit={handleInvite}
            className="mb-4 flex items-end gap-3 rounded-lg border bg-gray-50 p-4"
          >
            <div className="flex-1">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                placeholder="user@example.com"
                className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="mt-1 rounded-md border px-3 py-2 text-sm"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send Invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </form>
        )}

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const isMe = p.id === currentUserId
                const roleColor =
                  ROLE_COLORS[p.role || "resident"] || ROLE_COLORS.resident
                return (
                  <tr key={p.id} className="border-b">
                    <td className="px-4 py-3 font-medium">
                      {p.full_name || "—"}
                      {isMe && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {p.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {editingRole === p.id ? (
                        <select
                          value={p.role || "resident"}
                          onChange={(e) =>
                            handleRoleChange(p.id, e.target.value)
                          }
                          onBlur={() => setEditingRole(null)}
                          autoFocus
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleColor}`}
                        >
                          {(p.role || "resident").charAt(0).toUpperCase() +
                            (p.role || "resident").slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        timeZone: "UTC",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {!isMe && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingRole(p.id)}
                            disabled={pending}
                            className="rounded p-1 hover:bg-gray-100"
                            title="Edit role"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeactivate(p.id, p.full_name || p.email || "")
                            }
                            disabled={pending}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            title="Deactivate user"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(p.id, p.full_name || p.email || "")
                            }
                            disabled={pending}
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                            title="Delete user permanently"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Tab 3: Email Templates ─────────────────────────────── */

function EmailTemplatesTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Manage email templates used for violation notices, welcome letters,
          announcements, and more.
        </p>
        <Link
          href="/dashboard/email"
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" /> Go to Email Center
        </Link>
      </CardContent>
    </Card>
  )
}

/* ── Tab 4: Violation Categories ─────────────────────────── */

function ViolationCategoriesTab({
  categories: initial,
}: {
  categories: ViolationCategoryConfig[]
}) {
  const [categories, setCategories] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [newName, setNewName] = useState("")

  function addCategory() {
    if (!newName.trim()) return
    setCategories((prev) => [
      ...prev,
      { name: newName.trim(), default_severity: "medium", due_date_offset_days: 14 },
    ])
    setNewName("")
    setSaved(false)
  }

  function removeCategory(idx: number) {
    setCategories((prev) => prev.filter((_, i) => i !== idx))
    setSaved(false)
  }

  function updateCategory(
    idx: number,
    field: keyof ViolationCategoryConfig,
    value: string | number
  ) {
    setCategories((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    )
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSettings("violation_categories", categories)
      if (result.error) alert(result.error)
      else setSaved(true)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Violation Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                <th className="px-4 py-3">Category Name</th>
                <th className="px-4 py-3">Default Severity</th>
                <th className="px-4 py-3">Due Date Offset (days)</th>
                <th className="px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, idx) => (
                <tr key={idx} className="border-b">
                  <td className="px-4 py-2">
                    <input
                      value={cat.name}
                      onChange={(e) =>
                        updateCategory(idx, "name", e.target.value)
                      }
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <select
                      value={cat.default_severity}
                      onChange={(e) =>
                        updateCategory(idx, "default_severity", e.target.value)
                      }
                      className="rounded border px-2 py-1 text-sm"
                    >
                      {SEVERITY_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={1}
                      value={cat.due_date_offset_days}
                      onChange={(e) =>
                        updateCategory(
                          idx,
                          "due_date_offset_days",
                          parseInt(e.target.value) || 14
                        )
                      }
                      className="w-20 rounded border px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => removeCategory(idx)}
                      className="rounded p-1 text-red-500 hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            placeholder="New category name..."
            className="rounded-md border px-3 py-2 text-sm"
          />
          <button
            onClick={addCategory}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <button
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save Categories"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Tab 5: HOA Dues Settings ────────────────────────────── */

function DuesSettingsTab({ settings: initial }: { settings: DuesSettings }) {
  const [form, setForm] = useState(initial)
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function update(field: keyof DuesSettings, value: number) {
    setForm((f) => ({ ...f, [field]: value }))
    setSaved(false)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateSettings("dues_settings", form)
      if (result.error) alert(result.error)
      else setSaved(true)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">HOA Dues Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium">
              Default Due Amount (per quarter)
            </label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.default_amount}
                onChange={(e) =>
                  update("default_amount", parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-md border pl-7 pr-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Grace Period (days)</label>
            <input
              type="number"
              min={0}
              value={form.grace_period_days}
              onChange={(e) =>
                update("grace_period_days", parseInt(e.target.value) || 0)
              }
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Late Fee Amount</label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.late_fee_amount}
                onChange={(e) =>
                  update("late_fee_amount", parseFloat(e.target.value) || 0)
                }
                className="w-full rounded-md border pl-7 pr-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t pt-4">
          <button
            onClick={handleSave}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {pending ? "Saving..." : "Save Dues Settings"}
          </button>
          {saved && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Tab 6: Audit Log ────────────────────────────────────── */

function AuditLogTab({ entries }: { entries: AuditEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Audit Log</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No audit entries yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left text-muted-foreground">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Who</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {entry.user_name || "System"}
                    </td>
                    <td className="px-4 py-3">{entry.action}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {entry.entity_type && (
                        <span className="text-xs">
                          {entry.entity_type}
                          {entry.entity_id && (
                            <span className="ml-1 font-mono text-[10px]">
                              {entry.entity_id.slice(0, 8)}
                            </span>
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/* ── Main Settings View ──────────────────────────────────── */

export function SettingsView({
  hoaProfile,
  duesSettings,
  violationCategories,
  profiles,
  auditLog,
  currentUserId,
}: {
  hoaProfile: HoaProfile
  duesSettings: DuesSettings
  violationCategories: ViolationCategoryConfig[]
  profiles: Profile[]
  auditLog: AuditEntry[]
  currentUserId: string
}) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-1">
            <Building2 className="h-4 w-4" /> HOA Profile
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-1">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-1">
            <Mail className="h-4 w-4" /> Email Templates
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-1">
            <AlertTriangle className="h-4 w-4" /> Violations
          </TabsTrigger>
          <TabsTrigger value="dues" className="gap-1">
            <DollarSign className="h-4 w-4" /> Dues
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <ClipboardList className="h-4 w-4" /> Audit Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <HoaProfileTab profile={hoaProfile} />
        </TabsContent>
        <TabsContent value="users">
          <UserManagementTab
            profiles={profiles}
            currentUserId={currentUserId}
          />
        </TabsContent>
        <TabsContent value="email">
          <EmailTemplatesTab />
        </TabsContent>
        <TabsContent value="categories">
          <ViolationCategoriesTab categories={violationCategories} />
        </TabsContent>
        <TabsContent value="dues">
          <DuesSettingsTab settings={duesSettings} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogTab entries={auditLog} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
