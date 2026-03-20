"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Plus,
  Pencil,
  Phone,
  Mail,
  ChevronDown,
  User,
  Loader2,
  LogOut,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Resident } from "../detail-data"
import { addResident, updateResident, moveOutResident } from "../actions"

const RELATIONSHIPS = [
  "Primary Owner",
  "Co-Owner",
  "Spouse",
  "Tenant",
  "Other",
]

const relationshipColors: Record<string, string> = {
  "Primary Owner": "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  "Co-Owner": "bg-purple-500/10 text-purple-700 border-purple-500/20",
  Spouse: "bg-pink-500/10 text-pink-700 border-pink-500/20",
  Tenant: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  Other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

export function ResidentsTab({
  propertyId,
  currentResidents,
  formerResidents,
  canManage,
}: {
  propertyId: string
  currentResidents: Resident[]
  formerResidents: Resident[]
  canManage: boolean
}) {
  const [addOpen, setAddOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formerOpen, setFormerOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Current Residents */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Current Residents ({currentResidents.length})
        </h3>
        {canManage && (
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Resident
          </Button>
        )}
      </div>

      {currentResidents.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No current residents on record.
        </p>
      ) : (
        <div className="space-y-3">
          {currentResidents.map((r) => (
            <ResidentCard
              key={r.id}
              resident={r}
              propertyId={propertyId}
              canManage={canManage}
              isEditing={editId === r.id}
              onEdit={() => setEditId(r.id)}
              onClose={() => setEditId(null)}
            />
          ))}
        </div>
      )}

      {/* Resident History */}
      {formerResidents.length > 0 && (
        <Collapsible open={formerOpen} onOpenChange={setFormerOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm font-semibold">
                Resident History ({formerResidents.length})
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${formerOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-2">
            {formerResidents.map((r) => (
              <Card key={r.id} className="opacity-60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {r.first_name && r.last_name
                          ? `${r.first_name} ${r.last_name}`
                          : r.full_name}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${relationshipColors[r.relationship] || relationshipColors.Other}`}
                      >
                        {r.relationship || r.type}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {r.move_in_date &&
                        format(new Date(r.move_in_date), "MMM yyyy")}
                      {r.move_in_date && r.move_out_date && " — "}
                      {r.move_out_date &&
                        format(new Date(r.move_out_date), "MMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Add Resident Dialog */}
      <ResidentFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        propertyId={propertyId}
        title="Add Resident"
      />
    </div>
  )
}

function ResidentCard({
  resident,
  propertyId,
  canManage,
  isEditing,
  onEdit,
  onClose,
}: {
  resident: Resident
  propertyId: string
  canManage: boolean
  isEditing: boolean
  onEdit: () => void
  onClose: () => void
}) {
  const [movingOut, setMovingOut] = useState(false)

  async function handleMoveOut() {
    if (!confirm("Are you sure you want to move out this resident? This will set their status to 'former' with today's date.")) {
      return
    }
    setMovingOut(true)
    const result = await moveOutResident(resident.id, propertyId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`${resident.first_name || resident.full_name} has been moved out`)
    }
    setMovingOut(false)
  }

  const displayName = resident.first_name && resident.last_name
    ? `${resident.first_name} ${resident.last_name}`
    : resident.full_name

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{displayName}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${relationshipColors[resident.relationship] || relationshipColors.Other}`}
                >
                  {resident.relationship || resident.type}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {resident.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {resident.phone}
                  </span>
                )}
                {resident.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {resident.email}
                  </span>
                )}
                {resident.move_in_date && (
                  <span>
                    Since{" "}
                    {format(new Date(resident.move_in_date), "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>

            {canManage && (
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onEdit}
                  title="Edit resident"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={handleMoveOut}
                  disabled={movingOut}
                  title="Move out resident"
                >
                  {movingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ResidentFormDialog
        open={isEditing}
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        propertyId={propertyId}
        title="Edit Resident"
        resident={resident}
      />
    </>
  )
}

function ResidentFormDialog({
  open,
  onOpenChange,
  propertyId,
  title,
  resident,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyId: string
  title: string
  resident?: Resident
}) {
  const [loading, setLoading] = useState(false)
  const [relationship, setRelationship] = useState<string>(
    resident?.relationship || "Primary Owner"
  )

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("relationship", relationship)

    let result
    if (resident) {
      result = await updateResident(resident.id, propertyId, formData)
    } else {
      formData.set("property_id", propertyId)
      result = await addResident(formData)
    }

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(resident ? "Resident updated" : "Resident added")
      onOpenChange(false)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {resident
              ? "Update resident information."
              : "Add a new resident to this property."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="first_name"
                name="first_name"
                defaultValue={resident?.first_name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="last_name"
                name="last_name"
                defaultValue={resident?.last_name || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={resident?.phone || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={resident?.email || ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="move_in_date">
                Move-in Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="move_in_date"
                name="move_in_date"
                type="date"
                defaultValue={resident?.move_in_date || ""}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={resident?.notes || ""}
                placeholder="Optional notes about this resident..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {resident ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
