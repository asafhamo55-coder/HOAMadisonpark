"use client"

import { useState, useTransition } from "react"
import {
  User,
  Phone,
  Mail,
  Lock,
  Car,
  PawPrint,
  Plus,
  X,
  Save,
  Calendar,
  Shield,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import type { AccountData } from "./page"
import {
  updateProfile,
  changePassword,
  updateVehiclesAndPets,
} from "@/app/actions/portal"

/* ── Contact Info ─────────────────────────────────────────── */

function ContactSection({ profile }: { profile: AccountData["profile"] }) {
  const [phone, setPhone] = useState(profile.phone || "")
  const [email, setEmail] = useState(profile.email || "")
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateProfile({ phone, email })
      if (result.error) toast.error(result.error)
      else toast.success("Contact info updated")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4 text-blue-600" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            value={profile.full_name || ""}
            disabled
            className="mt-1 w-full rounded-md border bg-gray-50 px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-md border pl-9 pr-3 py-2 text-sm"
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </CardContent>
    </Card>
  )
}

/* ── Change Password ─────────────────────────────────────── */

function PasswordSection() {
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [pending, startTransition] = useTransition()

  function handleChange() {
    if (newPwd.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match")
      return
    }
    startTransition(async () => {
      const result = await changePassword(newPwd)
      if (result.error) toast.error(result.error)
      else {
        toast.success("Password updated")
        setNewPwd("")
        setConfirmPwd("")
      }
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lock className="h-4 w-4 text-yellow-600" />
          Change Password
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-medium">New Password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Minimum 8 characters"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm Password</label>
          <input
            type="password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={handleChange}
          disabled={pending || !newPwd || !confirmPwd}
          className="inline-flex items-center gap-1 rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        >
          <Lock className="h-4 w-4" />
          {pending ? "Updating..." : "Update Password"}
        </button>
      </CardContent>
    </Card>
  )
}

/* ── Vehicles & Pets ─────────────────────────────────────── */

function ListEditor({
  label,
  icon: Icon,
  items: initial,
  placeholder,
  onChange,
}: {
  label: string
  icon: React.ElementType
  items: string[]
  placeholder: string
  onChange: (items: string[]) => void
}) {
  const [items, setItems] = useState(initial)
  const [newItem, setNewItem] = useState("")

  function add() {
    if (!newItem.trim()) return
    const updated = [...items, newItem.trim()]
    setItems(updated)
    onChange(updated)
    setNewItem("")
  }

  function remove(idx: number) {
    const updated = items.filter((_, i) => i !== idx)
    setItems(updated)
    onChange(updated)
  }

  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium mb-2">
        <Icon className="h-4 w-4" /> {label}
      </label>
      {items.length > 0 && (
        <div className="mb-2 space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded border px-3 py-1.5 text-sm"
            >
              <span>{item}</span>
              <button
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={placeholder}
          className="flex-1 rounded-md border px-3 py-1.5 text-sm"
        />
        <button
          onClick={add}
          disabled={!newItem.trim()}
          className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>
    </div>
  )
}

function VehiclesPetsSection({
  resident,
}: {
  resident: NonNullable<AccountData["resident"]>
}) {
  const [vehicles, setVehicles] = useState(resident.vehicles)
  const [pets, setPets] = useState(resident.pets)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      const result = await updateVehiclesAndPets({ vehicles, pets })
      if (result.error) toast.error(result.error)
      else toast.success("Vehicles and pets updated")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-green-600" />
          Vehicle &amp; Pet Registration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ListEditor
          label="Vehicles"
          icon={Car}
          items={vehicles}
          placeholder="e.g., 2023 Honda Civic Silver ABC-1234"
          onChange={setVehicles}
        />
        <ListEditor
          label="Pets"
          icon={PawPrint}
          items={pets}
          placeholder="e.g., Golden Retriever, Max, 60 lbs"
          onChange={setPets}
        />
        <button
          onClick={handleSave}
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {pending ? "Saving..." : "Save Registration"}
        </button>
      </CardContent>
    </Card>
  )
}

/* ── Main View ───────────────────────────────────────────── */

export function AccountView({ data }: { data: AccountData }) {
  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <h1 className="text-2xl font-bold">My Account</h1>

      {/* Resident info summary */}
      {data.resident && (
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {data.resident.type && (
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              {data.resident.type.charAt(0).toUpperCase() +
                data.resident.type.slice(1)}
            </span>
          )}
          {data.resident.move_in_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Since {new Date(data.resident.move_in_date).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
            </span>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <ContactSection profile={data.profile} />
          <PasswordSection />
        </div>
        <div>
          {data.resident ? (
            <VehiclesPetsSection resident={data.resident} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No resident record linked to your account.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
