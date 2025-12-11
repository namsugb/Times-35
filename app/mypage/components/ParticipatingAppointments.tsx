"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Users, Timer, Vote, BarChart3 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"

interface Appointment {
    id: string
    title: string
    method: string
    status: string
    share_token: string
    start_date: string | null
    end_date: string | null
    created_at: string
    voter_name: string
}

interface ParticipatingAppointmentsProps {
    appointments: Appointment[]
    userPhone: string | null
    userName: string
}

export function ParticipatingAppointments({ appointments, userPhone, userName }: ParticipatingAppointmentsProps) {
    const router = useRouter()

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "all-available":
                return <Calendar className="h-4 w-4" />
            case "max-available":
                return <Users className="h-4 w-4" />
            case "minimum-required":
                return <Clock className="h-4 w-4" />
            case "time-scheduling":
                return <Timer className="h-4 w-4" />
            default:
                return <Calendar className="h-4 w-4" />
        }
    }

    const getMethodName = (method: string) => {
        const methodNames: Record<string, string> = {
            "all-available": "모두 가능한 날",
            "max-available": "최대 다수 가능",
            "minimum-required": "기준 인원 이상",
            "time-scheduling": "시간 정하기",
            "recurring": "정기 모임",
        }
        return methodNames[method] || method
    }

    if (appointments.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">참여중인 약속이 없습니다</h3>
                    <p className="text-muted-foreground mb-4">
                        약속에 투표하면 여기에 표시됩니다
                    </p>
                    <Button onClick={() => router.push("/")} variant="outline">
                        새 약속 만들기
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                총 {appointments.length}개의 약속에 참여중입니다
            </p>

            {appointments.map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    {getMethodIcon(appointment.method)}
                                    <h3 className="font-semibold truncate">{appointment.title}</h3>
                                </div>

                                {/* <div className="flex flex-wrap items-center gap-2 mb-3">
                                    <Badge variant="outline">{getMethodName(appointment.method)}</Badge>
                                    {getStatusBadge(appointment.status)}
                                </div> */}

                                {appointment.start_date && appointment.end_date && (
                                    <p className="text-sm text-muted-foreground mb-2">
                                        {format(parseISO(appointment.start_date), "M월 d일", { locale: ko })} -
                                        {format(parseISO(appointment.end_date), "M월 d일", { locale: ko })}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    참여자명: {appointment.voter_name}
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 ml-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/vote/${appointment.share_token}`)}
                                >
                                    <Vote className="h-4 w-4 mr-1" />
                                    투표
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/results/${appointment.share_token}`)}
                                >
                                    <BarChart3 className="h-4 w-4 mr-1" />
                                    결과
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

