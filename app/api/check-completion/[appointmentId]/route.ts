import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params

    // 약속 정보 조회
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .single()

    if (appointmentError || !appointment) {
      return NextResponse.json({ error: "약속을 찾을 수 없습니다" }, { status: 404 })
    }

    // 현재 투표자 수 조회
    const { data: voters, error: votersError } = await supabase
      .from("voters")
      .select("id")
      .eq("appointment_id", appointmentId)

    if (votersError) {
      return NextResponse.json({ error: "투표자 조회 실패" }, { status: 500 })
    }

    const currentVoters = voters?.length || 0
    const requiredParticipants = appointment.required_participants || 0
    const isComplete = currentVoters >= requiredParticipants
    const finished = 

    // 투표 완료되었고 아직 알림을 보내지 않았다면
    // if (isComplete && !appointment.notification_sent && appointment.creator_phone) {
    //   // 알림 큐에 추가
    //   const { error: queueError } = await supabase.from("notification_queue").insert({
    //     appointment_id: appointmentId,
    //     phone_number: appointment.creator_phone,
    //     message_type: "voting_complete",
    //   })

    //   if (!queueError) {
    //     // 알림 발송 플래그 업데이트
    //     await supabase.from("appointments").update({ notification_sent: true }).eq("id", appointmentId)

    //     // 실제 알림 발송 API 호출
    //     await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/notifications/kakao`, {
    //       method: "POST",
    //     })
    //   }
    // }

    return NextResponse.json({
      isComplete,
      currentVoters,
      requiredParticipants,
      notificationSent: appointment.notification_sent,
    })
  } catch (error) {
    console.error("투표 완료 체크 오류:", error)
    return NextResponse.json({ error: "서버 오류" }, { status: 500 })
  }
}
