import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get("title") || "만날래말래"

    return new ImageResponse(
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          📅 만날래말래
        </div>
        <div
          style={{
            fontSize: 32,
            textAlign: "center",
            maxWidth: "80%",
            lineHeight: 1.4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 24,
            marginTop: 30,
            opacity: 0.9,
          }}
        >
          약속 투표에 참여해주세요! 🗳️
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (error) {
    console.error("OG 이미지 생성 실패:", error)
    return new Response("이미지 생성 실패", { status: 500 })
  }
}
