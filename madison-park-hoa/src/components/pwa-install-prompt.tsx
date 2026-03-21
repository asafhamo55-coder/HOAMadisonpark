"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Share, Download } from "lucide-react"

const DISMISS_KEY = "pwa-install-dismissed"
const DISMISS_DAYS = 7

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function isDismissed(): boolean {
  if (typeof window === "undefined") return true
  const dismissed = localStorage.getItem(DISMISS_KEY)
  if (!dismissed) return false
  const dismissedAt = parseInt(dismissed, 10)
  const daysSince = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24)
  return daysSince < DISMISS_DAYS
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, Date.now().toString())
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as unknown as { standalone: boolean }).standalone)
  )
}

export function PWAInstallPrompt() {
  const [showAndroid, setShowAndroid] = useState(false)
  const [showIOS, setShowIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (isStandalone() || isDismissed()) return

    // Android / Chrome install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowAndroid(true)
    }
    window.addEventListener("beforeinstallprompt", handler)

    // iOS detection
    if (isIOS()) {
      setShowIOS(true)
    }

    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") {
      setShowAndroid(false)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    dismiss()
    setShowAndroid(false)
    setShowIOS(false)
  }, [])

  if (!showAndroid && !showIOS) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <Card className="mx-auto max-w-md border-0 bg-[#1e3a5f] p-4 text-white shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            {showAndroid && (
              <>
                <p className="font-semibold">Install Madison Park HOA</p>
                <p className="mt-1 text-sm text-white/70">
                  Add to your home screen for quick access
                </p>
                <Button
                  onClick={handleInstall}
                  className="mt-3 bg-white text-[#1e3a5f] hover:bg-white/90"
                  size="sm"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Install App
                </Button>
              </>
            )}
            {showIOS && !showAndroid && (
              <>
                <p className="font-semibold">Install Madison Park HOA</p>
                <p className="mt-1 text-sm text-white/70">
                  Tap the <Share className="inline h-4 w-4 align-text-bottom" /> Share button,
                  then &quot;Add to Home Screen&quot;
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </Card>
    </div>
  )
}
