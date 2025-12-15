import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// 카카오 알림톡 발송 함수
async function sendKakaoNotification(phoneNumber: string, appointmentTitle: string, resultsUrl: string) {
  try {
    // Lunasoft API 설정 확인
    const LUNA_USERID = process.env.LUNA_USERID;
    const LUNA_API_KEY = process.env.LUNA_API_KEY;
    const name = "친구"

    if (!LUNA_USERID || !LUNA_API_KEY) {
      console.warn("Lunasoft 알림톡 설정이 되어있지 않습니다.");
      return { success: false, error: "Lunasoft configuration missing" };
    }

    const requestBody = {
      userid: LUNA_USERID,
      api_key: LUNA_API_KEY,
      template_id: 50082,

      messages: [
        {
          no: "1",
          tel_num: phoneNumber,
          use_sms: "0",
          sms_content: `${appointmentTitle} 투표가 완료되었습니다.\n투표 결과를 확인하고 친구들에게 공유해보세요!`,
          msg_content: `${appointmentTitle} 투표가 완료되었습니다.\n투표 결과를 확인하고 친구들에게 공유해보세요!`,
          btn_url: [{
            url_pc: resultsUrl,
            url_mobile: resultsUrl
          }]
        },
      ],
    }

    // Lunasoft API 요청
    const response = await fetch("https://jupiter.lunasoft.co.kr/api/AlimTalk/message/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Lunasoft API 응답 처리
    if (result.code !== 0) {
      const errorMessage = typeof result.msg === 'object'
        ? JSON.stringify(result.msg, null, 2)
        : result.msg || "알림톡 전송 실패";
      throw new Error(errorMessage);
    }

    return { success: true, data: result };
  } catch (error: any) {
    console.error("알림톡 전송 중 오류:", error);
    return { success: false, error: error.message };
  }
}



export async function POST(request: NextRequest) {
  try {

    const body = await request.json()
    const { phoneNumber, appointmentTitle, resultsUrl, appointmentId } = body


    // 대기 중인 알림 조회
    const { data: notifications, error } = await supabase
      .from("notification_queue")
      .select(`
        *,
        appointments!inner(title, share_token)
      `)
      .eq("status", "pending")
      .eq("appointments.id", appointmentId)

    if (error) {
      console.error("알림 큐 조회 오류:", error)
      return NextResponse.json({ error: "알림 조회 실패" }, { status: 500 })
    }

    const results = []

    // 알림톡 발송
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
