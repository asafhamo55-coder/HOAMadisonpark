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
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-indigo-500/10 ring-1 ring-white/20 backdrop-blur-sm">
          <Image
            src={process.env.NEXT_PUBLIC_HOA_LOGO_URL || "/logo.svg"}
            alt={process.env.NEXT_PUBLIC_HOA_NAME || "HOA"}
            width={56}
            height={56}
            priority
            className="rounded-lg"
          />
        </div>
      </div>

      <Card className="border-white/10 bg-white/[0.07] shadow-2xl shadow-black/20 backdrop-blur-xl">
        {sent ? (
          <>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 ring-1 ring-indigo-400/30">
                <MailCheck className="h-6 w-6 text-indigo-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">Check Your Email</CardTitle>
              <CardDescription className="text-slate-400">
                We sent a password reset link to your email address. Click the
                link to set a new password.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link href="/login" className="w-full">
                <Button
                  variant="outline"
                  className="w-full border-white/10 bg-white/[0.06] text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Sign In
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-white">Reset Password</CardTitle>
              <CardDescription className="text-slate-400">
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    autoFocus
                    className="border-white/10 bg-white/[0.06] text-white placeholder:text-slate-500 focus:border-indigo-500 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-500 hover:to-violet-500 hover:shadow-indigo-500/40"
                  disabled={loading}
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Send Reset Link
                </Button>

                <Link
                  href="/login"
                  className="text-sm text-slate-400 transition-colors hover:text-indigo-400 hover:underline"
                >
                  Back to Sign In
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">
        Secure access for Madison Park residents
      </p>
    </div>
  )
}
