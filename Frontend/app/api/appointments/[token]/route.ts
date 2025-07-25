import { type NextRequest, NextResponse } from "next/server"
import { getAppointmentByToken } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const appointment = await getAppointmentByToken(params.token)

    // 서버사이드 검증
    if (!appointment || !appointment.is_public) {
      return NextResponse.json({ error: "약속을 찾을 수 없습니다" }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error("API 오류:", error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 })
  }
}
