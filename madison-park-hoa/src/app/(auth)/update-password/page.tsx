"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, CheckCircle2 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
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

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    toast.success("Password updated successfully")

    // Redirect after short delay
    setTimeout(() => {
      router.push("/login")
    }, 2000)
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
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle>Password Updated</CardTitle>
            <CardDescription>
              Your password has been updated. Redirecting to sign in...
            </CardDescription>
          </CardHeader>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    minLength={8}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    minLength={8}
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Update Password
                </Button>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
