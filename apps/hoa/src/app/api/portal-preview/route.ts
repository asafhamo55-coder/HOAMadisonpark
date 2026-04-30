import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const response = NextResponse.redirect(`${origin}/portal`)
  response.cookies.set("portal_preview", "true", {
    path: "/",
    maxAge: 60 * 60, // 1 hour
  })
  return response
}
