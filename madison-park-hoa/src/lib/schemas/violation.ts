import { z } from "zod"

export const VIOLATION_CATEGORIES = [
  "Landscaping",
  "Parking",
  "Vehicles/Parking",
  "Noise",
  "Trash",
  "Exterior",
  "Pets",
  "Signage",
  "Structure",
  "Fence/Wall",
  "Holiday Decorations",
  "Unapproved Modification",
  "Drainage",
  "Trees",
  "Leasing Violation",
  "Swimming Pool",
  "Other",
] as const

export const SEVERITY_OPTIONS = ["low", "medium", "high"] as const

export const violationFormSchema = z.object({
  property_id: z.string().min(1, "Property is required"),
  resident_id: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  severity: z.enum(SEVERITY_OPTIONS, {
    message: "Severity is required",
  }),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be under 2000 characters"),
  reported_date: z.string().min(1, "Reported date is required"),
  due_date: z.string().optional(),
  notes: z.string().max(2000).optional(),
  auto_send_notice: z.boolean().optional(),
})

export type ViolationFormValues = z.infer<typeof violationFormSchema>
