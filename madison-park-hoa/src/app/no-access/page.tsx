import Link from "next/link"
import { ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata = {
  title: "No access — HOA Pro Hub",
}

export default function NoAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle>You don&apos;t have access</CardTitle>
          <CardDescription>
            Your account is not a member of this community workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            If you were expecting access, ask the community administrator to
            send you an invitation. Invitations are emailed and contain a
            single-use link to join.
          </p>
          <p>
            Already invited? Open the invitation email and click the
            &ldquo;Accept invitation&rdquo; button.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild variant="default" className="w-full">
            <Link href="/select-tenant">Choose a different workspace</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Sign in with a different account</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
