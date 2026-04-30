"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  addPropertyAction,
  editPropertyAction,
  type AddPropertyInput,
} from "@/app/actions/properties"

const PROPERTY_TYPES = [
  "Single Family",
  "Townhouse",
  "Condo",
  "Apartment",
  "Other",
]

type PropertyFormData = AddPropertyInput & { id?: string }

export function AddPropertyModal({
  open,
  onOpenChange,
  editData,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editData?: {
    id: string
    address_line1: string | null
    address_line2: string | null
    city: string | null
    state: string | null
    zip: string | null
    country: string | null
    property_type: string | null
    status: string
    lot_number: string | null
    notes: string | null
  } | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const isEdit = !!editData

  const defaultForm: PropertyFormData = {
    address_line1: "",
    address_line2: "",
    city: "Johns Creek",
    state: "GA",
    zip_code: "30022",
    country: "USA",
    property_type: "Single Family",
    status: "occupied",
    lot_number: "",
    notes: "",
  }

  const [form, setForm] = useState<PropertyFormData>(defaultForm)

  useEffect(() => {
    if (editData) {
      setForm({
        address_line1: editData.address_line1 || "",
        address_line2: editData.address_line2 || "",
        city: editData.city || "Johns Creek",
        state: editData.state || "GA",
        zip_code: editData.zip || "30022",
        country: editData.country || "USA",
        property_type: editData.property_type || "Single Family",
        status: (editData.status as AddPropertyInput["status"]) || "occupied",
        lot_number: editData.lot_number || "",
        notes: editData.notes || "",
      })
    } else {
      setForm(defaultForm)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editData, open])

  function updateField<K extends keyof PropertyFormData>(
    key: K,
    value: PropertyFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.address_line1.trim()) {
      toast.error("Street address is required")
      return
    }
    if (!form.city.trim()) {
      toast.error("City is required")
      return
    }
    if (!form.state.trim()) {
      toast.error("State is required")
      return
    }
    if (!form.zip_code.trim()) {
      toast.error("ZIP code is required")
      return
    }

    setLoading(true)

    let result
    if (isEdit && editData) {
      result = await editPropertyAction({ ...form, id: editData.id })
    } else {
      result = await addPropertyAction(form)
    }

    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? "Property updated" : "Property added successfully")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Property" : "Add Property"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the property details."
              : "Add a new property to the community directory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">
              Street Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address_line1"
              placeholder="123 Madison Park Dr"
              value={form.address_line1}
              onChange={(e) => updateField("address_line1", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                placeholder="Unit, Apt, Suite..."
                value={form.address_line2}
                onChange={(e) => updateField("address_line2", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lot_number">Lot #</Label>
              <Input
                id="lot_number"
                placeholder="e.g. 42"
                value={form.lot_number}
                onChange={(e) => updateField("lot_number", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">
                State <span className="text-red-500">*</span>
              </Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip_code">
                ZIP <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zip_code"
                value={form.zip_code}
                onChange={(e) => updateField("zip_code", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Property Type</Label>
              <Select
                value={form.property_type}
                onValueChange={(v) => updateField("property_type", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) =>
                updateField("status", v as AddPropertyInput["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="occupied">Occupied</SelectItem>
                <SelectItem value="vacant">Vacant</SelectItem>
                <SelectItem value="rental">Rental</SelectItem>
                <SelectItem value="foreclosure">Foreclosure</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save Changes" : "Add Property"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
