import Link from "next/link"
import { redirect } from "next/navigation"
import { Building2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { listMyTenants } from "@/lib/tenant"

export const metadata = {
  title: "Choose a workspace — HOA Pro Hub",
}

export const dynamic = "force-dynamic"

export default async function SelectTenantPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const tenants = await listMyTenants()

  // Common case: only one tenant — redirect straight in.
  if (tenants.length === 1) {
    redirect(`/${tenants[0].slug}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
          <CardTitle>Choose a workspace</CardTitle>
          <CardDescription>
            You belong to multiple communities. Pick one to continue.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2">
          {tenants.length === 0 && (
            <p className="text-sm text-muted-foreground">
              You aren&apos;t a member of any active workspace. If you were
              expecting access, ask your community administrator to send you
              an invitation.
            </p>
          )}

          {tenants.map((t) => (
            <Button
              key={t.tenant_id}
              asChild
              variant="outline"
              className="w-full justify-start"
            >
              <Link href={`/${t.slug}`}>
                <span className="flex flex-col items-start">
                  <span className="font-medium">{t.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {t.role}
                  </span>
                </span>
              </Link>
            </Button>
          ))}

          <div className="pt-4 text-center">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in as someone else</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
