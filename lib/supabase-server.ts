import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 서버 컴포넌트용 Supabase 클라이언트 생성
export async function createServerClient() {
    const cookieStore = await cookies()

    return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll()
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options)
                    })
                } catch (error) {
                    // 서버 컴포넌트에서는 쿠키를 설정할 수 없으므로 무시
                }
            },
        },
    })
}
