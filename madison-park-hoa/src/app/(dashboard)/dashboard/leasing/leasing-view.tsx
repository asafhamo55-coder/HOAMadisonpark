"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Plus,
  Key,
  Home,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  addToWaitlist,
  removeFromWaitlist,
  approveFromWaitlist,
  type WaitlistEntry,
  type LeasingStats,
} from "@/app/actions/leasing-waitlist"

export function LeasingView({
  waitlist,
  stats,
  properties,
}: {
  waitlist: WaitlistEntry[]
  stats: LeasingStats
  properties: { id: string; address: string }[]
}) {
  const [addOpen, setAddOpen] = useState(false)
  const capReached = stats.openLeasingPercent >= 15

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{stats.totalProperties}</p>
          </CardContent>
        </Card>

        <Card className={cn("border-l-4", capReached ? "border-l-red-500" : "border-l-emerald-500")}>
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Currently Rented
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{stats.openLeasingCount}</p>
              <span className={cn("text-sm font-medium", capReached ? "text-red-600" : "text-emerald-600")}>
                ({stats.openLeasingPercent}% of 15% cap)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Max Allowed (15%)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{stats.maxAllowed}</p>
              <span className="text-sm text-muted-foreground">
                ({stats.spotsAvailable} spots available)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              On Waiting List
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold">{stats.waitlistCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cap Warning */}
      {capReached && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">Leasing Cap Reached</p>
            <p className="text-sm text-red-700">
              The community has reached or exceeded the 15% Open Leasing cap per Article 11 of the Declaration.
              No additional properties may be converted to rental status until a spot becomes available.
            </p>
          </div>
        </div>
      )}

      {/* Waiting List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Leasing Waiting List ({waitlist.length})
          </h2>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add to Waitlist
          </Button>
        </div>

        {waitlist.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              No properties on the waiting list.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {waitlist.map((entry, index) => (
              <WaitlistCard
                key={entry.id}
                entry={entry}
                position={index + 1}
                canApprove={stats.spotsAvailable > 0}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add to Waitlist Dialog */}
      <AddToWaitlistDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        properties={properties}
      />
    </div>
  )
}

function WaitlistCard({
  entry,
  position,
  canApprove,
}: {
  entry: WaitlistEntry
  position: number
  canApprove: boolean
}) {
  const [removing, setRemoving] = useState(false)
  const [approving, setApproving] = useState(false)

  async function handleRemove() {
    if (!confirm("Remove this property from the waiting list?")) return
    setRemoving(true)
    const result = await removeFromWaitlist(entry.id)
    if (result.error) toast.error(result.error)
    else toast.success("Removed from waiting list")
    setRemoving(false)
  }

  async function handleApprove() {
    if (!confirm(`Approve ${entry.owner_name} for leasing? This will change the property to rental status.`)) return
    setApproving(true)
    const result = await approveFromWaitlist(entry.id)
    if (result.error) toast.error(result.error)
    else toast.success("Approved for leasing")
    setApproving(false)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-700">
              #{position}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{entry.owner_name}</span>
                <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                  Waiting
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Home className="h-3 w-3" />
                {entry.property_address}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {entry.owner_email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {entry.owner_email}
                  </span>
                )}
                {entry.owner_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {entry.owner_phone}
                  </span>
                )}
                <span>
                  Requested {format(new Date(entry.requested_at), "MMM d, yyyy")}
                </span>
              </div>
              {entry.reason && (
                <p className="text-xs text-muted-foreground mt-1">
                  <strong>Reason:</strong> {entry.reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {canApprove && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                Approve
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <XCircle className="mr-1 h-3 w-3" />
              )}
              Remove
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AddToWaitlistDialog({
  open,
  onOpenChange,
  properties,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: { id: string; address: string }[]
}) {
  const [loading, setLoading] = useState(false)
  const [propertyId, setPropertyId] = useState("")
  const [search, setSearch] = useState("")

  const filtered = search
    ? properties.filter((p) => p.address.toLowerCase().includes(search.toLowerCase()))
    : properties

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("property_id", propertyId)

    const result = await addToWaitlist(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Added to waiting list")
      onOpenChange(false)
      setPropertyId("")
      setSearch("")
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Add to Leasing Waitlist
          </DialogTitle>
          <DialogDescription>
            Add a property owner to the leasing waiting list. They will be notified when a spot becomes available.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Property *</Label>
            <Input
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-1"
            />
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger>
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filtered.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="owner_name">Owner Name *</Label>
              <Input id="owner_name" name="owner_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_email">Owner Email</Label>
              <Input id="owner_email" name="owner_email" type="email" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner_phone">Owner Phone</Label>
            <Input id="owner_phone" name="owner_phone" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Request</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="e.g. Relocating for work, hardship, etc."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !propertyId}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add to Waitlist
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
