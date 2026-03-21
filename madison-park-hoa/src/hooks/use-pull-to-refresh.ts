"use client"

import { useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function usePullToRefresh(containerRef: React.RefObject<HTMLElement | null>) {
  const router = useRouter()
  const startY = useRef(0)
  const pulling = useRef(false)

  const onTouchStart = useCallback((e: TouchEvent) => {
    const el = containerRef.current
    if (!el || el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [containerRef])

  const onTouchEnd = useCallback((e: TouchEvent) => {
    if (!pulling.current) return
    const diff = e.changedTouches[0].clientY - startY.current
    pulling.current = false
    if (diff > 80) {
      router.refresh()
    }
  }, [router])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("touchstart", onTouchStart, { passive: true })
    el.addEventListener("touchend", onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener("touchstart", onTouchStart)
      el.removeEventListener("touchend", onTouchEnd)
    }
  }, [containerRef, onTouchStart, onTouchEnd])
}
