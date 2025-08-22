import { type NextRequest, NextResponse } from "next/server"
import { createAppointment } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const appointmentData = await request.json()

    console.log("API Route - 약속 생성 요청:", appointmentData)
    console.log("API Route - Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("API Route - Supabase Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    const appointment = await createAppointment(appointmentData)

    console.log("API Route - 약속 생성 완료:", appointment)

    return NextResponse.json(appointment)
  } catch (error: any) {
    console.error("API Route - 약속 생성 실패:", error)
    console.error("API Route - 에러 스택:", error.stack)

    return NextResponse.json(
      {
        message: error.message || "약속 생성에 실패했습니다",
        error: error.toString(),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
