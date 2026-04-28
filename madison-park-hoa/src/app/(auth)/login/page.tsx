"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

import { login, getRole } from "@/app/(auth)/actions"
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

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result.error) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    const role = await getRole()
    router.push(role === "resident" ? "/portal" : "/dashboard")
    router.refresh()
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
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-white">Sign In</CardTitle>
          <CardDescription className="text-slate-400">
            {process.env.NEXT_PUBLIC_HOA_NAME || "HOA"} Resident Portal
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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>

            <Link
              href="/reset-password"
              className="text-sm text-slate-400 transition-colors hover:text-indigo-400 hover:underline"
            >
              Forgot your password?
            </Link>
          </CardFooter>
        </form>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">
        Secure access for Madison Park residents
      </p>
    </div>
  )
}
