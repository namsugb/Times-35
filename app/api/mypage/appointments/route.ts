import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const phone = searchParams.get("phone")
        const name = searchParams.get("name")

        if (!name) {
            return NextResponse.json(
                { error: "사용자 이름이 필요합니다." },
                { status: 400 }
            )
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // 사용자가 투표한 약속들을 조회
        // voters 테이블에서 name이 일치하는 투표 기록을 찾고
        // 해당 appointment_id로 약속 정보를 가져옴
        const { data: voters, error: votersError } = await supabase
            .from("voters")
            .select(`
        name,
        appointment_id,
        appointments (
          id,
          title,
          method,
          status,
          share_token,
          start_date,
          end_date,
          created_at
        )
      `)
            .eq("name", name)
            .order("voted_at", { ascending: false })

        if (votersError) {
            console.error("투표자 조회 오류:", votersError)
            return NextResponse.json(
                { error: "약속 목록을 불러오는데 실패했습니다." },
                { status: 500 }
            )
        }

        // 약속 정보 추출 및 중복 제거
        const appointmentsMap = new Map()

        for (const voter of voters || []) {
            const appointment = voter.appointments as any
            if (appointment && !appointmentsMap.has(appointment.id)) {
                appointmentsMap.set(appointment.id, {
                    ...appointment,
                    voter_name: voter.name,
                })
            }
        }

        const appointments = Array.from(appointmentsMap.values())

        return NextResponse.json({ appointments })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}

