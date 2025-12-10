"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { LogIn, LogOut, Loader2, User } from "lucide-react"
import { getCurrentUser, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export function HeaderAuthButton() {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<SupabaseUser | null>(null)
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await getCurrentUser()
                setUser(currentUser)
            } catch (err) {
                console.error("인증 확인 오류:", err)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [pathname])

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            setUser(null)
            router.push("/")
        } catch (err) {
            console.error("로그아웃 오류:", err)
        } finally {
            setLoggingOut(false)
        }
    }

    const handleLogin = () => {
        router.push("/login")
    }

    const handleMypage = () => {
        router.push("/mypage")
    }

    if (loading) {
        return (
            <Button variant="ghost" size="sm" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        )
    }

    if (!user) {
        return (
            <Button variant="default" size="sm" onClick={handleLogin}>
                <LogIn className="h-4 w-4 mr-2" />
                로그인
            </Button>
        )
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={loggingOut}>
                    {loggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            <User className="h-4 w-4 mr-2" />
                            {user.user_metadata?.name || "내 계정"}
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleMypage}>
                    <User className="h-4 w-4 mr-2" />
                    마이페이지
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

