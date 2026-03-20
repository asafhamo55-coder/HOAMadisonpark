import { NextResponse } from "next/server"

export async function GET() {
  const key = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM || process.env.HOA_FROM_EMAIL || "(default fallback)"

  return NextResponse.json({
    hasKey: !!key,
    keyLength: key?.length ?? 0,
    keyPrefix: key ? key.slice(0, 6) + "..." : "(empty)",
    startsWithRe: key?.startsWith("re_") ?? false,
    fromAddress: from,
    nodeEnv: process.env.NODE_ENV,
  })
}
