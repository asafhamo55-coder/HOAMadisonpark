import { getCurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { DocumentsView } from "./documents-view"

export type Document = {
  id: string
  title: string
  category: string | null
  file_url: string
  file_name: string | null
  file_size: number | null
  is_public: boolean
  uploaded_by: string | null
  created_at: string
}

export default async function DocumentsPage() {
  const supabase = createClient()
  const user = await getCurrentUser()
  const isBoardOrAdmin = user?.role === "admin" || user?.role === "board"
  const isAdmin = user?.role === "admin"

  let query = supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })

  if (!isBoardOrAdmin) {
    query = query.eq("is_public", true)
  }

  const { data } = await query
  const documents = (data || []) as Document[]

  return (
    <DocumentsView
      documents={documents}
      isBoardOrAdmin={isBoardOrAdmin}
      isAdmin={isAdmin}
    />
  )
}
