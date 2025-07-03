import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// 카카오 알림톡 발송 함수
async function sendKakaoNotification(phoneNumber: string, appointmentTitle: string, resultsUrl: string) {
  // 실제 카카오 알림톡 API 호출
  // 여기서는 예시로 콘솔 로그만 출력
  console.log(`카카오 알림톡 발송:`)
  console.log(`수신자: ${phoneNumber}`)
  console.log(`약속명: ${appointmentTitle}`)
  console.log(`결과 URL: ${resultsUrl}`)

  // 실제 구현 시에는 카카오 비즈니스 API를 사용
  try {
    // const response = await fetch('카카오 알림톡 API URL', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.KAKAO_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     phone: phoneNumber,
    //     templateCode: 'VOTING_COMPLETE',
    //     message: `[${appointmentTitle}] 모든 참여자의 투표가 완료되었습니다. 결과를 확인해보세요: ${resultsUrl}`,
    //   }),
    // })

    // 임시로 성공으로 처리
    return { success: true }
  } catch (error) {
    console.error("카카오 알림톡 발송 실패:", error)
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 대기 중인 알림 조회
    const { data: notifications, error } = await supabase
      .from("notification_queue")
      .select(`
        *,
        appointments!inner(title, share_token)
      `)
      .eq("status", "pending")
      .limit(10)

    if (error) {
      console.error("알림 큐 조회 오류:", error)
      return NextResponse.json({ error: "알림 조회 실패" }, { status: 500 })
    }

    const results = []

    for (const notification of notifications) {
      try {
        const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/results/${notification.appointments.share_token}`

        const result = await sendKakaoNotification(
          notification.phone_number,
          notification.appointments.title,
          resultsUrl,
        )

        if (result.success) {
          // 발송 성공 시 상태 업데이트
          await supabase
            .from("notification_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id)

          results.push({ id: notification.id, status: "sent" })
        } else {
          // 발송 실패 시 에러 기록
          await supabase
            .from("notification_queue")
            .update({
              status: "failed",
              error_message: result.error,
            })
            .eq("id", notification.id)

          results.push({ id: notification.id, status: "failed", error: result.error })
        }
      } catch (error) {
        console.error(`알림 발송 실패 (ID: ${notification.id}):`, error)
        results.push({ id: notification.id, status: "failed", error: error.message })
      }
    }

    return NextResponse.json({
      message: "알림 처리 완료",
      results,
    })
  } catch (error) {
    console.error("알림 처리 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}
