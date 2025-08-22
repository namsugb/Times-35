"use client"

import { useState } from "react"
import { Repeat, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShareModal } from "@/components/share-modal"
import { WeekdayDetailModal } from "./weekday-detail-modal"

interface WeekdayResultsProps {
    appointment: any
    voters: any[]
    results: any
    token: string
}

const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
const weekdayShort = ["일", "월", "화", "수", "목", "금", "토"]

export function WeekdayResults({ appointment, voters, results, token }: WeekdayResultsProps) {
    const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null)
    const [showWeekdayDetail, setShowWeekdayDetail] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)

    const getStatusColor = (count: number, totalVoters: number) => {
        const percentage = (count / totalVoters) * 100
        if (percentage >= 80) return "bg-green-500"
        if (percentage >= 60) return "bg-blue-500"
        if (percentage >= 40) return "bg-yellow-500"
        return "bg-gray-400"
    }

    const getStatusText = (count: number, totalVoters: number) => {
        const percentage = (count / totalVoters) * 100
        if (percentage >= 80) return "완벽"
        if (percentage >= 60) return "좋음"
        if (percentage >= 40) return "가능"
        return "어려움"
    }

    // 요일 클릭 핸들러
    const handleWeekdayClick = (weekdayId: number) => {
        if (results[weekdayId] && results[weekdayId].count > 0) {
            setSelectedWeekday(weekdayId)
            setShowWeekdayDetail(true)
        }
    }

    // 요일별 결과를 배열로 변환하고 정렬
    const weekdayResultsArray = Object.entries(results)
        .map(([weekday, result]: [string, any]) => ({
            weekday: parseInt(weekday),
            ...result
        }))
        .sort((a, b) => b.count - a.count)

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* 헤더 */}
            <Card className="mb-6">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Repeat className="h-5 w-5" />
                        <CardTitle className="text-2xl">{appointment.title}</CardTitle>
                    </div>
                    <CardDescription>
                        <Badge variant="secondary" className="mb-2">
                            반복 일정 선택
                        </Badge>
                        <br />
                        총 {voters.length}명이 투표에 참여했습니다.
                        <br />
                        <span className="text-sm text-primary">
                            일주일에 {appointment.weekly_meetings}번 만날 예정입니다.
                        </span>
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
                        {weekdayResultsArray.slice(0, 4).map((result) => (
                            <div
                                key={result.weekday}
                                className="text-center p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleWeekdayClick(result.weekday)}
                            >
                                <div className="text-sm font-medium">
                                    {weekdayNames[result.weekday]}
                                </div>
                                <div className="mt-2">
                                    <Badge
                                        variant="outline"
                                        className={`${getStatusColor(result.count, voters.length)} text-white border-none`}
                                    >
                                        {result.count}명
                                    </Badge>
                                </div>
                                <div className="text-xs mt-1">
                                    {getStatusText(result.count, voters.length)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 전체 요일별 결과 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">전체 요일별 결과</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {weekdayResultsArray.map((result) => (
                            <div
                                key={result.weekday}
                                className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => handleWeekdayClick(result.weekday)}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getStatusColor(result.count, voters.length)}`}
                                    >
                                        {weekdayShort[result.weekday]}
                                    </div>
                                    <div>
                                        <div className="font-medium">{weekdayNames[result.weekday]}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {result.count}명 참석 가능 ({Math.round((result.count / voters.length) * 100)}%)
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline">
                                        {getStatusText(result.count, voters.length)}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 추천 조합 */}
            {appointment.weekly_meetings > 1 && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            추천 조합 (주 {appointment.weekly_meetings}회)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center text-muted-foreground">
                            <p>가장 많은 사람이 참석 가능한 조합을 확인해보세요.</p>
                            <div className="mt-4 space-y-2">
                                {weekdayResultsArray
                                    .slice(0, appointment.weekly_meetings)
                                    .map((result) => (
                                        <Badge key={result.weekday} variant="secondary" className="mr-2">
                                            {weekdayNames[result.weekday]} ({result.count}명)
                                        </Badge>
                                    ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 공유 버튼 */}
            <div className="text-center">
                <Button onClick={() => setShowShareModal(true)} size="lg">
                    결과 공유하기
                </Button>
            </div>

            {/* 모달들 */}
            <WeekdayDetailModal
                isOpen={showWeekdayDetail}
                onClose={() => setShowWeekdayDetail(false)}
                weekday={selectedWeekday}
                result={selectedWeekday !== null ? results[selectedWeekday] : null}
            />

            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                appointmentData={appointment}
            />
        </div>
    )
}
