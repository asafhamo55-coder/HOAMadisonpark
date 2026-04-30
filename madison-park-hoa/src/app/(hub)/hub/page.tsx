import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, CheckCircle2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth"
import { getActiveWorkspace, getMyWorkspaces } from "@/lib/hub/workspace"
import { ALL_MODULES } from "@/lib/hub/modules"
import { WorkspaceSwitcher } from "@/components/hub/workspace-switcher"

export const metadata = { title: "Hub" }

export default async function HubPage({
  searchParams,
}: {
  searchParams: { missing?: string }
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const workspaces = await getMyWorkspaces()
  if (workspaces.length === 0) redirect("/onboarding")

  const active = (await getActiveWorkspace())!

  return (
    <div className="container max-w-5xl py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Pick a module to keep working in <strong>{active.name}</strong>.
          </p>
        </div>
        <WorkspaceSwitcher workspaces={workspaces} active={active} />
      </div>

      {searchParams.missing && (
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
          The <strong>{searchParams.missing}</strong> module isn&apos;t enabled
          for this workspace. Ask an owner or admin to enable it from{" "}
          <Link className="underline" href="/hub/settings">workspace settings</Link>.
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {ALL_MODULES.map((m) => {
          const enabled = active.modules.includes(m.key)
          const Icon = m.icon
          return (
            <Card key={m.key} className="flex flex-col">
              <CardHeader>
                <div className={`mb-2 inline-flex h-10 w-10 items-center justify-center rounded-md bg-muted ${m.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="flex items-center gap-2">
                  {m.name}
                  {enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </CardTitle>
                <CardDescription>{m.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-end">
                {enabled ? (
                  <Button className="w-full" asChild>
                    <Link href={m.href}>
                      Open <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/hub/enable?module=${m.key}`}>Enable module</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
