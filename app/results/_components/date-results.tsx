"use client"

import { useState } from "react"
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight, Crown, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShareModal } from "@/components/share-modal"
import { DateDetailModal } from "./date-detail-modal"

interface DateResultsProps {
    appointment: any
    voters: any[]
    results: any
    token: string
}

export function DateResults({ appointment, voters, results, token }: DateResultsProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [showDateDetail, setShowDateDetail] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [showShareModal, setShowShareModal] = useState(false)

    const getMethodIcon = (method: string) => {
        switch (method) {
            case "all-available":
                return <Calendar className="h-5 w-5" />
            case "max-available":
                return <Crown className="h-5 w-5" />
            case "minimum-required":
                return <CheckCircle2 className="h-5 w-5" />
            default:
                return <Calendar className="h-5 w-5" />
        }
    }

    const getMethodName = (method: string) => {
        const methodNames: Record<string, string> = {
            "all-available": "모두 가능한 날",
            "max-available": "최대 다수 가능",
            "minimum-required": "기준 인원 이상 가능",
        }
        return methodNames[method] || method
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "perfect":
                return "bg-green-500"
            case "good":
                return "bg-blue-500"
            case "possible":
                return "bg-yellow-500"
            default:
                return "bg-gray-300"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "perfect":
                return "완벽"
            case "good":
                return "좋음"
            case "possible":
                return "가능"
            default:
                return "불가능"
        }
    }

    // 날짜 클릭 핸들러
    const handleDateClick = (date: string) => {
        if (results[date] && results[date].count > 0) {
            setSelectedDate(date)
            setShowDateDetail(true)
        }
    }

    // 캘린더 날짜 생성
    const monthDays = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth),
    })

    const appointmentStartDate = appointment.start_date ? parseISO(appointment.start_date) : null
    const appointmentEndDate = appointment.end_date ? parseISO(appointment.end_date) : null

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* 헤더 */}
            <Card className="mb-6">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        {getMethodIcon(appointment.method)}
                        <CardTitle className="text-2xl">{appointment.title}</CardTitle>
                    </div>
                    <CardDescription>
                        <Badge variant="secondary" className="mb-2">
                            {getMethodName(appointment.method)}
                        </Badge>
                        <br />
                        총 {voters.length}명이 투표에 참여했습니다.
                        {appointment.start_date && appointment.end_date && (
                            <>
                                <br />
                                <span className="text-sm text-muted-foreground">
                                    투표 기간: {format(parseISO(appointment.start_date), "M월 d일", { locale: ko })} ~{" "}
                                    {format(parseISO(appointment.end_date), "M월 d일", { locale: ko })}
                                </span>
                            </>
                        )}
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* 결과 요약 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">투표 결과 요약</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(results)
                            .sort(([, a]: any, [, b]: any) => b.count - a.count)
                            .slice(0, 4)
                            .map(([date, result]: [string, any]) => (
                                <div
                                    key={date}
                                    className="text-center p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                                    onClick={() => handleDateClick(date)}
                                >
                                    <div className="text-sm font-medium">
                                        {format(parseISO(date), "M월 d일", { locale: ko })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {format(parseISO(date), "eee", { locale: ko })}
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant="outline" className={`${getStatusColor(result.status)} text-white border-none`}>
                                            {result.count}명
                                        </Badge>
                                    </div>
                                    <div className="text-xs mt-1">{getStatusText(result.status)}</div>
                                </div>
                            ))}
                    </div>
                </CardContent>
            </Card>

            {/* 캘린더 뷰 */}
            <Card className="mb-6">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">캘린더 보기</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium min-w-[100px] text-center">
                                {format(currentMonth, "yyyy년 M월", { locale: ko })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                            <div key={day} className="text-center text-sm font-medium p-2">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {monthDays.map((day) => {
                            const dateStr = format(day, "yyyy-MM-dd")
                            const result = results[dateStr]
                            const isInRange = appointmentStartDate && appointmentEndDate
                                ? day >= appointmentStartDate && day <= appointmentEndDate
                                : true

                            return (
                                <div
                                    key={dateStr}
                                    className={`
                    aspect-square p-1 text-xs border rounded cursor-pointer transition-all
                    ${!isInRange ? "opacity-30 cursor-not-allowed" : ""}
                    ${result && result.count > 0 ? "hover:shadow-md" : ""}
                    ${result && result.count > 0 ? getStatusColor(result.status) : "bg-gray-50"}
                    ${result && result.count > 0 ? "text-white" : "text-gray-500"}
                  `}
                                    onClick={() => isInRange && handleDateClick(dateStr)}
                                >
                                    <div className="text-center">
                                        <div className="font-medium">{format(day, "d")}</div>
                                        {result && result.count > 0 && (
                                            <div className="text-xs mt-1">{result.count}명</div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* 공유 버튼 */}
            <div className="text-center">
                <Button onClick={() => setShowShareModal(true)} size="lg">
                    결과 공유하기
                </Button>
            </div>

            {/* 모달들 */}
            <DateDetailModal
                isOpen={showDateDetail}
                onClose={() => setShowDateDetail(false)}
                date={selectedDate}
                result={selectedDate ? results[selectedDate] : null}
            />

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                appointmentData={appointment}
            />
        </div>
    )
}
