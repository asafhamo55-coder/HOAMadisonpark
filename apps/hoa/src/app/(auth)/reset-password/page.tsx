"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ArrowLeft, MailCheck } from "lucide-react"

import { resetPassword } from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await resetPassword(formData)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex justify-center">
        <Image
          src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
          alt={process.env.NEXT_PUBLIC_HOA_NAME || "HOA"}
          width={80}
          height={80}
          priority
        />
      </div>

      <Card>
        {sent ? (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Check Your Email</CardTitle>
              <CardDescription>
                We sent a password reset link to your email address. Click the
                link to set a new password.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>

                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                >
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
