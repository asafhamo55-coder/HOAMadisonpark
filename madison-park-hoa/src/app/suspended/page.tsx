import Link from "next/link"
import { CircleX } from "lucide-react"

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
  title: "Workspace suspended — HOA Pro Hub",
}

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <CircleX className="h-6 w-6" />
          </div>
          <CardTitle>Workspace suspended</CardTitle>
          <CardDescription>
            This community workspace is currently suspended.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            If you believe this is in error, please contact HOA Pro Hub
            support at{" "}
            <a
              href="mailto:support@hoaprohub.app"
              className="underline underline-offset-2"
            >
              support@hoaprohub.app
            </a>
            .
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild variant="outline" className="w-full">
            <Link href="/select-tenant">Choose a different workspace</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
