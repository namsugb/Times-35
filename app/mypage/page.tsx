"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getCurrentUser, signOut, getUserName, getUserEmail, getUserPhone } from "@/lib/auth"
import { ParticipatingAppointments } from "./components/ParticipatingAppointments"
import { GroupsTab } from "./components/GroupsTab"
import { Calendar, Users, LogOut, Loader2 } from "lucide-react"
import type { User } from "@supabase/supabase-js"

export default function MyPage() {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [loggingOut, setLoggingOut] = useState(false)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const currentUser = await getCurrentUser()
                if (!currentUser) {
                    router.push("/login")
                    return
                }
                setUser(currentUser)
            } catch (err) {
                console.error("인증 확인 오류:", err)
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [router])

    const handleLogout = async () => {
        try {
            setLoggingOut(true)
            await signOut()
            router.push("/")
        } catch (err) {
            console.error("로그아웃 오류:", err)
        } finally {
            setLoggingOut(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!user) {
        return null
    }

    const userName = getUserName(user) || "사용자"
    const userEmail = getUserEmail(user)
    const userPhone = getUserPhone(user)
    const userInitial = userName.charAt(0).toUpperCase()

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">


            {/* 탭 콘텐츠 */}
            <Tabs defaultValue="appointments" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="appointments" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        참여중인 약속
                    </TabsTrigger>
                    <TabsTrigger value="groups" className="gap-2">
                        <Users className="h-4 w-4" />
                        그룹
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="appointments">
                    <ParticipatingAppointments userPhone={userPhone} userName={userName} />
                </TabsContent>

                <TabsContent value="groups">
                    <GroupsTab userId={user.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

