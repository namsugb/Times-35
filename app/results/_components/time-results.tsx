"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Timer, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShareModal } from "@/components/share-modal"

interface TimeResultsProps {
    appointment: any
    voters: any[]
    results: any[]
    token: string
}

export function TimeResults({ appointment, voters, results, token }: TimeResultsProps) {
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

    // 결과를 날짜별로 그룹화
    const groupedResults = results.reduce((acc: any, result) => {
        const date = result.date
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(result)
        return acc
    }, {})

    // 각 날짜의 시간을 정렬
    Object.keys(groupedResults).forEach(date => {
        groupedResults[date].sort((a: any, b: any) => a.hour - b.hour)
    })

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* 헤더 */}
            <Card className="mb-6">
                <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Timer className="h-5 w-5" />
                        <CardTitle className="text-2xl">{appointment.title}</CardTitle>
                    </div>
                    <CardDescription>
                        <Badge variant="secondary" className="mb-2">
                            약속 시간정하기
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

            {/* 최고 결과 요약 */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">최고 투표 결과</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 4)
                            .map((result, index) => (
                                <div
                                    key={`${result.date}-${result.hour}`}
                                    className="text-center p-4 rounded-lg border"
                                >
                                    <div className="font-medium">
                                        {format(parseISO(result.date), "M월 d일 (eee)", { locale: ko })}
                                    </div>
                                    <div className="text-lg font-bold text-primary">
                                        {result.hour}:00
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

            {/* 날짜별 상세 결과 */}
            <div className="space-y-6">
                {Object.entries(groupedResults)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([date, timeResults]: [string, any]) => (
                        <Card key={date}>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    {format(parseISO(date), "M월 d일 (eee)", { locale: ko })}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                    {timeResults.map((result: any) => (
                                        <div
                                            key={result.hour}
                                            className={`
                        text-center p-2 rounded-lg text-white font-medium
                        ${getStatusColor(result.count, voters.length)}
                        ${result.count === 0 ? 'opacity-30' : ''}
                      `}
                                        >
                                            <div className="text-sm">{result.hour}:00</div>
                                            <div className="text-xs">{result.count}명</div>
                                        </div>
                                    ))}
                                </div>
                                {timeResults.some((r: any) => r.count > 0) && (
                                    <div className="mt-4 text-sm text-muted-foreground">
                                        최고: {Math.max(...timeResults.map((r: any) => r.count))}명 |{" "}
                                        가능한 시간대: {timeResults.filter((r: any) => r.count > 0).length}개
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
            </div>

            {/* 공유 버튼 */}
            <div className="text-center mt-8">
                <Button onClick={() => setShowShareModal(true)} size="lg">
                    결과 공유하기
                </Button>
            </div>

            {/* 공유 모달 */}
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                appointmentData={appointment}
            />
        </div>
    )
}
