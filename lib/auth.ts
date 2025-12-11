"use client"

import { supabase } from "./supabase"
import type { User, Session } from "@supabase/supabase-js"

// 기존 supabase 클라이언트를 재사용 (세션 공유를 위해)
export const supabaseAuth = supabase

export async function signInWithKakao() {
    const { data, error } = await supabaseAuth.auth.signInWithOAuth({
        provider: "kakao",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: "name, phone_number gender birthyear",

        },
    })

    if (error) {
        console.error("카카오 로그인 오류:", error)
        throw error
    }
    console.log("data:", data)
    return data
}

// 이메일/비밀번호 회원가입
export async function signUpWithEmail(email: string, password: string) {
    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
    })

    if (error) {
        console.error("회원가입 오류:", error)
        throw error
    }

    return data
}

// 이메일/비밀번호 로그인
export async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error("로그인 오류:", error)
        throw error
    }

    return data
}

// 로그아웃
export async function signOut() {
    const { error } = await supabaseAuth.auth.signOut()

    if (error) {
        console.error("로그아웃 오류:", error)
        throw error
    }
}

// 현재 세션 가져오기
export async function getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabaseAuth.auth.getSession()

    if (error) {
        console.error("세션 조회 오류:", error)
        return null
    }

    return session
}

// 현재 사용자 가져오기
export async function getCurrentUser(): Promise<User | null> {
    // 먼저 세션 확인 (에러 방지)
    const { data: { session } } = await supabaseAuth.auth.getSession()

    // 세션이 없으면 로그인하지 않은 상태
    if (!session) {
        return null
    }

    // 세션이 있으면 사용자 정보 조회
    const { data: { user }, error } = await supabaseAuth.auth.getUser()

    if (error) {
        // 실제 에러만 로깅 (세션 없음은 정상 케이스)
        console.error("사용자 조회 오류:", error)
        return null
    }

    return user
}

// 사용자 정보에서 전화번호 추출
export function getUserPhone(user: User | null): string | null {
    if (!user) return null

    // 카카오 사용자 메타데이터에서 전화번호 추출
    const phone = user.user_metadata?.phone_number ||
        user.user_metadata?.phone ||
        user.phone ||
        null

    return phone
}

// 사용자 정보에서 이름 추출
export function getUserName(user: User | null): string | null {
    if (!user) return null

    const name = user.user_metadata?.name ||
        user.user_metadata?.full_name ||
        user.user_metadata?.preferred_username ||
        user.email?.split("@")[0] ||
        null

    return name
}

// 사용자 정보에서 이메일 추출
export function getUserEmail(user: User | null): string | null {
    if (!user) return null

    return user.email || user.user_metadata?.email || null
}

// 인증 상태 변경 리스너
export function onAuthStateChange(callback: (user: User | null) => void) {
    return supabaseAuth.auth.onAuthStateChange((event, session) => {
        callback(session?.user ?? null)
    })
}

// users 테이블에 사용자 정보 저장/업데이트
export async function upsertUserProfile(user: User) {
    const phone = getUserPhone(user)
    const name = getUserName(user) || "사용자"
    const email = getUserEmail(user)

    const { data, error } = await supabaseAuth
        .from("users")
        .upsert({
            auth_id: user.id,
            name: name,
            email: email,
            phone: phone,
        }, {
            onConflict: "auth_id",
        })
        .select()
        .single()

    if (error) {
        console.error("사용자 프로필 저장 오류:", error)
        // 에러가 발생해도 로그인 흐름은 계속 진행
        return null
    }

    return data
}

