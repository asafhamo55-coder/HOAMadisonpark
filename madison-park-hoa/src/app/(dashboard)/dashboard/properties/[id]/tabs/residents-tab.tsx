"use client"

import { useState } from "react"
import { format } from "date-fns"
import {
  Plus,
  Pencil,
  Phone,
  Mail,
  Car,
  PawPrint,
  ChevronDown,
  User,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { addResident, updateResident } from "../actions"

const typeColors: Record<string, string> = {
  owner: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20",
  tenant: "bg-blue-500/10 text-blue-700 border-blue-500/20",
  "co-owner": "bg-purple-500/10 text-purple-700 border-purple-500/20",
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

      {/* Former Residents */}
      {formerResidents.length > 0 && (
        <Collapsible open={formerOpen} onOpenChange={setFormerOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="text-sm font-semibold">
                Former Residents ({formerResidents.length})
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
                      <span className="font-medium">{r.full_name}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${typeColors[r.type] || ""}`}
                      >
                        {r.type}
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
  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{resident.full_name}</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${typeColors[resident.type] || ""}`}
                >
                  {resident.type}
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

              {(resident.vehicles?.length || resident.pets?.length) && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  {resident.vehicles && resident.vehicles.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {resident.vehicles.join(", ")}
                    </span>
                  )}
                  {resident.pets && resident.pets.length > 0 && (
                    <span className="flex items-center gap-1">
                      <PawPrint className="h-3 w-3" />
                      {resident.pets.join(", ")}
                    </span>
                  )}
                </div>
              )}
            </div>

            {canManage && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={onEdit}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
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
  const [resType, setResType] = useState<string>(resident?.type || "owner")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set("type", resType)

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
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={resident?.full_name}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={resident?.email || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={resident?.phone || ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={resType} onValueChange={setResType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="tenant">Tenant</SelectItem>
                  <SelectItem value="co-owner">Co-Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="move_in_date">Move-in Date</Label>
              <Input
                id="move_in_date"
                name="move_in_date"
                type="date"
                defaultValue={resident?.move_in_date || ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="vehicles">Vehicles (comma-separated)</Label>
              <Input
                id="vehicles"
                name="vehicles"
                defaultValue={resident?.vehicles?.join(", ") || ""}
                placeholder="ABC1234, XYZ5678"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pets">Pets (comma-separated)</Label>
              <Input
                id="pets"
                name="pets"
                defaultValue={resident?.pets?.join(", ") || ""}
                placeholder="Golden Retriever, Tabby Cat"
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
