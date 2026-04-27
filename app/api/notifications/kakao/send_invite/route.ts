import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { sendKakaoInvite } from "@/lib/server/kakao-alimtalk"

interface InviteMember {
  name: string
  phone: string
}

interface RequestBody {
  appointmentId: string
  appointmentTitle: string
  shareToken: string
  members: InviteMember[]
  invitorName: string
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json()
    const { appointmentId, appointmentTitle, shareToken, members, invitorName } = body

    if (!appointmentId || !shareToken || !members || members.length === 0) {
      return NextResponse.json({ error: "필수 파라미터가 누락되었습니다." }, { status: 400 })
    }

    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://mannallae.com"
    const voteUrl = `${origin}/vote/${shareToken}`
    const resultsUrl = `${origin}/results/${shareToken}`

    const results = []

    for (const member of members) {
      try {
        const result = await sendKakaoInvite(invitorName, member.phone, appointmentTitle, voteUrl, resultsUrl)

        if (result.success) {
          results.push({
            phone: member.phone,
            name: member.name,
            status: "success",
          })
        } else {
          results.push({
            phone: member.phone,
            name: member.name,
            status: "failed",
            error: result.error,
          })
        }
      } catch (err: any) {
        console.error(`알림톡 발송 예외 (${member.phone}):`, err)
        results.push({
          phone: member.phone,
          name: member.name,
          status: "failed",
          error: err.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `${members.length}명에게 알림톡 발송 요청이 완료되었습니다.`,
      results,
    })
  } catch (error: any) {
    console.error("알림톡 발송 API 오류:", error)
    return NextResponse.json({ error: "알림톡 발송에 실패했습니다." }, { status: 500 })
  }
}
