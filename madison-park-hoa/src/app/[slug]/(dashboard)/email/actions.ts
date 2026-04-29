"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function updateEmailTemplate(
  id: string,
  updates: {
    subject_template?: string
    body_template?: string
    is_active?: boolean
  }
) {
  const supabase = createClient()

  const { error } = await supabase
    .from("email_templates")
    .update(updates)
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/email")
  return { error: null }
}

export async function createEmailTemplate(data: {
  name: string
  type: string
  subject_template: string
  body_template: string
}) {
  const supabase = createClient()

  const { error } = await supabase.from("email_templates").insert({
    ...data,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/email")
  return { error: null }
}

export async function toggleTemplateActive(id: string, is_active: boolean) {
  const supabase = createClient()

  const { error } = await supabase
    .from("email_templates")
    .update({ is_active })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dashboard/email")
  return { error: null }
}
