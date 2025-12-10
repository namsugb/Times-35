"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseAuth } from "@/lib/auth"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // URL에서 에러 확인
                const hashParams = new URLSearchParams(window.location.hash.substring(1))
                const errorParam = hashParams.get("error")
                const errorDescription = hashParams.get("error_description")

                if (errorParam) {
                    console.error("OAuth 에러:", errorParam, errorDescription)
                    router.push(`/login?error=auth_failed`)
                    return
                }

                // Supabase가 자동으로 URL의 토큰을 처리함
                const { data: { session }, error: sessionError } = await supabaseAuth.auth.getSession()

                if (sessionError) {
                    console.error("세션 조회 오류:", sessionError)
                    router.push(`/login?error=auth_failed`)
                    return
                }

                if (session?.user) {
                    const user = session.user
                    const email = user.email || user.user_metadata?.email || null

                    // 기존 사용자 정보 확인
                    const { data: existingUser } = await supabaseAuth
                        .from("users")
                        .select("name, phone")
                        .eq("auth_id", user.id)
                        .single()

                    // 회원가입 정보가 없으면 회원가입 페이지로
                    if (!existingUser || !existingUser.name || !existingUser.phone) {
                        router.push("/signup")
                        return
                    }

                    // 카카오에서 가져온 정보로 기본 정보 업데이트 (이름, 전화번호는 회원가입 페이지에서 입력받음)
                    const { error: upsertError } = await supabaseAuth
                        .from("users")
                        .upsert({
                            auth_id: user.id,
                            email: email,
                        }, {
                            onConflict: "auth_id",
                        })

                    if (upsertError) {
                        console.error("사용자 프로필 저장 오류:", upsertError)
                        // 에러가 발생해도 로그인은 성공으로 처리
                    }

                    // 마이페이지로 리다이렉트
                    router.push("/mypage")
                } else {
                    // 세션이 없으면 로그인 페이지로
                    router.push("/login")
                }
            } catch (err) {
                console.error("콜백 처리 오류:", err)
                router.push(`/login?error=auth_failed`)
            }
        }

        handleCallback()
    }, [router])

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p className="text-destructive">{error}</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">로그인 처리 중...</p>
        </div>
    )
}

