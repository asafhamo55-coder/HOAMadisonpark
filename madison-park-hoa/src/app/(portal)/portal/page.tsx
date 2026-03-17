import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { MyHomeView } from "./my-home-view"

export type PortalViolation = {
  id: string
  category: string
  description: string
  status: string
  severity: string
  reported_date: string
  due_date: string | null
  fine_amount: number | null
  letters: Array<{
    id: string
    subject: string
    type: string
    sent_at: string
  }>
}

export type PortalPayment = {
  id: string
  amount: number
  due_date: string
  status: string
  period: string | null
  paid_date: string | null
}

export type PortalLetter = {
  id: string
  subject: string
  type: string
  sent_at: string
  body_html: string | null
}

export type PortalRequest = {
  id: string
  type: string
  subject: string
  status: string
  created_at: string
}

export default async function PortalHomePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = createClient()

  // Find resident's property
  const { data: residentData } = await supabase
    .from("residents")
    .select("id, property_id, properties(id, address)")
    .eq("profile_id", user.id)
    .eq("is_current", true)
    .limit(1)
    .single()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const property = (residentData as any)?.properties
  const propertyId = residentData?.property_id || null
  const propertyAddress: string = property?.address || "No property linked"

  const [violationsRes, paymentsRes, lettersRes, requestsRes] =
    await Promise.all([
      // Violations with linked letters
      propertyId
        ? supabase
            .from("violations")
            .select(
              "id, category, description, status, severity, reported_date, due_date, fine_amount, letters(id, subject, type, sent_at)"
            )
            .eq("property_id", propertyId)
            .in("status", [
              "open",
              "notice_sent",
              "warning_sent",
              "fine_issued",
            ])
            .order("reported_date", { ascending: false })
        : Promise.resolve({ data: [] }),

      // Payments
      propertyId
        ? supabase
            .from("payments")
            .select("id, amount, due_date, status, period, paid_date")
            .eq("property_id", propertyId)
            .order("due_date", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),

      // Letters
      propertyId
        ? supabase
            .from("letters")
            .select("id, subject, type, sent_at, body_html")
            .eq("property_id", propertyId)
            .eq("status", "sent")
            .order("sent_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] }),

      // My requests
      supabase
        .from("requests")
        .select("id, type, subject, status, created_at")
        .eq("submitted_by", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ])

  return (
    <MyHomeView
      propertyAddress={propertyAddress}
      violations={(violationsRes.data || []) as PortalViolation[]}
      payments={(paymentsRes.data || []) as PortalPayment[]}
      letters={(lettersRes.data || []) as PortalLetter[]}
      requests={(requestsRes.data || []) as PortalRequest[]}
    />
  )
}
