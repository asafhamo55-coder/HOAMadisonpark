"use server"

import { cookies } from "next/headers"
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/hub/workspace"

export async function setActiveWorkspaceAction(slug: string) {
  cookies().set(ACTIVE_WORKSPACE_COOKIE, slug, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  })
  return { ok: true }
}
