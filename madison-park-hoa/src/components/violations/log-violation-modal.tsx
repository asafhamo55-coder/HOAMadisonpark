"use client"

import { useState, useMemo, useRef } from "react"
import { format, addDays } from "date-fns"
import {
  AlertTriangle,
  Loader2,
  Upload,
  X,
  ImageIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
  VIOLATION_CATEGORIES,
  SEVERITY_OPTIONS,
  violationFormSchema,
} from "@/lib/schemas/violation"
import {
  createViolationAction,
  uploadViolationPhotos,
} from "@/app/actions/violations"

type PropertyOption = {
  id: string
  address: string
}

type ResidentOption = {
  id: string
  full_name: string
  property_id: string
}

interface LogViolationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  properties: PropertyOption[]
  residents: ResidentOption[]
}

export function LogViolationModal({
  open,
  onOpenChange,
  properties,
  residents,
}: LogViolationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [propertyId, setPropertyId] = useState("")
  const [propertySearch, setPropertySearch] = useState("")
  const [residentId, setResidentId] = useState("")
  const [category, setCategory] = useState("")
  const [severity, setSeverity] = useState<string>("medium")
  const [description, setDescription] = useState("")
  const [reportedDate, setReportedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  )
  const [dueDate, setDueDate] = useState(
    format(addDays(new Date(), 30), "yyyy-MM-dd")
  )
  const [notes, setNotes] = useState("")
  const [autoSendNotice, setAutoSendNotice] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  // Filtered properties for search
  const filteredProperties = useMemo(() => {
    if (!propertySearch) return properties
    const q = propertySearch.toLowerCase()
    return properties.filter((p) => p.address.toLowerCase().includes(q))
  }, [properties, propertySearch])

  // Auto-populate residents for selected property
  const propertyResidents = useMemo(
    () => residents.filter((r) => r.property_id === propertyId),
    [residents, propertyId]
  )

  function resetForm() {
    setPropertyId("")
    setPropertySearch("")
    setResidentId("")
    setCategory("")
    setSeverity("medium")
    setDescription("")
    setReportedDate(format(new Date(), "yyyy-MM-dd"))
    setDueDate(format(addDays(new Date(), 30), "yyyy-MM-dd"))
    setNotes("")
    setAutoSendNotice(false)
    setPhotos([])
    setErrors({})
  }

  function handlePropertyChange(id: string) {
    setPropertyId(id)
    setResidentId("")
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const valid = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} is not an image file`)
        return false
      }
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 10MB limit`)
        return false
      }
      return true
    })
    setPhotos((prev) => [...prev, ...valid].slice(0, 5))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    const values = {
      property_id: propertyId,
      resident_id: residentId || undefined,
      category,
      severity,
      description,
      reported_date: reportedDate,
      due_date: dueDate || undefined,
      notes: notes || undefined,
      auto_send_notice: autoSendNotice,
    }

    // Client-side validation
    const parsed = violationFormSchema.safeParse(values)
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {}
      parsed.error.issues.forEach((err) => {
        const field = err.path[0] as string
        if (!fieldErrors[field]) fieldErrors[field] = err.message
      })
      setErrors(fieldErrors)
      return
    }

    setLoading(true)

    // Upload photos first if any
    let photoKeys: string[] = []
    if (photos.length > 0) {
      const formData = new FormData()
      photos.forEach((f) => formData.append("photos", f))
      const uploadResult = await uploadViolationPhotos(formData)
      if (uploadResult.error) {
        toast.error(uploadResult.error)
        setLoading(false)
        return
      }
      photoKeys = uploadResult.keys
    }

    // Create the violation record
    const result = await createViolationAction(values, photoKeys)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(
        autoSendNotice
          ? "Violation logged & notice sent"
          : "Violation logged successfully"
      )
      resetForm()
      onOpenChange(false)
    }
    setLoading(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Log New Violation
            </span>
          </DialogTitle>
          <DialogDescription>
            Record a new violation against a property. Fields marked with * are
            required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Property — searchable */}
          <div className="space-y-2">
            <Label>Property *</Label>
            <Input
              placeholder="Search properties..."
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
              className="mb-1"
            />
            <Select value={propertyId} onValueChange={handlePropertyChange}>
              <SelectTrigger
                className={cn(errors.property_id && "border-red-500")}
              >
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {filteredProperties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.property_id && (
              <p className="text-xs text-red-500">{errors.property_id}</p>
            )}
          </div>

          {/* Resident — auto-populated from property */}
          {propertyResidents.length > 0 && (
            <div className="space-y-2">
              <Label>Resident</Label>
              <Select value={residentId} onValueChange={setResidentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select resident (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  {propertyResidents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  className={cn(errors.category && "border-red-500")}
                >
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {VIOLATION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-red-500">{errors.category}</p>
              )}
            </div>

            {/* Severity — radio-style */}
            <div className="space-y-2">
              <Label>Severity *</Label>
              <div className="flex gap-2 pt-1">
                {SEVERITY_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors",
                      severity === s
                        ? s === "low"
                          ? "border-blue-500 bg-blue-500/10 text-blue-700"
                          : s === "medium"
                            ? "border-amber-500 bg-amber-500/10 text-amber-700"
                            : "border-red-500 bg-red-500/10 text-red-700"
                        : "border-input bg-background hover:bg-muted/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.severity && (
                <p className="text-xs text-red-500">{errors.severity}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the violation in detail (min 20 characters)..."
              rows={4}
              className={cn(errors.description && "border-red-500")}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.description ? (
                <p className="text-red-500">{errors.description}</p>
              ) : (
                <span />
              )}
              <span>{description.length}/2000</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Reported Date */}
            <div className="space-y-2">
              <Label>Reported Date *</Label>
              <Input
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                className={cn(errors.reported_date && "border-red-500")}
              />
              {errors.reported_date && (
                <p className="text-xs text-red-500">{errors.reported_date}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Defaults to 30 days from today
              </p>
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photos (max 5, 10MB each)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((file, i) => (
                <div
                  key={i}
                  className="group relative flex h-20 w-20 items-center justify-center rounded-md border bg-muted/30"
                >
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="absolute bottom-0 left-0 right-0 truncate px-1 text-[9px] text-muted-foreground">
                    {file.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute -right-1.5 -top-1.5 rounded-full border bg-background p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground/50 hover:text-foreground"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-[10px]">Upload</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes (not shared with resident)..."
              rows={2}
            />
          </div>

          {/* Auto-send notice */}
          <div className="flex items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              id="auto_send_notice"
              checked={autoSendNotice}
              onChange={(e) => setAutoSendNotice(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <div>
              <label
                htmlFor="auto_send_notice"
                className="text-sm font-medium cursor-pointer"
              >
                Auto-send violation notice
              </label>
              <p className="text-xs text-muted-foreground">
                Sends an email notice to the resident and sets status to
                &quot;Notice Sent&quot;
              </p>
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
              Log Violation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
