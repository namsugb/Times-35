"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, Clock, Crown } from "lucide-react"

interface ResultsTimeSchedulingProps {
    appointment: any
    timeResults: any[]
    voters: any[]
    token: string
}

export function ResultsTimeScheduling({ appointment, timeResults, voters, token }: ResultsTimeSchedulingProps) {
    const router = useRouter()

    // 시간 투표 결과 처리
    const timeResultsByDate = timeResults.reduce((acc: any, result: any) => {
        if (!acc[result.date]) {
            acc[result.date] = []
        }
        acc[result.date].push(result)
        return acc
    }, {})

    // 최적의 시간대 계산
    const getOptimalTimeSlots = () => {
        const timeSlotMap = new Map()

        Object.entries(timeResultsByDate).forEach(([date, slots]: [string, any]) => {
            slots.forEach((slot: any) => {
                const key = `${date}-${slot.hour}`
                if (!timeSlotMap.has(key)) {
                    timeSlotMap.set(key, {
                        date,
                        hour: slot.hour,
                        voters: new Set(),
                        count: 0,
                    })
                }
                timeSlotMap.get(key).voters.add(slot.voter_name)
                timeSlotMap.get(key).count = timeSlotMap.get(key).voters.size
            })
        })

        return Array.from(timeSlotMap.values())
            .sort((a, b) => b.count - a.count)
            .map((slot) => ({
                ...slot,
                voters: Array.from(slot.voters),
                percentage: Math.round((slot.count / voters.length) * 100),
            }))
    }

    const optimalTimeSlots = getOptimalTimeSlots()
    const bestTimeSlot = optimalTimeSlots[0]

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-2 space-y-6">
                {/* 최적 시간대 추천 */}
                {bestTimeSlot && (
                    <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl flex items-center gap-2 text-emerald-800">
                                <Crown className="h-5 w-5" />
                                🏆 최적의 약속 시간
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="bg-white rounded-lg p-4 border border-emerald-200">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-emerald-600" />
                                            <span className="font-semibold text-emerald-800">
                                                {format(parseISO(bestTimeSlot.date), "M월 d일 (E)", { locale: ko })}
                                            </span>
                                        </div>
                                        <Badge className="bg-emerald-100 text-emerald-800">{bestTimeSlot.count}명 참여</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <Clock className="h-4 w-4 text-emerald-600" />
                                        <span className="text-lg font-bold text-emerald-700">{bestTimeSlot.hour}시</span>
                                        <span className="text-sm text-emerald-600">({bestTimeSlot.percentage}% 참여율)</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {bestTimeSlot.voters.map((voter: string, index: number) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700"
                                            >
                                                {voter}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 날짜별 시간대 히트맵 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            📅 날짜별 시간대 가용성
                        </CardTitle>
                        <CardDescription className="text-sm">각 날짜와 시간대별 참여 가능한 인원을 확인할 수 있습니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {Object.entries(timeResultsByDate).map(([date, slots]: [string, any]) => {
                                const hourMap = slots.reduce((acc: any, slot: any) => {
                                    if (!acc[slot.hour]) {
                                        acc[slot.hour] = new Set()
                                    }
                                    acc[slot.hour].add(slot.voter_name)
                                    return acc
                                }, {})

                                return (
                                    <div key={date} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar className="h-4 w-4 text-gray-600" />
                                            <span className="font-semibold text-gray-800">
                                                {format(parseISO(date), "M월 d일 (E)", { locale: ko })}
                                            </span>
                                        </div>

                                        {/* 시간대 그리드 */}
                                        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
                                            {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                                                const votersSet = hourMap[hour] || new Set()
                                                const count = votersSet.size
                                                const percentage = votersSet.size > 0 ? Math.round((count / voters.length) * 100) : 0

                                                const getHeatColor = () => {
                                                    if (count === 0) return "bg-gray-100 text-gray-400 border-gray-200"
                                                    if (count === voters.length) return "bg-emerald-500 text-white border-emerald-600"
                                                    if (percentage >= 80) return "bg-green-400 text-white border-green-500"
                                                    if (percentage >= 60) return "bg-green-300 text-gray-900 border-green-400"
                                                    if (percentage >= 40) return "bg-green-200 text-gray-800 border-green-300"
                                                    return "bg-green-100 text-gray-700 border-green-200"
                                                }

                                                return (
                                                    <div
                                                        key={hour}
                                                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer ${getHeatColor()}`}
                                                        title={`${hour}시: ${count}명 참여 가능`}
                                                    >
                                                        <span className="text-xs">{hour}</span>
                                                        {count > 0 && <span className="text-xs font-bold">{count}</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* 범례 */}
                                        <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                                                <span>불가능</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                                                <span>일부 가능</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 bg-emerald-500 border border-emerald-600 rounded"></div>
                                                <span>전원 가능</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* 사이드바 */}
            <div className="space-y-6">
                {/* 통계 정보 */}
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center space-y-3">
                            <div className="text-3xl font-bold text-primary">{voters.length}</div>
                            <div className="text-lg font-medium">참여 인원</div>
                            {voters.length > 0 && (
                                <div className="text-sm text-muted-foreground break-words">
                                    {voters.map((voter) => voter.name).join(", ")}
                                </div>
                            )}
                        </div>
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
    )
}

