"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CheckCircle2 } from "lucide-react"

interface ResultsRecurringProps {
    appointment: any
    weekdayResults: any
    voters: any[]
    token: string
}

const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
const weekdayShorts = ["일", "월", "화", "수", "목", "금", "토"]

export function ResultsRecurring({ appointment, weekdayResults, voters, token }: ResultsRecurringProps) {
    const router = useRouter()
    const [selectedWeekday, setSelectedWeekday] = useState<number | null>(null)
    const [showWeekdayDetail, setShowWeekdayDetail] = useState(false)

    // 요일 클릭 핸들러
    const handleWeekdayClick = (weekdayIndex: number) => {
        const result = weekdayResults[weekdayIndex]
        if (result && result.count > 0) {
            setSelectedWeekday(weekdayIndex)
            setShowWeekdayDetail(true)
        }
    }

    // 요일별 결과를 투표수 순으로 정렬
    const sortedWeekdays = Object.entries(weekdayResults)
        .map(([weekday, result]: [string, any]) => ({
            weekday: Number.parseInt(weekday),
            count: result.count,
            voters: result.voters,
            percentage: Math.round((result.count / voters.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)

    // 동률인 요일들을 모두 선택 (최소 요구 투표수와 같거나 많은 모든 요일)
    const minRequiredCount =
        sortedWeekdays.length > 0 ? sortedWeekdays[appointment.weekly_meetings - 1]?.count || 0 : 0
    const selectedWeekdays = sortedWeekdays.filter((weekday) => weekday.count >= minRequiredCount)

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 메인 콘텐츠 영역 */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 요일별 투표 결과 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg sm:text-xl">요일별 투표 현황</CardTitle>
                            <CardDescription className="text-sm">
                                투표수가 많은 순으로 정렬되었습니다. 동률인 요일들은 모두 선택됩니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
                                {weekdayShorts.map((day, weekdayIndex) => {
                                    const result = weekdayResults[weekdayIndex] || { count: 0, voters: [] }
                                    const isSelected = selectedWeekdays.some((w) => w.weekday === weekdayIndex)

                                    return (
                                        <div
                                            key={weekdayIndex}
                                            className={`relative p-2 sm:p-4 rounded-lg border-2 text-center transition-all duration-200 ${isSelected
                                                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-700 shadow-lg transform scale-105"
                                                    : result.count > 0
                                                        ? "bg-blue-50 border-blue-200 hover:border-blue-300 cursor-pointer hover:scale-105"
                                                        : "bg-gray-50 border-gray-200"
                                                }`}
                                            onClick={() => handleWeekdayClick(weekdayIndex)}
                                        >
                                            <div className={`font-medium text-xs sm:text-sm mb-1 ${isSelected ? "text-white" : "text-gray-700"}`}>
                                                {day}
                                            </div>
                                            <div
                                                className={`text-xs mb-1 sm:mb-2 hidden sm:block ${isSelected ? "text-blue-100" : "text-gray-500"}`}
                                            >
                                                {weekdayNames[weekdayIndex]}
                                            </div>
                                            <div
                                                className={`text-lg sm:text-2xl font-bold mb-1 ${isSelected ? "text-white" : result.count > 0 ? "text-blue-600" : "text-gray-400"
                                                    }`}
                                            >
                                                {result.count}
                                            </div>
                                            <div className={`text-xs ${isSelected ? "text-blue-100" : "text-gray-500"}`}>
                                                {appointment.method === "minimum-required"
                                                    ? `${result.count > 0 ? Math.round((result.count / appointment.required_participants) * 100) : 0}%`
                                                    : `${result.count > 0 ? Math.round((result.count / voters.length) * 100) : 0}%`}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* 선택된 요일 요약 */}
                            {selectedWeekdays.length > 0 && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-800 mb-2">선택된 모임 요일 ({selectedWeekdays.length}개)</h3>
                                    <div className="space-y-2">
                                        {selectedWeekdays.map((weekday, index) => (
                                            <div key={weekday.weekday} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium text-blue-900">{weekdayNames[weekday.weekday]}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-blue-700">{weekday.count}명</div>
                                                    <div className="text-sm text-blue-600">{weekday.percentage}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
                                <div className="text-3xl font-bold text-primary">
                                    {voters.length}/{appointment.required_participants}
                                </div>
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

            {/* 요일 상세 정보 모달 */}
            <Dialog open={showWeekdayDetail} onOpenChange={setShowWeekdayDetail}>
                <DialogContent className="max-w-[300px] mx-auto p-2 sm:p-6 rounded-xl max-h-[75vh]">
                    <DialogHeader>
                        <DialogTitle>요일별 상세 투표 결과</DialogTitle>
                        <DialogDescription>
                            {selectedWeekday !== null && weekdayNames[selectedWeekday]}의 투표 상세 정보
                        </DialogDescription>
                    </DialogHeader>

                    {selectedWeekday !== null && weekdayResults[selectedWeekday] && (
                        <div className="py-2">
                            <div className="space-y-2">
                                <div>
                                    <h4 className="font-medium mb-2 text-blue-700">
                                        참여 가능 ({weekdayResults[selectedWeekday].count}명)
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1 max-h-40 overflow-y-auto">
                                        {weekdayResults[selectedWeekday].voters.map((voter: any, index: number) => (
                                            <div key={index} className="flex items-center gap-1 p-1 bg-blue-50 rounded border border-blue-200">
                                                <CheckCircle2 className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                <span className="text-sm font-medium truncate">{voter}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-2 text-gray-700">참여 불가능</h4>
                                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                                        {voters
                                            .filter((voter) => !weekdayResults[selectedWeekday].voters.includes(voter.name))
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

