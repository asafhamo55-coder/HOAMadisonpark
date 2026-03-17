import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AccountView } from "./account-view"

export type AccountData = {
  profile: {
    full_name: string | null
    email: string | null
    phone: string | null
  }
  resident: {
    id: string
    vehicles: string[]
    pets: string[]
    type: string | null
    move_in_date: string | null
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
  } | null
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const supabase = createClient()

  const { data: resident } = await supabase
    .from("residents")
    .select(
      "id, vehicles, pets, type, move_in_date, emergency_contact_name, emergency_contact_phone"
    )
    .eq("profile_id", user.id)
    .eq("is_current", true)
    .limit(1)
    .single()

  return (
    <AccountView
      data={{
        profile: {
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
        },
        resident: resident
          ? {
              id: resident.id,
              vehicles: resident.vehicles || [],
              pets: resident.pets || [],
              type: resident.type,
              move_in_date: resident.move_in_date,
              emergency_contact_name: resident.emergency_contact_name,
              emergency_contact_phone: resident.emergency_contact_phone,
            }
          : null,
      }}
    />
  )
}
