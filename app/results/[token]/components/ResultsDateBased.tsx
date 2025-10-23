"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    format,
    parseISO,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
} from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, ChevronLeft, ChevronRight, Crown, CheckCircle2, Users } from "lucide-react"

interface ResultsDateBasedProps {
    appointment: any
    dateResults: any
    voters: any[]
    token: string
}

export function ResultsDateBased({ appointment, dateResults, voters, token }: ResultsDateBasedProps) {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<string | null>(null)
    const [showDateDetail, setShowDateDetail] = useState(false)
    const [currentMonth, setCurrentMonth] = useState(
        appointment?.start_date ? parseISO(appointment.start_date) : new Date()
    )

    // 날짜 클릭 핸들러
    const handleDateClick = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        if (dateResults[dateStr] && dateResults[dateStr].count > 0) {
            setSelectedDate(dateStr)
            setShowDateDetail(true)
        }
    }

    // 월 네비게이션
    const goToPreviousMonth = () => {
        setCurrentMonth((prev) => subMonths(prev, 1))
    }
    const goToNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1))
    }

    // 현재 월에 투표 가능한 날짜가 있는지 확인
    const hasVotesInCurrentMonth = () => {
        if (!appointment?.start_date || !appointment?.end_date) return false

        const monthStart = startOfMonth(currentMonth)
        const monthEnd = endOfMonth(currentMonth)
        const appointmentStart = parseISO(appointment.start_date)
        const appointmentEnd = parseISO(appointment.end_date)

        return appointmentStart <= monthEnd && appointmentEnd >= monthStart
    }

    // 투표 수에 따른 색상 강도 계산
    const getColorIntensity = (count: number, totalVoters: number) => {
        if (count === 0) return "bg-gray-50 text-gray-400 border-gray-100"

        const percentage = totalVoters > 0 ? (count / totalVoters) * 100 : 0

        if (percentage === 100) return "bg-emerald-500 text-white border-emerald-600 shadow-sm"
        if (percentage >= 80) return "bg-green-500 text-white border-green-600 shadow-sm"
        if (percentage >= 60) return "bg-green-400 text-white border-green-500"
        if (percentage >= 40) return "bg-green-300 text-gray-900 border-green-400"
        if (percentage >= 20) return "bg-green-200 text-gray-800 border-green-300"
        return "bg-green-100 text-gray-700 border-green-200"
    }

    // 최적의 날짜 계산
    const getOptimalDates = () => {
        const sortedDates = Object.entries(dateResults)
            .map(([date, result]: [string, any]) => ({
                date,
                count: result.count,
                voters: result.voters,
                percentage:
                    appointment.method === "minimum-required"
                        ? Math.round((result.count / appointment.required_participants) * 100)
                        : Math.round((result.count / voters.length) * 100),
            }))
            .sort((a, b) => b.count - a.count)

        const allAvailable = sortedDates.filter((d) => d.count === appointment.required_participants)
        const maxCount = sortedDates.length > 0 ? sortedDates[0].count : 0
        const maxAvailable = sortedDates.filter((d) => d.count === maxCount)
        const requiredAvailable = sortedDates.filter((d) => d.count >= appointment.required_participants)

        return {
            allAvailable,
            maxAvailable,
            requiredAvailable,
        }
    }

    const optimalDates = getOptimalDates()

    // 특별한 날짜인지 확인 (최적의 날짜들) 아이콘 추가
    const getDateBadge = (dateStr: string) => {
        const result = dateResults[dateStr]
        if (!result) return null

        if (appointment.method === "all-available" && optimalDates.allAvailable.some((d) => d.date === dateStr)) {
            return <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-white rounded-full" />
        }
        if (appointment.method === "max-available" && optimalDates.maxAvailable.some((d) => d.date === dateStr)) {
            return <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full" />
        }
        if (appointment.method === "minimum-required" && optimalDates.requiredAvailable.some((d) => d.date === dateStr)) {
            return <Users className="absolute -top-1 -right-1 h-4 w-4 text-blue-500 bg-white rounded-full" />
        }
        return null
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 메인 콘텐츠 영역 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 달력 투표 결과 */}
                    <Card>
                        <CardHeader>
                            <div className="space-y-4">
                                <div>
                                    <CardTitle className="text-lg sm:text-xl">투표 결과 달력</CardTitle>
                                    <CardDescription className="text-sm mt-2">
                                        색이 진할수록 더 많은 사람이 선택한 날짜입니다. 날짜를 클릭하면 상세 정보를 볼 수 있습니다.
                                    </CardDescription>
                                </div>
                                <div className="flex items-center justify-center gap-4">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={goToPreviousMonth}
                                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <div className="text-lg font-semibold min-w-[140px] text-center">
                                        {format(currentMonth, "yyyy년 M월", { locale: ko })}
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={goToNextMonth}
                                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {hasVotesInCurrentMonth() ? (
                                <>
                                    {/* 요일 헤더 */}
                                    <div className="grid grid-cols-7 gap-1 mb-3">
                                        {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                                            <div
                                                key={day}
                                                className={`text-center py-2 text-sm font-medium ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-600"
                                                    }`}
                                            >
                                                {day}
                                            </div>
                                        ))}
                                    </div>

                                    {/* 달력 그리드 */}
                                    <div className="grid grid-cols-7 gap-1">
                                        {/* 월 시작 전 빈 칸 */}
                                        {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                                            <div key={`empty-start-${i}`} className="aspect-square"></div>
                                        ))}

                                        {/* 실제 날짜들 */}
                                        {eachDayOfInterval({
                                            start: startOfMonth(currentMonth),
                                            end: endOfMonth(currentMonth),
                                        }).map((day) => {
                                            const dateStr = format(day, "yyyy-MM-dd")
                                            const result = dateResults[dateStr] || { count: 0, voters: [] }
                                            const isInRange =
                                                appointment.start_date &&
                                                appointment.end_date &&
                                                day >= parseISO(appointment.start_date) &&
                                                day <= parseISO(appointment.end_date)
                                            const colorClasses = isInRange
                                                ? getColorIntensity(result.count, voters.length)
                                                : "bg-gray-50 text-gray-300 border-gray-100"

                                            return (
                                                <div
                                                    key={dateStr}
                                                    className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer border transition-all duration-200 ${colorClasses} ${result.count > 0 && isInRange ? "hover:scale-105 hover:shadow-md active:scale-95" : ""
                                                        } ${!isInRange ? "cursor-default" : ""}`}
                                                    onClick={() => isInRange && result.count > 0 && handleDateClick(day)}
                                                >
                                                    <span className="text-sm font-semibold mb-0.5">{format(day, "d")}</span>
                                                    {isInRange && result.count > 0 && (
                                                        <div className="text-center">
                                                            <div className="text-xs font-medium leading-none">{result.count}</div>
                                                            <div className="text-xs opacity-75 leading-none mt-0.5 hidden sm:block">
                                                                {appointment.method === "minimum-required"
                                                                    ? `${Math.round((result.count / appointment.required_participants) * 100)}%`
                                                                    : `${Math.round((result.count / voters.length) * 100)}%`}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {getDateBadge(dateStr)}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>이 달에는 투표 가능한 날짜가 없습니다.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 사이드바 */}
                <div className="space-y-6">
                    {/* 통계 정보 */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center space-y-3">
                                {appointment.method === "minimum-required" ? (
                                    <div className="text-3xl font-bold text-primary">{voters.length}</div>
                                ) : (
                                    <div className="text-3xl font-bold text-primary">
                                        {voters.length}/{appointment.required_participants}
                                    </div>
                                )}
                                <div className="text-lg font-medium">참여 인원</div>
                                {voters.length > 0 && (
                                    <div className="text-sm text-muted-foreground break-words">
                                        {voters.map((voter) => voter.name).join(", ")}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* 최적의 날짜 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">투표 결과</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* 전원 참여 가능 */}
                            {appointment.method === "all-available" && (
                                <div>
                                    {optimalDates.allAvailable.length > 0 ? (
                                        <>
                                            <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                                                <CheckCircle2 className="h-4 w-4" />
                                                전원 참여 가능
                                            </h4>
                                            <div className="space-y-2">
                                                {optimalDates.allAvailable.map((date) => (
                                                    <div
                                                        key={date.date}
                                                        className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                                                    >
                                                        <span className="truncate font-medium">
                                                            {format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}
                                                        </span>
                                                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 flex-shrink-0">
                                                            {date.count}명
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-center text-red text-sm text-muted-foreground py-4 bg-gray-50 rounded-lg">
                                            전원이 참여 가능한 날이 없습니다
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 최다 참여 */}
                            {appointment.method === "max-available" && (
                                <div>
                                    {optimalDates.maxAvailable.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                                                <Crown className="h-4 w-4" />
                                                최다 참여
                                            </h4>
                                            <div className="space-y-2">
                                                {optimalDates.maxAvailable.map((date) => (
                                                    <div
                                                        key={date.date}
                                                        className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                                                    >
                                                        <span className="truncate font-medium">
                                                            {format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}
                                                        </span>
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                                                            {date.count}명
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 기준 인원 이상 */}
                            {appointment.method === "minimum-required" && (
                                <div>
                                    <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        {appointment.required_participants}명 이상 가능한 날
                                    </h4>
                                    {!optimalDates.requiredAvailable || optimalDates.requiredAvailable.length === 0 ? (
                                        <div className="text-center text-red text-sm text-muted-foreground py-4 bg-gray-50 rounded-lg">
                                            아직 없음
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {optimalDates.requiredAvailable.map((date) => (
                                                <div
                                                    key={date.date}
                                                    className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-200"
                                                >
                                                    <span className="truncate font-medium">
                                                        {format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}
                                                    </span>
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex-shrink-0">
                                                        {date.count}명
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {optimalDates.allAvailable.length === 0 &&
                                optimalDates.maxAvailable.length === 0 &&
                                optimalDates.requiredAvailable.length === 0 && (
                                    <div className="text-center py-6 text-muted-foreground text-sm bg-gray-50 rounded-lg">
                                        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>아직 투표 결과가 없습니다</p>
                                    </div>
                                )}
                        </CardContent>
                    </Card>

                    {/* 추가 액션 버튼들 */}
                    <div className="space-y-3">
                        <Button onClick={() => router.push(`/vote/${token}`)} className="w-full">
                            투표 페이지로 이동
                        </Button>
                        <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                            새 약속 만들기
                        </Button>
                    </div>
                </div>
            </div>

            {/* 날짜 상세 정보 모달 */}
            <Dialog open={showDateDetail} onOpenChange={setShowDateDetail}>
                <DialogContent className="max-w-[300px] mx-auto p-2 sm:p-6 rounded-xl max-h-[75vh]">
                    <DialogHeader>
                        <DialogTitle>날짜별 상세 투표 결과</DialogTitle>
                        <DialogDescription>
                            {selectedDate && format(parseISO(selectedDate), "M월 d일 (E)", { locale: ko })}의 투표 상세 정보
                        </DialogDescription>
                    </DialogHeader>

                    {selectedDate && dateResults[selectedDate] && (
                        <div className="py-2">
                            <div className="space-y-2">
                                <div>
                                    <h4 className="font-medium mb-2 text-green-700">참여 가능 ({dateResults[selectedDate].count}명)</h4>
                                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                        {dateResults[selectedDate].voterss.map((voter: any, index: number) => (
                                            <div key={index} className="flex items-center gap-1 p-1 bg-green-50 rounded border border-green-200">
                                                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">{voter}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2 text-gray-700">참여 불가능</h4>
                                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                                        {voters
                                            .filter((voter) => !dateResults[selectedDate].voterss.includes(voter.name))
                                            .map((voter) => voter.name)
                                            .join(", ") || "없음"}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    )
}

