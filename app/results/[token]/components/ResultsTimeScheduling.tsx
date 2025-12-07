"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { TimeResultViewer } from "@/components/time-result-viewer"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, Clock, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResultsTimeSchedulingProps {
    appointment: any
    timeResults: Array<{ date: string; time: string; count: number; voters: string[] }>
    voters: any[]
    token: string
}

export function ResultsTimeScheduling({ appointment, timeResults, voters, token }: ResultsTimeSchedulingProps) {
    const router = useRouter()
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [isTimeResultModalOpen, setIsTimeResultModalOpen] = useState(false)
    const [selectedRangeVoters, setSelectedRangeVoters] = useState<{ date: string; time: string; voters: string[] } | null>(null)
    const [isVoterModalOpen, setIsVoterModalOpen] = useState(false)

    // 날짜별로 그룹화
    const timeResultsByDate = timeResults.reduce((acc: Record<string, any[]>, result) => {
        if (!acc[result.date]) {
            acc[result.date] = []
        }
        acc[result.date].push(result)
        return acc
    }, {})

    // 날짜에 투표가 있는지 확인
    const datesWithVotes = Object.keys(timeResultsByDate).map(dateStr => parseISO(dateStr))

    // 날짜 클릭 핸들러
    const handleDateClick = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        if (timeResultsByDate[dateStr]) {
            setSelectedDate(date)
            setIsTimeResultModalOpen(true)
        }
    }

    // 선택된 날짜의 시간별 결과
    const selectedDateResults = selectedDate
        ? timeResultsByDate[format(selectedDate, "yyyy-MM-dd")] || []
        : []

    // 최적의 시간 범위 계산
    const calculateOptimalTimeRange = () => {
        if (timeResults.length === 0) return null

        // 날짜-시간별로 정렬
        const sortedResults = [...timeResults].sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date)
            }
            return a.time.localeCompare(b.time)
        })

        // 가장 많은 사람이 참여 가능한 시간대 찾기
        let bestRange = {
            date: sortedResults[0].date,
            startTime: sortedResults[0].time,
            endTime: sortedResults[0].time,
            count: sortedResults[0].count,
            voters: sortedResults[0].voters
        }

        // 연속된 시간 슬롯 중에서 평균 참여자가 많은 범위 찾기
        for (let i = 0; i < sortedResults.length; i++) {
            const current = sortedResults[i]

            // 더 많은 참여자가 있는 단일 시간대 발견
            if (current.count > bestRange.count) {
                bestRange = {
                    date: current.date,
                    startTime: current.time,
                    endTime: current.time,
                    count: current.count,
                    voters: current.voters
                }
            }

            // 연속된 시간대 체크 (같은 날짜)
            let j = i
            let minCount = current.count
            while (j < sortedResults.length - 1) {
                const next = sortedResults[j + 1]

                // 다른 날짜이거나 연속되지 않으면 중단
                if (next.date !== current.date) break

                const currentMinutes = parseInt(sortedResults[j].time.split(':')[0]) * 60 +
                    parseInt(sortedResults[j].time.split(':')[1])
                const nextMinutes = parseInt(next.time.split(':')[0]) * 60 +
                    parseInt(next.time.split(':')[1])

                if (nextMinutes - currentMinutes !== 30) break

                minCount = Math.min(minCount, next.count)

                // 연속된 범위가 더 나은 경우 (최소 참여자가 많은 경우)
                if (minCount > bestRange.count) {
                    bestRange = {
                        date: current.date,
                        startTime: current.time,
                        endTime: next.time,
                        count: minCount,
                        voters: current.voters // 대표 투표자 목록
                    }
                }

                j++
            }
        }

        return bestRange
    }

    const optimalTimeRange = calculateOptimalTimeRange()

    // Top 5 연속 시간대 계산 함수
    const calculateTopTimeRanges = () => {
        if (timeResults.length === 0) return []

        // 1. 날짜별로 그룹화하고 시간순 정렬
        const groupedByDate: Record<string, Array<{ time: string; count: number; voters: string[] }>> = {}

        timeResults.forEach(result => {
            if (!groupedByDate[result.date]) {
                groupedByDate[result.date] = []
            }
            groupedByDate[result.date].push({
                time: result.time,
                count: result.count,
                voters: result.voters
            })
        })

        // 각 날짜의 시간을 시간순으로 정렬
        Object.keys(groupedByDate).forEach(date => {
            groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time))
        })

        // 구성원이 완전히 같은지 확인하는 함수
        const isSameVoters = (voters1: string[], voters2: string[]) => {
            if (voters1.length !== voters2.length) return false
            const set1 = new Set(voters1)
            return voters2.every(v => set1.has(v))
        }

        // 2. 같은 구성원을 가진 연속 시간대를 찾아서 범위로 만들기
        const timeRanges: Array<{
            date: string
            startTime: string
            endTime: string
            count: number
            voters: string[]
        }> = []

        Object.entries(groupedByDate).forEach(([date, times]) => {
            if (times.length === 0) return

            let currentRange = {
                date,
                startTime: times[0].time,
                endTime: times[0].time,
                count: times[0].count,
                voters: [...times[0].voters]
            }

            for (let i = 1; i < times.length; i++) {
                const prevTime = times[i - 1].time
                const currTime = times[i].time

                // 30분 간격인지 확인
                const [prevHour, prevMin] = prevTime.split(':').map(Number)
                const [currHour, currMin] = currTime.split(':').map(Number)
                const prevMinutes = prevHour * 60 + prevMin
                const currMinutes = currHour * 60 + currMin

                // 연속되고 같은 구성원인 경우에만 범위 확장
                if (currMinutes - prevMinutes === 30 && isSameVoters(times[i - 1].voters, times[i].voters)) {
                    currentRange.endTime = currTime
                } else {
                    // 구성원이 다르거나 연속 끊김 -> 현재 범위 저장하고 새 범위 시작
                    timeRanges.push({
                        date: currentRange.date,
                        startTime: currentRange.startTime,
                        endTime: currentRange.endTime,
                        count: currentRange.count,
                        voters: currentRange.voters
                    })

                    currentRange = {
                        date,
                        startTime: times[i].time,
                        endTime: times[i].time,
                        count: times[i].count,
                        voters: [...times[i].voters]
                    }
                }
            }

            // 마지막 범위 추가
            timeRanges.push({
                date: currentRange.date,
                startTime: currentRange.startTime,
                endTime: currentRange.endTime,
                count: currentRange.count,
                voters: currentRange.voters
            })
        })

        // 시간 범위의 길이 계산 (분 단위)
        const getTimeRangeDuration = (startTime: string, endTime: string) => {
            const [startHour, startMin] = startTime.split(':').map(Number)
            const [endHour, endMin] = endTime.split(':').map(Number)
            const startMinutes = startHour * 60 + startMin
            const endMinutes = endHour * 60 + endMin
            return endMinutes - startMinutes + 30 // 30분 추가 (마지막 슬롯 포함)
        }

        // 3. 참여자 수로 정렬하고 상위 5개 선택
        const top5 = timeRanges
            .sort((a, b) => {
                // 1순위: 참여자 수
                if (b.count !== a.count) return b.count - a.count
                // 2순위: 시간 범위 길이 (더 긴 범위 우선)
                const aDuration = getTimeRangeDuration(a.startTime, a.endTime)
                const bDuration = getTimeRangeDuration(b.startTime, b.endTime)
                if (bDuration !== aDuration) return bDuration - aDuration
                // 3순위: 날짜
                if (a.date !== b.date) return a.date.localeCompare(b.date)
                // 4순위: 시작 시간
                return a.startTime.localeCompare(b.startTime)
            })
            .slice(0, 5)

        return top5
    }

    const topTimeRanges = calculateTopTimeRanges()

    // 종료 시간 계산 (30분 추가)
    const getEndTime = (time: string) => {
        const [hour, minute] = time.split(':').map(Number)
        const totalMinutes = hour * 60 + minute + 30
        const endHour = Math.floor(totalMinutes / 60)
        const endMinute = totalMinutes % 60
        return `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`
    }

    // 진행 바 생성 (최대 10칸)
    const getProgressBar = (count: number, maxCount: number) => {
        const barLength = Math.max(1, Math.round((count / maxCount) * 10))
        return '█'.repeat(barLength)
    }

    const maxVoterCount = Math.max(...topTimeRanges.map(r => r.count), voters.length > 0 ? voters.length : 1)

    const isDateDisabled = (date: Date) => {
        if (!appointment?.start_date || !appointment?.end_date) return false
        const startDate = parseISO(appointment.start_date)
        const endDate = parseISO(appointment.end_date)
        return date < startDate || date > endDate
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 메인 콘텐츠 영역 */}
            <div className="lg:col-span-2 space-y-6">
                {/* Top 5 투표 결과 카드 */}
                {topTimeRanges.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Crown className="h-5 w-5 text-yellow-500" />
                                투표 결과
                            </CardTitle>
                            <CardDescription>
                                가장 많은 사람이 참여 가능한 시간대
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topTimeRanges.map((range, index) => {
                                    const dateObj = parseISO(range.date)
                                    const dateLabel = format(dateObj, "M/d(eee)", { locale: ko })
                                    const startTime = range.startTime
                                    const endTime = getEndTime(range.endTime)
                                    const timeLabel = startTime === range.endTime
                                        ? startTime
                                        : `${startTime}-${endTime}`

                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => {
                                                setSelectedRangeVoters({
                                                    date: format(dateObj, "M월 d일 (E)", { locale: ko }),
                                                    time: timeLabel,
                                                    voters: range.voters
                                                })
                                                setIsVoterModalOpen(true)
                                            }}
                                            className="w-full flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            {/* 순위 */}
                                            <div className={cn(
                                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                                index === 0 && "bg-yellow-500 text-white",
                                                index === 1 && "bg-gray-400 text-white",
                                                index === 2 && "bg-amber-700 text-white",
                                                index > 2 && "bg-gray-200 text-gray-700"
                                            )}>
                                                {index + 1}
                                            </div>

                                            {/* 날짜와 시간 */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="font-semibold text-sm">
                                                        {dateLabel}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {timeLabel}
                                                    </span>
                                                </div>

                                                {/* 프로그레스 바 */}
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="text-green-600 text-xs font-mono">
                                                        {getProgressBar(range.count, maxVoterCount)}
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {range.count}명
                                                    </span>
                                                </div>
                                            </div>

                                            {/* 참여율 */}
                                            <div className="flex-shrink-0 text-right">
                                                <div className="text-sm font-bold text-green-600">
                                                    {voters.length > 0 ? Math.round((range.count / voters.length) * 100) : 0}%
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {range.count}/{voters.length}
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* 달력 표시 */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl flex justify-center items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            투표결과 달력
                        </CardTitle>
                        <CardDescription className="text-sm text-center">
                            날짜를 클릭하면 해당 날짜의 시간대별 <br />
                            참여 인원 현황을 확인할 수 있습니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full border rounded-md p-2 bg-background">
                            <CustomCalendar
                                selected={datesWithVotes}
                                onDayClick={handleDateClick}
                                className="mx-auto p-3"
                                disabled={isDateDisabled}
                                defaultMonth={parseISO(appointment.start_date)}
                                fromDate={parseISO(appointment.start_date)}
                                toDate={parseISO(appointment.end_date)}
                                showOutsideDays={false}
                                isTimeScheduling={true}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground mt-4">

                        </p>
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

            {/* 시간대별 투표 결과 모달 */}
            <Dialog open={isTimeResultModalOpen} onOpenChange={setIsTimeResultModalOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDate && format(selectedDate, "M월 d일 (E)", { locale: ko })} 시간대별 투표 현황
                        </DialogTitle>
                        <DialogDescription>
                            각 시간대를 클릭하면 참여 가능한 사람들을 확인할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <TimeResultViewer
                            dateResults={selectedDateResults}
                            totalVoters={voters.length}
                            allVoterNames={voters.map(v => v.name)}
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* 시간대별 참여 가능 인원 모달 */}
            <Dialog open={isVoterModalOpen} onOpenChange={setIsVoterModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedRangeVoters?.date} {selectedRangeVoters?.time}
                        </DialogTitle>
                        <DialogDescription>
                            참석 가능한 사람 ({selectedRangeVoters?.voters.length || 0}명)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="flex flex-wrap gap-2">
                            {selectedRangeVoters?.voters.map((voter, index) => (
                                <div
                                    key={index}
                                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                >
                                    {voter}
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
