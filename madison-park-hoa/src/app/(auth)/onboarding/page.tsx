"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Building, Building2, Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createWorkspaceAction } from "@/app/(auth)/actions"
import { setActiveWorkspaceAction } from "@/app/actions/hub"

const MODULES = [
  { key: "hoa", name: "HOA Hub", icon: Building2, blurb: "Run an HOA." },
  { key: "property", name: "Property Management", icon: Building, blurb: "Manage rentals." },
  { key: "eviction", name: "Eviction Hub", icon: Gavel, blurb: "Workflow per jurisdiction." },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [name, setName] = useState("")
  const [type, setType] = useState("homeowner")
  const [selected, setSelected] = useState<string[]>(["property"])

  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selected.length === 0) {
      toast.error("Pick at least one module to get started.")
      return
    }
    start(async () => {
      const fd = new FormData()
      fd.set("name", name)
      fd.set("type", type)
      selected.forEach((m) => fd.append("modules", m))
      const res = await createWorkspaceAction(fd)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      if (res?.slug) await setActiveWorkspaceAction(res.slug)
      router.push("/hub")
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Set up your workspace</CardTitle>
          <CardDescription>
            Name your workspace and pick the modules you want to start with.
            You can add or remove modules anytime.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Properties"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Workspace type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="homeowner">Individual homeowner</SelectItem>
                  <SelectItem value="property_manager">Property manager</SelectItem>
                  <SelectItem value="hoa">Homeowners association</SelectItem>
                  <SelectItem value="law_firm">Law firm</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Modules to enable (14-day trial)</Label>
              <div className="grid gap-3 md:grid-cols-3">
                {MODULES.map((m) => {
                  const active = selected.includes(m.key)
                  const Icon = m.icon
                  return (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => toggle(m.key)}
                      className={`rounded-lg border p-4 text-left transition ${
                        active ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="mt-2 font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.blurb}</div>
                    </button>
                  )
                })}
              </div>
            </div>
            <Button type="submit" disabled={pending || !name}>
              {pending ? "Creating…" : "Create workspace"}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
