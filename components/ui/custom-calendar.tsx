"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameDay } from "date-fns"
import { ko } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CustomCalendarProps {
    selected?: Date[]
    onSelect?: (dates: Date[]) => void
    onDayClick?: (date: Date) => void
    disabled?: (date: Date) => boolean
    defaultMonth?: Date
    fromDate?: Date
    toDate?: Date
    showOutsideDays?: boolean
    className?: string
    isTimeScheduling?: boolean
    selectedDateTimes?: Array<{ date: string; times: number[] }>
}

export function CustomCalendar({
    selected = [],
    onSelect,
    onDayClick,
    disabled,
    defaultMonth = new Date(),
    fromDate,
    toDate,
    showOutsideDays = false,
    className,
    isTimeScheduling = false,
    selectedDateTimes = [],
}: CustomCalendarProps) {
    const [currentMonth, setCurrentMonth] = React.useState(defaultMonth)

    // 월 네비게이션
    const goToPreviousMonth = () => {
        setCurrentMonth((prev) => subMonths(prev, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1))
    }

    // 날짜 클릭 핸들러
    const handleDateClick = (date: Date) => {
        if (disabled?.(date)) return

        if (isTimeScheduling) {
            // 시간 스케줄링 모드에서는 onDayClick 호출
            onDayClick?.(date)
        } else {
            // 일반 모드에서는 선택/해제
            const newSelected = selected.some((d) => isSameDay(d, date))
                ? selected.filter((d) => !isSameDay(d, date))
                : [...selected, date]
            onSelect?.(newSelected)
        }
    }

    // 날짜가 선택되었는지 확인
    const isDateSelected = (date: Date) => {
        return selected.some((d) => isSameDay(d, date))
    }

    // 날짜에 시간 정보가 있는지 확인
    const getDateTimeInfo = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        return selectedDateTimes.find((dt) => dt.date === dateStr)
    }

    // 현재 월의 날짜들 계산
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const startDate = showOutsideDays ? monthStart : fromDate || monthStart
    const endDate = toDate || monthEnd

    const daysInMonth = eachDayOfInterval({
        start: monthStart,
        end: monthEnd,
    })

    // 월 시작 전 빈 칸 수 계산
    const startDayOfWeek = monthStart.getDay()

    return (
        <div className={cn("w-full", className)}>
            {/* 월 네비게이션 */}
            <div className="flex items-center justify-between mb-4">
                <Button
                    type="button"
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
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={goToNextMonth}
                    className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 mb-3">
                {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                    <div
                        key={day}
                        className={cn(
                            "text-center py-2 text-sm font-medium",
                            index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-600"
                        )}
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 gap-1">
                {/* 월 시작 전 빈 칸 */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="aspect-square" />
                ))}

                {/* 실제 날짜들 */}
                {daysInMonth.map((day) => {
                    const isSelected = isDateSelected(day)
                    const isDisabled = disabled?.(day) || false
                    const isInRange = fromDate && toDate && day >= fromDate && day <= toDate
                    const dateTimeInfo = getDateTimeInfo(day)

                    return (
                        <div
                            key={format(day, "yyyy-MM-dd")}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer border transition-all duration-200",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : isDisabled || !isInRange
                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-default"
                                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5",
                                isSelected && "hover:scale-105 hover:shadow-md",
                                !isDisabled && isInRange && "hover:scale-105"
                            )}
                            onClick={() => handleDateClick(day)}
                        >
                            <span className="text-sm font-semibold mb-0.5">
                                {format(day, "d")}
                            </span>

                            {/* 시간 정보 표시 */}
                            {dateTimeInfo && dateTimeInfo.times.length > 0 && (
                                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                    <Clock className={cn("h-3 w-3", isSelected ? "text-primary-foreground" : "text-primary")} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
} 