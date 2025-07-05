import { NextResponse } from "next/server"

/**
 * Returns the Kakao JavaScript SDK key (server-only).
 * NEVER expose other secrets here.
 */
export async function GET() {
  const key = process.env.KAKAO_JS_KEY || ""
  return NextResponse.json({ key })
}
