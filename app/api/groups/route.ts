import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 토큰으로 인증된 Supabase 클라이언트 생성
function getAuthenticatedClient(token: string) {
    return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        },
    })
}

// GET: 내 그룹 목록 조회
export async function GET(request: NextRequest) {
    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = request.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const token = authHeader.replace("Bearer ", "")
        const supabase = getAuthenticatedClient(token)

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const userId = user.id

        // 그룹 목록 조회 (멤버 포함)
        const { data: groups, error } = await supabase
            .from("groups")
            .select(`
        id,
        name,
        created_at,
        group_members (
          id,
          name,
          phone
        )
      `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("그룹 조회 오류:", error)
            return NextResponse.json(
                { error: "그룹 목록을 불러오는데 실패했습니다." },
                { status: 500 }
            )
        }

        // 응답 형식 정리
        const formattedGroups = (groups || []).map((group) => ({
            id: group.id,
            name: group.name,
            created_at: group.created_at,
            members: group.group_members || [],
        }))

        return NextResponse.json({ groups: formattedGroups })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}

// POST: 그룹 생성
export async function POST(request: NextRequest) {
    try {
        // Authorization 헤더에서 토큰 추출
        const authHeader = request.headers.get("authorization")
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const token = authHeader.replace("Bearer ", "")
        const supabase = getAuthenticatedClient(token)

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const userId = user.id
        const body = await request.json()
        const { name, members } = body

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: "그룹 이름을 입력해주세요." },
                { status: 400 }
            )
        }

        if (!members || !Array.isArray(members) || members.length === 0) {
            return NextResponse.json(
                { error: "최소 1명의 멤버가 필요합니다." },
                { status: 400 }
            )
        }

        // 그룹 생성
        const { data: group, error: groupError } = await supabase
            .from("groups")
            .insert({
                user_id: userId,
                name: name.trim(),
            })
            .select()
            .single()

        if (groupError) {
            console.error("그룹 생성 오류:", groupError)
            return NextResponse.json(
                { error: "그룹 생성에 실패했습니다." },
                { status: 500 }
            )
        }

        // 멤버 추가
        const membersToInsert = members
            .filter((m: any) => m.name && m.name.trim())
            .map((m: any) => ({
                group_id: group.id,
                name: m.name.trim(),
                phone: m.phone?.trim() || null,
            }))

        if (membersToInsert.length > 0) {
            const { error: membersError } = await supabase
                .from("group_members")
                .insert(membersToInsert)

            if (membersError) {
                console.error("멤버 추가 오류:", membersError)
                // 그룹은 생성됐으니 에러를 던지지 않음
            }
        }

        return NextResponse.json({
            success: true,
            group: { id: group.id, name: group.name }
        })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}

