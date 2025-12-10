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

// Authorization 헤더에서 토큰과 인증된 클라이언트 가져오기
function getTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null
    }
    return authHeader.replace("Bearer ", "")
}

// PUT: 그룹 수정
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params

        // 토큰 확인 및 인증된 클라이언트 생성
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

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

        // 그룹 소유권 확인
        const { data: existingGroup, error: checkError } = await supabase
            .from("groups")
            .select("id")
            .eq("id", groupId)
            .eq("user_id", userId)
            .single()

        if (checkError || !existingGroup) {
            return NextResponse.json(
                { error: "그룹을 찾을 수 없거나 권한이 없습니다." },
                { status: 404 }
            )
        }

        // 그룹 이름 수정
        const { error: updateError } = await supabase
            .from("groups")
            .update({ name: name.trim(), updated_at: new Date().toISOString() })
            .eq("id", groupId)

        if (updateError) {
            console.error("그룹 수정 오류:", updateError)
            return NextResponse.json(
                { error: "그룹 수정에 실패했습니다." },
                { status: 500 }
            )
        }

        // 기존 멤버 삭제
        const { error: deleteError } = await supabase
            .from("group_members")
            .delete()
            .eq("group_id", groupId)

        if (deleteError) {
            console.error("멤버 삭제 오류:", deleteError)
        }

        // 새 멤버 추가
        if (members && Array.isArray(members) && members.length > 0) {
            const membersToInsert = members
                .filter((m: any) => m.name && m.name.trim())
                .map((m: any) => ({
                    group_id: groupId,
                    name: m.name.trim(),
                    phone: m.phone?.trim() || null,
                }))

            if (membersToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from("group_members")
                    .insert(membersToInsert)

                if (insertError) {
                    console.error("멤버 추가 오류:", insertError)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}

// DELETE: 그룹 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params

        // 토큰 확인 및 인증된 클라이언트 생성
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const supabase = getAuthenticatedClient(token)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const userId = user.id

        // 그룹 소유권 확인 및 삭제
        const { data: deletedGroup, error: deleteError } = await supabase
            .from("groups")
            .delete()
            .eq("id", groupId)
            .eq("user_id", userId)
            .select()
            .single()

        if (deleteError || !deletedGroup) {
            return NextResponse.json(
                { error: "그룹을 찾을 수 없거나 권한이 없습니다." },
                { status: 404 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}

// GET: 특정 그룹 조회
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: groupId } = await params

        // 토큰 확인 및 인증된 클라이언트 생성
        const token = getTokenFromRequest(request)
        if (!token) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const supabase = getAuthenticatedClient(token)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json(
                { error: "로그인이 필요합니다." },
                { status: 401 }
            )
        }

        const userId = user.id

        // 그룹 조회 (멤버 포함)
        const { data: group, error } = await supabase
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
            .eq("id", groupId)
            .eq("user_id", userId)
            .single()

        if (error || !group) {
            return NextResponse.json(
                { error: "그룹을 찾을 수 없거나 권한이 없습니다." },
                { status: 404 }
            )
        }

        return NextResponse.json({
            group: {
                id: group.id,
                name: group.name,
                created_at: group.created_at,
                members: group.group_members || [],
            }
        })
    } catch (error: any) {
        console.error("API 오류:", error)
        return NextResponse.json(
            { error: "서버 오류가 발생했습니다." },
            { status: 500 }
        )
    }
}
