"use client"

import { useEffect, useState } from "react"
import { BookOpen, Mailbox, Home, User, LogIn, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getCurrentUser, signOut } from "@/lib/auth"
import type { User as SupabaseUser } from "@supabase/supabase-js"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

// Menu items.
const items = [
    {
        title: "홈",
        url: "/",
        icon: Home,
    },
    {
        title: "만날래말래 설명서",
        url: "/guide",
        icon: BookOpen,
    },
    {
        title: "건의함",
        url: "/feedback",
        icon: Mailbox,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { setOpenMobile, isMobile } = useSidebar()
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
    }, [pathname]) // 경로가 바뀔 때마다 다시 확인

    const handleMenuClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            setUser(null)
            handleMenuClick()
            router.push("/")
        } catch (err) {
            console.error("로그아웃 오류:", err)
        } finally {
            setLoggingOut(false)
        }
    }

    const handleLogin = () => {
        handleMenuClick()
        router.push("/login")
    }

    const handleMypage = () => {
        handleMenuClick()
        router.push("/mypage")
    }

    return (
        <Sidebar variant="sidebar" className="border-r bg-sidebar">
            <SidebarHeader className="bg-sidebar">
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="text-lg font-bold text-sidebar-foreground">
                        만날래말래
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-sidebar">
                <SidebarGroup>
                    <SidebarGroupLabel>메뉴</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                    >
                                        <Link href={item.url} onClick={handleMenuClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}

                            {/* 마이페이지 (로그인 시에만 표시) */}
                            {user && (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        isActive={pathname === "/mypage"}
                                        onClick={handleMypage}
                                    >
                                        <User />
                                        <span>마이페이지</span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>


        </Sidebar>
    )
}
