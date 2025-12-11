import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")
    const error = requestUrl.searchParams.get("error")
    const errorDescription = requestUrl.searchParams.get("error_description")
    const origin = requestUrl.origin
    console.log('request:', request)

    // 에러가 있으면 로그인 페이지로 리다이렉트
    if (error) {
        console.error("OAuth 에러:", error, errorDescription)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // code가 없으면 로그인 페이지로 리다이렉트
    if (!code) {
        console.error("인증 코드 없음")
        return NextResponse.redirect(`${origin}/login?error=no_code`)
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
        }
    )

    // 인증 코드를 세션으로 교환
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
        console.error("세션 교환 오류:", exchangeError)
        return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    console.log("data:", data)

    // 카카오 계정 정보를 저장할 변수
    let kakaoAccountInfo: {
        email?: string
        name?: string
        phone_number?: string
        gender?: string
        age_range?: string
        birthyear?: string
        birthday?: string
    } | null = null

    // 카카오 동의항목 동의 내역 조회
    if (data.session?.provider_token) {
        const kakaoAccessToken = data.session.provider_token

        try {
            // 동의항목 동의 내역 조회 API 호출
            const scopesResponse = await fetch("https://kapi.kakao.com/v2/user/scopes", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${kakaoAccessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                },
            })

            if (scopesResponse.ok) {
                const scopesData = await scopesResponse.json()
                console.log("카카오 동의항목 동의 내역:", JSON.stringify(scopesData, null, 2))

                // 각 동의항목 상세 출력
                if (scopesData.scopes) {
                    scopesData.scopes.forEach((scope: any) => {
                        console.log(`- ${scope.id}: ${scope.display_name}`)
                        console.log(`  동의 여부: ${scope.agreed ? "동의함" : "동의안함"}`)
                        console.log(`  사용 여부: ${scope.using ? "사용중" : "미사용"}`)
                        if (scope.agreed && scope.revocable !== undefined) {
                            console.log(`  철회 가능: ${scope.revocable ? "가능" : "불가능"}`)
                        }
                    })
                }
            } else {
                const errorData = await scopesResponse.text()
                console.error("카카오 동의항목 조회 실패:", scopesResponse.status, errorData)
            }

            // 카카오 사용자 정보 조회 API 호출 (동의한 항목에 대한 실제 데이터 확인)
            const userInfoResponse = await fetch("https://kapi.kakao.com/v2/user/me", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${kakaoAccessToken}`,
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                },
            })

            if (userInfoResponse.ok) {
                const userInfoData = await userInfoResponse.json()
                console.log("카카오 사용자 정보:", JSON.stringify(userInfoData, null, 2))

                // kakao_account에서 상세 정보 저장
                if (userInfoData.kakao_account) {
                    const account = userInfoData.kakao_account
                    kakaoAccountInfo = {
                        email: account.email,
                        name: account.name,
                        phone_number: account.phone_number,
                        gender: account.gender,
                        age_range: account.age_range,
                        birthyear: account.birthyear,
                        birthday: account.birthday,
                    }
                    console.log("=== 카카오 계정 정보 ===")
                    console.log("이메일:", account.email)
                    console.log("이름:", account.name)
                    console.log("전화번호:", account.phone_number)
                    console.log("성별:", account.gender)
                    console.log("연령대:", account.age_range)
                    console.log("생년:", account.birthyear)
                    console.log("생일:", account.birthday)
                }
            } else {
                const errorData = await userInfoResponse.text()
                console.error("카카오 사용자 정보 조회 실패:", userInfoResponse.status, errorData)
            }
        } catch (error) {
            console.error("카카오 API 조회 오류:", error)
        }
    } else {
        console.log("카카오 액세스 토큰이 없습니다. provider_token:", data.session?.provider_token)
    }

    if (data.user) {
        const user = data.user
        const email = kakaoAccountInfo?.email || user.email || user.user_metadata?.email || null

        // 기본 이름 생성 (카카오 실명 > 이메일 앞부분 > 기타)
        const defaultName = kakaoAccountInfo?.name ||
            (email ? email.split("@")[0] : null) ||
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.preferred_username ||
            "사용자"

        // 전화번호 포맷 정리 (예: +82 010-1234-5678 -> 010-1234-5678)
        let phone = kakaoAccountInfo?.phone_number || null
        if (phone) {
            // +82 제거하고 공백 제거
            phone = phone.replace(/^\+82\s*/, "0").trim()
        }

        // 생년월일 처리
        let birthDate = null
        if (kakaoAccountInfo?.birthyear && kakaoAccountInfo?.birthday) {
            // birthyear: "1990", birthday: "1130" -> "1990-11-30"
            const year = kakaoAccountInfo.birthyear
            const month = kakaoAccountInfo.birthday.substring(0, 2)
            const day = kakaoAccountInfo.birthday.substring(2, 4)
            birthDate = `${year}-${month}-${day}`
        }

        // public.users에 사용자 레코드가 없으면 생성 (최초 1회만)
        const { data: existingUser, error: selectError } = await supabase
            .from("users")
            .select("id, name, phone")
            .eq("auth_id", user.id)
            .single()

        // 사용자 레코드가 없으면 생성 (최초 로그인 시에만 카카오 정보 저장)
        if (!existingUser || (selectError as any)?.code === "PGRST116") {
            const { error: insertError } = await supabase
                .from("users")
                .insert({
                    auth_id: user.id,
                    email: email,
                    name: defaultName,
                    phone: phone,
                    gender: kakaoAccountInfo?.gender || null,
                    age_range: kakaoAccountInfo?.age_range || null,
                    birth_date: birthDate,
                    birth_year: kakaoAccountInfo?.birthyear ? parseInt(kakaoAccountInfo.birthyear) : null,
                })

            if (insertError && (insertError as any).code !== "23505") {
                // 23505는 unique violation (이미 존재하는 경우) - 무시
                console.error("사용자 프로필 생성 오류:", insertError)
            } else {
                console.log("카카오 사용자 정보가 public.users에 저장되었습니다.")
            }
        } else {
            console.log("기존 사용자입니다. 카카오 정보를 업데이트하지 않습니다.")
        }
    }

    // 저장된 리다이렉트 URL 확인 (쿠키에서)
    const redirectCookie = cookieStore.get("redirectAfterLogin")?.value
    const redirectTo = redirectCookie ? decodeURIComponent(redirectCookie) : "/"

    // 쿠키 삭제
    cookieStore.delete("redirectAfterLogin")

    // 절대 경로인지 확인하고 상대 경로로 변환
    const finalRedirect = redirectTo.startsWith("/") ? redirectTo : "/"

    return NextResponse.redirect(`${origin}${finalRedirect}`)
}
