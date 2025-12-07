"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface TimeSlotResult {
    time: string
    count: number
    voters: string[]
}

interface TimeResultViewerProps {
    dateResults: TimeSlotResult[]
    totalVoters: number
    allVoterNames: string[]  // 전체 투표자 이름 목록
    className?: string
}

export function TimeResultViewer({ dateResults, totalVoters, allVoterNames, className }: TimeResultViewerProps) {
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotResult | null>(null)
    const [isVoterModalOpen, setIsVoterModalOpen] = useState(false)

    const generateTimeSlots = () => {
        const slots: string[] = []
        for (let hour = 7; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
        return slots
    }

    const timeSlots = generateTimeSlots()

    // 시간별 결과 매핑
    const resultMap = new Map<string, TimeSlotResult>()
    dateResults.forEach(result => {
        resultMap.set(result.time, result)
    })

    // 최대 투표 수 (색상 진하기 계산용)
    const maxCount = Math.max(...dateResults.map(r => r.count), 1)

    const handleTimeSlotClick = (time: string) => {
        const result = resultMap.get(time)
        if (result && result.count > 0) {
            setSelectedTimeSlot(result)
            setIsVoterModalOpen(true)
        }
    }

    // 투표 수에 따른 색상 진하기 계산 (0명: 회색, 최대: 진한 초록)
    const getBackgroundColor = (count: number) => {
        if (count === 0) return "bg-gray-100"

        const intensity = count / totalVoters
        if (intensity >= 0.8) return "bg-green-600"
        if (intensity >= 0.6) return "bg-green-500"
        if (intensity >= 0.4) return "bg-green-400"
        if (intensity >= 0.2) return "bg-green-300"
        return "bg-green-200"
    }

    const getTextColor = (count: number) => {
        const intensity = count / totalVoters
        return intensity >= 0.4 ? "text-white" : "text-gray-700"
    }

    const renderTimeBlock = (time: string) => {
        const result = resultMap.get(time)
        const count = result?.count || 0
        const [hour, minute] = time.split(':')
        const endMinute = minute === '00' ? '30' : '00'
        const endHour = minute === '30' ? (parseInt(hour) + 1).toString().padStart(2, '0') : hour
        const timeRange = `${time}-${endHour}:${endMinute}`

        return (
            <button
                key={time}
                type="button"
                onClick={() => handleTimeSlotClick(time)}
                className={cn(
                    "relative flex-1 h-10 transition-all duration-150",
                    "border-l border-r border-gray-300",
                    "flex items-center justify-center",
                    "hover:ring-2 hover:ring-green-400 hover:z-10",
                    getBackgroundColor(count),
                    count > 0 ? "cursor-pointer" : "cursor-default"
                )}
                title={count > 0 ? `${count}명 참석 가능 (클릭하여 상세보기)` : "참석 가능한 사람 없음"}
            >
                <span className={cn("text-sm font-medium", getTextColor(count))}>
                    {count > 0 ? count : ""}
                </span>
            </button>
        )
    }

    return (
        <>
            <div className={cn("select-none", className)}>
                <div className="grid grid-cols-2 gap-3">
                    {/* 왼쪽 열 */}
                    <div className="col-span-1">
                        {timeSlots.slice(0, 17).map((time, index) => (
                            <div key={time}>
                                {/* 시간 라벨 (윗선) */}
                                <div className="flex items-center -mb-px">
                                    <span className="text-xs font-medium text-gray-600 w-14 text-right pr-2">
                                        {time}
                                    </span>
                                    <div className="flex-1 border-t border-gray-300" />
                                </div>
                                {/* 시간 블록 */}
                                <div className="flex items-stretch">
                                    <div className="w-14" /> {/* 시간 라벨 공간 */}
                                    {renderTimeBlock(time)}
                                </div>
                            </div>
                        ))}
                        {/* 마지막 시간 라벨 (15:00) */}
                        <div className="flex items-center -mb-px">
                            <span className="text-xs font-medium text-gray-600 w-14 text-right pr-2">
                                15:00
                            </span>
                            <div className="flex-1 border-t border-gray-300" />
                        </div>
                    </div>

                    {/* 오른쪽 열 */}
                    <div className="col-span-1">
                        {timeSlots.slice(17).map((time, index) => (
                            <div key={time}>
                                {/* 시간 라벨 (윗선) */}
                                <div className="flex items-center -mb-px">
                                    <div className="flex-1 border-t border-gray-300" />
                                    <span className="text-xs font-medium text-gray-600 w-14 text-left pl-2">
                                        {time}
                                    </span>
                                </div>
                                {/* 시간 블록 */}
                                <div className="flex items-stretch">
                                    {renderTimeBlock(time)}
                                    <div className="w-14" /> {/* 시간 라벨 공간 */}
                                </div>
                            </div>
                        ))}
                        {/* 마지막 시간 라벨 (24:00) */}
                        <div className="flex items-center -mb-px">
                            <div className="flex-1 border-t border-gray-300" />
                            <span className="text-xs font-medium text-gray-600 w-14 text-left pl-2">
                                24:00
                            </span>
                        </div>
                    </div>
                </div>

                {/* 범례 */}
                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded" />
                        <span>0명</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-200 rounded" />
                        <span>20%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-400 rounded" />
                        <span>40%</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-600 rounded" />
                        <span>80%+</span>
                    </div>
                </div>
            </div>

            {/* 투표자 목록 모달 */}
            <Dialog open={isVoterModalOpen} onOpenChange={setIsVoterModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedTimeSlot?.time} 참석 현황
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {/* 참석 가능 */}
                        <div>
                            <h4 className="font-medium mb-2 text-green-700">
                                참석 가능 ({selectedTimeSlot?.voters.length || 0}명)
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {selectedTimeSlot?.voters.map((voter, index) => (
                                    <div
                                        key={index}
                                        className="px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                                    >
                                        {voter}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 참석 불가능 */}
                        {(() => {
                            const unavailableVoters = allVoterNames.filter(
                                name => !selectedTimeSlot?.voters.includes(name)
                            )
                            return unavailableVoters.length > 0 && (
                                <div>
                                    <h4 className="font-medium mb-2 text-gray-500">
                                        참석 불가능 ({unavailableVoters.length}명)
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {unavailableVoters.map((voter, index) => (
                                            <div
                                                key={index}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-medium"
                                            >
                                                {voter}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })()}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

