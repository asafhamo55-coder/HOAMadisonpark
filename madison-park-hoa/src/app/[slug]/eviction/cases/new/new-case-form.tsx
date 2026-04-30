"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createEvCaseAction } from "../../actions"

export function NewCaseForm({
  jurisdictions,
}: {
  jurisdictions: { id: string; display_name: string }[]
}) {
  const [pending, start] = useTransition()
  const [jurisdictionId, setJurisdictionId] = useState(jurisdictions[0]?.id ?? "")
  const [reason, setReason] = useState("non_payment")

  return (
    <form
      action={(fd) => {
        fd.set("jurisdiction_id", jurisdictionId)
        fd.set("reason", reason)
        start(async () => {
          const res = await createEvCaseAction(fd)
          if (res?.error) toast.error(res.error)
        })
      }}
      className="grid gap-4"
    >
      <div className="grid gap-2">
        <Label>Jurisdiction</Label>
        <Select value={jurisdictionId} onValueChange={setJurisdictionId}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {jurisdictions.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenant_name">Tenant name</Label>
        <Input id="tenant_name" name="tenant_name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="tenant_email">Tenant email</Label>
        <Input id="tenant_email" name="tenant_email" type="email" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="property_address">Property address</Label>
        <Input id="property_address" name="property_address" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Input id="unit" name="unit" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rent_owed">Rent owed</Label>
          <Input id="rent_owed" name="rent_owed" type="number" step="0.01" />
        </div>
      </div>
      <div className="grid gap-2">
        <Label>Reason</Label>
        <Select value={reason} onValueChange={setReason}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="non_payment">Non-payment of rent</SelectItem>
            <SelectItem value="lease_violation">Lease violation</SelectItem>
            <SelectItem value="holdover">Holdover</SelectItem>
            <SelectItem value="illegal_activity">Illegal activity</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={pending || !jurisdictionId}>
        {pending ? "Creating…" : "Create case"}
      </Button>
    </form>
  )
}
