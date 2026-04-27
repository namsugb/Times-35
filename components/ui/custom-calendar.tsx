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
    selectedDateTimes?: Array<{ date: string; times: Array<string | number> }>
}

type DragMode = "select" | "deselect"

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
    const [dragMode, setDragMode] = React.useState<DragMode | null>(null)
    const selectedRef = React.useRef(selected)
    const dragModeRef = React.useRef<DragMode | null>(null)
    const dragVisitedRef = React.useRef<Set<string>>(new Set())

    // 월 네비게이션
    const goToPreviousMonth = () => {
        setCurrentMonth((prev) => subMonths(prev, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth((prev) => addMonths(prev, 1))
    }

    React.useEffect(() => {
        selectedRef.current = selected
    }, [selected])

    const getDateKey = React.useCallback((date: Date) => format(date, "yyyy-MM-dd"), [])

    const isSelectableDate = React.useCallback((date: Date) => {
        const isDisabled = disabled?.(date) || false
        const isInRange = (!fromDate || date >= fromDate) && (!toDate || date <= toDate)
        return !isDisabled && isInRange
    }, [disabled, fromDate, toDate])

    const applyDateSelection = React.useCallback((date: Date, mode?: DragMode) => {
        if (!isSelectableDate(date)) return

        const currentSelected = selectedRef.current
        const alreadySelected = currentSelected.some((d) => isSameDay(d, date))
        const shouldSelect = mode ? mode === "select" : !alreadySelected

        if (shouldSelect === alreadySelected) return

        const newSelected = shouldSelect
            ? [...currentSelected, date]
            : currentSelected.filter((d) => !isSameDay(d, date))

        selectedRef.current = newSelected
        onSelect?.(newSelected)
    }, [isSelectableDate, onSelect])

    const endDateDrag = React.useCallback(() => {
        dragModeRef.current = null
        dragVisitedRef.current.clear()
        setDragMode(null)
    }, [])

    React.useEffect(() => {
        if (!dragMode) return

        window.addEventListener("pointerup", endDateDrag)
        window.addEventListener("pointercancel", endDateDrag)

        return () => {
            window.removeEventListener("pointerup", endDateDrag)
            window.removeEventListener("pointercancel", endDateDrag)
        }
    }, [dragMode, endDateDrag])

    // 날짜 클릭 핸들러
    const handleDateClick = (date: Date) => {
        if (!isSelectableDate(date)) return

        if (isTimeScheduling) {
            // 시간 스케줄링 모드에서는 onDayClick 호출
            onDayClick?.(date)
        } else {
            // 일반 모드에서는 선택/해제
            applyDateSelection(date)
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

    const datesByKey = React.useMemo(() => {
        return new Map(daysInMonth.map((day) => [getDateKey(day), day]))
    }, [daysInMonth, getDateKey])

    const getDateFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
        const target = document.elementFromPoint(event.clientX, event.clientY)
        if (!(target instanceof Element)) return null

        const dayElement = target.closest<HTMLElement>("[data-calendar-date]")
        const dateKey = dayElement?.dataset.calendarDate

        return dateKey ? datesByKey.get(dateKey) ?? null : null
    }

    const handleDatePointerDown = (date: Date, event: React.PointerEvent<HTMLDivElement>) => {
        if (isTimeScheduling || !isSelectableDate(date)) return

        event.preventDefault()

        const mode: DragMode = isDateSelected(date) ? "deselect" : "select"
        dragModeRef.current = mode
        dragVisitedRef.current = new Set([getDateKey(date)])
        setDragMode(mode)
        applyDateSelection(date, mode)
    }

    const handleCalendarPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const mode = dragModeRef.current
        if (isTimeScheduling || !mode) return

        const date = getDateFromPointer(event)
        if (!date || !isSelectableDate(date)) return

        const dateKey = getDateKey(date)
        if (dragVisitedRef.current.has(dateKey)) return

        event.preventDefault()
        dragVisitedRef.current.add(dateKey)
        applyDateSelection(date, mode)
    }

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
            <div
                className={cn(
                    "grid grid-cols-7 gap-1 select-none",
                    !isTimeScheduling && "touch-none"
                )}
                onPointerMove={handleCalendarPointerMove}
                onPointerUp={endDateDrag}
                onPointerCancel={endDateDrag}
            >
                {/* 월 시작 전 빈 칸 */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                    <div key={`empty-start-${i}`} className="aspect-square" />
                ))}

                {/* 실제 날짜들 */}
                {daysInMonth.map((day) => {
                    const isSelected = isDateSelected(day)
                    const isDisabled = disabled?.(day) || false
                    const isInRange = (!fromDate || day >= fromDate) && (!toDate || day <= toDate)
                    const dateTimeInfo = getDateTimeInfo(day)

                    return (
                        <div
                            key={getDateKey(day)}
                            data-calendar-date={getDateKey(day)}
                            role="button"
                            tabIndex={isDisabled || !isInRange ? -1 : 0}
                            aria-pressed={isSelected}
                            className={cn(
                                "aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer border transition-all duration-100 active:scale-95",
                                isSelected
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : isDisabled || !isInRange
                                        ? "bg-gray-50 text-gray-300 border-gray-100 cursor-default"
                                        : "bg-background text-foreground border-border hover:border-primary/50 hover:bg-primary/5",
                                isSelected && "hover:scale-105 hover:shadow-md",
                                !isDisabled && isInRange && "hover:scale-105"
                            )}
                            onPointerDown={(event) => handleDatePointerDown(day, event)}
                            onClick={isTimeScheduling ? () => handleDateClick(day) : undefined}
                            onKeyDown={(event) => {
                                if (event.key !== "Enter" && event.key !== " ") return
                                event.preventDefault()
                                handleDateClick(day)
                            }}
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
