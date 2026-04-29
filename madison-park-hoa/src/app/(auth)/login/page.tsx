"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"

import {
  login,
  loginWithMagicLink,
  resolvePostLoginPath,
  startGoogleOAuth,
} from "@/app/(auth)/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BRAND } from "@/lib/brand"
import { cn } from "@/lib/utils"

type Mode = "password" | "magic"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("password")
  const [pending, startTransition] = useTransition()
  const [magicSent, setMagicSent] = useState<string | null>(null)

  function onPasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await login(fd)
      if (result.error) {
        toast.error(result.error)
        return
      }
      // Resolve where to go (0/1/2+ memberships).
      const target = await resolvePostLoginPath()
      router.push(target)
      router.refresh()
    })
  }

  function onMagicSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await loginWithMagicLink(fd)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setMagicSent((fd.get("email") as string) ?? null)
    })
  }

  function onGoogleClick() {
    startTransition(async () => {
      const result = await startGoogleOAuth()
      if (result.error || !result.url) {
        toast.error(result.error ?? "Could not start Google sign-in")
        return
      }
      window.location.href = result.url
    })
  }

  if (magicSent) {
    return (
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Mail className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-medium text-slate-900">
          Check your email
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          We sent a sign-in link to <strong>{magicSent}</strong>. Click it
          to come back into your account.
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="mt-6"
          onClick={() => setMagicSent(null)}
        >
          Try a different email
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-base font-semibold tracking-tight text-slate-900"
        >
          <span
            aria-hidden="true"
            className="inline-block h-7 w-7 rounded-md"
            style={{ backgroundColor: "var(--tenant-primary)" }}
          />
          {BRAND.name}
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="font-display text-2xl font-medium text-slate-900">
          Sign in
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back. Pick how you want to get in.
        </p>

        <Button
          type="button"
          variant="outline"
          className="mt-5 w-full"
          onClick={onGoogleClick}
          disabled={pending}
        >
          <GoogleLogo className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          or
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mb-4 flex rounded-md border border-slate-200 p-1 text-xs font-medium">
          {(["password", "magic"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              className={cn(
                "flex-1 rounded px-3 py-1.5",
                mode === m
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900",
              )}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
            >
              {m === "password" ? "Password" : "Magic link"}
            </button>
          ))}
        </div>

        {mode === "password" ? (
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
            <div className="space-y-1.5">
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-emerald-700 underline-offset-2 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={onMagicSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="magic-email">Email</Label>
              <Input
                id="magic-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                autoFocus
              />
              <p className="text-xs text-slate-500">
                We&apos;ll email you a one-time link. No password required.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-[var(--tenant-primary)] text-white hover:bg-[#1A3A5F]"
              disabled={pending}
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send magic link
            </Button>
          </form>
        )}
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link
          href="/signup"
          className="font-medium text-emerald-700 underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.8 2.6 2.5 6.9 2.5 12.1S6.8 21.6 12 21.6c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  )
}
