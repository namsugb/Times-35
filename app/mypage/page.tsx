import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createServerClient } from "@/lib/supabase-server"
import { ParticipatingAppointments } from "./components/ParticipatingAppointments"
import { GroupsTab } from "./components/GroupsTab"
import { Calendar, Users } from "lucide-react"

export default async function MyPage() {
    const supabase = await createServerClient()

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect("/login")
    }

    // 사용자 프로필 정보 가져오기
    const { data: userProfile } = await supabase
        .from("users")
        .select("name, phone")
        .eq("auth_id", user.id)
        .single()

    const userName = userProfile?.name || user.user_metadata?.name || user.user_metadata?.full_name || "사용자"
    const userPhone = userProfile?.phone || user.user_metadata?.phone || null

    // 서버에서 appointments 데이터 가져오기
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
        .eq("name", userName)
        .order("voted_at", { ascending: false })

    // appointments 데이터 변환
    const appointmentsMap = new Map()
    if (voters && !votersError) {
        for (const voter of voters) {
            const appointment = voter.appointments as any
            if (appointment && !appointmentsMap.has(appointment.id)) {
                appointmentsMap.set(appointment.id, {
                    ...appointment,
                    voter_name: voter.name,
                })
            }
        }
    }
    const appointments = Array.from(appointmentsMap.values())

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
                    <ParticipatingAppointments
                        appointments={appointments}
                        userPhone={userPhone}
                        userName={userName}
                    />
                </TabsContent>

                <TabsContent value="groups">
                    <GroupsTab userId={user.id} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

