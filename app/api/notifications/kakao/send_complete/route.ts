import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { sendKakaoCompletion } from "@/lib/server/kakao-alimtalk"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    const { data: notifications, error } = await supabase
      .from("notification_queue")
      .select(`
        *,
        appointments!inner(title, share_token)
      `)
      .eq("status", "pending")
      .eq("appointments.id", appointmentId)

    if (error) {
      console.error("알림 조회 오류:", error)
      return NextResponse.json({ error: "알림 조회 실패" }, { status: 500 })
    }

    const results = []

    for (const notification of notifications || []) {
      try {
        const resultsUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/results/${notification.appointments.share_token}`
        const result = await sendKakaoCompletion(notification.phone_number, notification.appointments.title, resultsUrl)

        if (result.success) {
          await supabase
            .from("notification_queue")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
            })
            .eq("id", notification.id)

          results.push({ id: notification.id, status: "sent" })
        } else {
          await supabase
            .from("notification_queue")
            .update({
              status: "failed",
              error_message: result.error,
            })
            .eq("id", notification.id)

          results.push({ id: notification.id, status: "failed", error: result.error })
        }
      } catch (error: any) {
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
