"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { submitLead } from "@/app/actions/leads"
import { toast } from "sonner"

export function LeadForm() {
  const [pending, start] = useTransition()
  const [interest, setInterest] = useState<string>("hoa")

  return (
    <form
      className="grid gap-4 rounded-lg border bg-background p-6"
      action={(formData) => {
        formData.set("interest", interest)
        start(async () => {
          const res = await submitLead(formData)
          if (res?.error) toast.error(res.error)
          else toast.success("Thanks! We'll be in touch shortly.")
        })
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="grid gap-2">
        <Label>I&apos;m interested in</Label>
        <Select value={interest} onValueChange={setInterest}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hoa">HOA Hub</SelectItem>
            <SelectItem value="property">Property Management</SelectItem>
            <SelectItem value="eviction">Eviction Hub</SelectItem>
            <SelectItem value="all">All three</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="message">Tell us about your portfolio</Label>
        <Textarea id="message" name="message" rows={3} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request a demo"}
      </Button>
    </form>
  )
}
