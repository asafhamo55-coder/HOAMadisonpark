import Link from "next/link"
import { redirect } from "next/navigation"
import { Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { withAdminClient } from "@/lib/admin"

type PageProps = {
  params: { token: string }
}

export const metadata = {
  title: "Accept invitation — HOA Pro Hub",
}

export const dynamic = "force-dynamic"

export default async function AcceptInvitePage({ params }: PageProps) {
  const { token } = params

  // Look up the invitation via the service role — the user accepting may not
  // yet be a member of the tenant, so RLS would block them.
  const invite = await withAdminClient(
    {
      action: "invitation.lookup",
      reason: "Accept-invitation page load",
      metadata: { token: token.slice(0, 8) + "…" },
    },
    async (admin) => {
      const { data } = await admin
        .from("tenant_invitations")
        .select(
          "id, tenant_id, email, role, expires_at, accepted_at, tenants!inner(slug, name, deleted_at)",
        )
        .eq("token", token)
        .maybeSingle()
      return data
    },
  )

  if (!invite) {
    return (
      <FailureCard
        title="Invitation not found"
        description="This invitation link is invalid or has been revoked."
      />
    )
  }

  if (invite.accepted_at) {
    return (
      <FailureCard
        title="Already accepted"
        description="This invitation has already been used. Sign in to access your workspace."
        cta={{ href: "/login", label: "Go to sign in" }}
      />
    )
  }

  if (new Date(invite.expires_at) < new Date()) {
    return (
      <FailureCard
        title="Invitation expired"
        description="This invitation has expired. Ask the community administrator to send you a new one."
      />
    )
  }

  // Tenant could have been soft-deleted while the invite was pending.
  // The shape of the joined row depends on Supabase's PostgREST embed —
  // tolerate both array and object forms.
  type TenantRef = { slug: string; name: string; deleted_at: string | null }
  const tenantsField = (invite as { tenants: TenantRef | TenantRef[] | null }).tenants
  const tenant: TenantRef | null = Array.isArray(tenantsField)
    ? tenantsField[0] ?? null
    : tenantsField
  if (!tenant || tenant.deleted_at) {
    return (
      <FailureCard
        title="Workspace unavailable"
        description="The community that sent this invitation is no longer active."
      />
    )
  }

  // Authentication state.
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Punt to login, then come back. The login page will return here via `next`.
    redirect(`/login?next=/accept-invite/${token}`)
  }

  if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
    return (
      <FailureCard
        title="Wrong account"
        description={`This invitation was sent to ${invite.email}. Sign in with that email to accept it.`}
        cta={{ href: "/login", label: "Sign in with the right account" }}
      />
    )
  }

  // Create the membership and mark the invitation accepted, atomically (best-effort).
  await withAdminClient(
    {
      action: "invitation.accept",
      reason: "Resident or staff accepted invitation",
      tenantId: invite.tenant_id,
      entity: "tenant_memberships",
      metadata: { email: invite.email, role: invite.role, token: token.slice(0, 8) + "…" },
    },
    async (admin) => {
      // Idempotent: if a membership already exists, just reactivate it.
      const { error: upsertErr } = await admin
        .from("tenant_memberships")
        .upsert(
          {
            tenant_id: invite.tenant_id,
            user_id: user.id,
            role: invite.role,
            status: "active",
          },
          { onConflict: "tenant_id,user_id" },
        )
      if (upsertErr) throw upsertErr

      const { error: acceptErr } = await admin
        .from("tenant_invitations")
        .update({ accepted_at: new Date().toISOString() })
        .eq("id", invite.id)
      if (acceptErr) throw acceptErr
    },
  )

  // Successful accept — redirect into the tenant.
  redirect(`/${tenant.slug}`)
}

function FailureCard({
  title,
  description,
  cta,
}: {
  title: string
  description: string
  cta?: { href: string; label: string }
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href={cta?.href ?? "/login"}>{cta?.label ?? "Back to sign in"}</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

