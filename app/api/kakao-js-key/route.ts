import { NextResponse } from "next/server"

/**
 * Server-only endpoint that returns the Kakao JavaScript key.
 * No caching headers are set so Vercel’s edge cache doesn’t
 * accidentally expose the secret forever.
 */
export async function GET() {
  const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY

  if (!key) {
    return NextResponse.json({ error: "KAKAO_JS_KEY environment variable is not set" }, { status: 500 })
  }

  // Send just the key. Client fetches this at runtime.
  return NextResponse.json({ key })
}
