import { NextResponse } from "next/server"

/**
 * Server-side endpoint that returns the Kakao JS SDK key.
 * The key is stored in an **un-prefixed** environment variable (KAKAO_JS_KEY),
 * so it never ships inside the browser bundle at build time.
 */
export async function GET() {
  // You could add authentication / rate-limiting here if desired.
  return NextResponse.json({ key: process.env.KAKAO_JS_KEY ?? "" })
}
