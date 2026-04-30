"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const leadSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  interest: z.enum(["hoa", "property", "eviction", "all"]),
  message: z.string().max(2000).optional(),
})

export async function submitLead(formData: FormData) {
  const parsed = leadSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    interest: formData.get("interest"),
    message: formData.get("message") ?? undefined,
  })

  if (!parsed.success) {
    return { error: "Please check your name, email, and interest." }
  }

  const supabase = createClient()
  const { error } = await supabase.from("leads").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    interest: parsed.data.interest,
    message: parsed.data.message ?? null,
  })

  if (error) {
    return { error: "We couldn't save your request. Please try again." }
  }

  return { ok: true }
}
