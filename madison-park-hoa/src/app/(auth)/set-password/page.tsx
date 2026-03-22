"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, CheckCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SetPasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const password = formData.get("password") as string
    const confirm = formData.get("confirm") as string

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    if (password !== confirm) {
      toast.error("Passwords do not match")
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    toast.success("Password set successfully!")

    // Redirect after a brief delay so the user sees the success state
    setTimeout(() => {
      router.push("/dashboard")
      router.refresh()
    }, 1500)
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
        {done ? (
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Set!</CardTitle>
            <CardDescription>
              Your password has been set. Redirecting you now…
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>Set Your Password</CardTitle>
              <CardDescription>
                Welcome! Please create a password for your account.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    type="password"
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Set Password
                </Button>
              </CardContent>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
