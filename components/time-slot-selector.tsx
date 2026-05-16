"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TimeSlotSelectorProps {
    selectedTimes?: string[]
    onChange?: (times: string[]) => void
    className?: string
}

type DragMode = "select" | "deselect"

const EMPHASIZED_TIME_LINES = new Set(["09:00", "12:00", "18:00"])

const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 7; hour < 24; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`)
        slots.push(`${hour.toString().padStart(2, "0")}:30`)
    }
    return slots
}

export function TimeSlotSelector({
    selectedTimes = [],
    onChange,
    className
}: TimeSlotSelectorProps) {
    const timeSlots = useMemo(() => generateTimeSlots(), [])
    const selectedTimesKey = useMemo(() => [...selectedTimes].sort().join("|"), [selectedTimes])

    const [selected, setSelected] = useState<Set<string>>(() => new Set(selectedTimes))
    const [isDragging, setIsDragging] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragModeRef = useRef<DragMode>("select")
    const dragVisitedRef = useRef<Set<string>>(new Set())

    const leftColumn = timeSlots.slice(0, 17)
    const rightColumn = timeSlots.slice(17)

    useEffect(() => {
        setSelected(new Set(selectedTimesKey ? selectedTimesKey.split("|") : []))
    }, [selectedTimesKey])

    const selectAll = useCallback(() => {
        setSelected(new Set(timeSlots))
    }, [timeSlots])

    const deselectAll = useCallback(() => {
        setSelected(new Set())
    }, [])

    const toggleTime = useCallback((time: string, forceMode?: DragMode) => {
        setSelected(prev => {
            const newSet = new Set(prev)
            const mode = forceMode || (newSet.has(time) ? "deselect" : "select")

            if (mode === "select") {
                newSet.add(time)
            } else {
                newSet.delete(time)
            }

            return newSet
        })
    }, [])

    useEffect(() => {
        onChange?.(Array.from(selected).sort())
    }, [selected, onChange])

    const applyTime = useCallback((time: string, mode: DragMode) => {
        if (dragVisitedRef.current.has(time)) return

        dragVisitedRef.current.add(time)
        toggleTime(time, mode)
    }, [toggleTime])

    const handleStart = (time: string, event: PointerEvent<HTMLElement>) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture?.(event.pointerId)

        const mode: DragMode = selected.has(time) ? "deselect" : "select"
        dragModeRef.current = mode
        dragVisitedRef.current = new Set()
        setIsDragging(true)
        applyTime(time, mode)
    }

    const handleMove = (time: string) => {
        if (!isDragging) return

        applyTime(time, dragModeRef.current)
    }

    const handleEnd = useCallback(() => {
        setIsDragging(false)
        dragVisitedRef.current.clear()
    }, [])

    const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return

        event.preventDefault()

        const element = document.elementFromPoint(event.clientX, event.clientY)
        const timeElement = element?.closest<HTMLElement>("[data-time]")
        const time = timeElement?.dataset.time

        if (time) {
            applyTime(time, dragModeRef.current)
        }
    }

    useEffect(() => {
        const handleGlobalEnd = () => handleEnd()

        document.addEventListener("pointerup", handleGlobalEnd)
        document.addEventListener("pointercancel", handleGlobalEnd)
        return () => {
            document.removeEventListener("pointerup", handleGlobalEnd)
            document.removeEventListener("pointercancel", handleGlobalEnd)
        }
    }, [handleEnd])

    const isSelected = (time: string) => selected.has(time)
    const isAllSelected = selected.size === timeSlots.length
    const isAllDeselected = selected.size === 0
    const getTimeLineClass = (time: string) =>
        EMPHASIZED_TIME_LINES.has(time) ? "border-t-2 border-blue-500" : "border-t border-gray-300"

    return (
        <div
            ref={containerRef}
            className={cn("select-none", className)}
            onPointerMove={handlePointerMove}
            onPointerUp={handleEnd}
            onPointerCancel={handleEnd}
        >
            <div className="mb-5 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800 text-center">
                    드래그하여 시간을 선택해주세요
                </p>
                <p className="text-xs text-blue-600 text-center mt-1">
                    모바일에서는 시간대를 누른 뒤 원하는 범위까지 끌어 선택하거나 해제할 수 있습니다
                </p>
            </div>

            <div className="flex gap-2 mb-4 justify-center">
                <Button
                    type="button"
                    onClick={selectAll}
                    variant={isAllSelected ? "default" : "outline"}
                    size="sm"
                    className="min-w-[100px]"
                >
                    전체선택
                </Button>
                <Button
                    type="button"
                    onClick={deselectAll}
                    variant={isAllDeselected ? "default" : "outline"}
                    size="sm"
                    className="min-w-[100px]"
                >
                    전체해제
                </Button>
            </div>

            <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-x-3 touch-none">
                <div className="col-span-2 touch-none">
                    {leftColumn.map((time) => (
                        <div
                            key={time}
                            data-time={time}
                            onPointerDown={(event) => handleStart(time, event)}
                            onPointerEnter={() => handleMove(time)}
                            className="flex h-10 items-stretch touch-none"
                        >
                            <div className="relative w-14 shrink-0">
                                <span className="absolute right-2 top-0 -translate-y-1/2 text-xs font-medium text-gray-600">
                                    {time}
                                </span>
                            </div>
                            <button
                                type="button"
                                data-time={time}
                                className={cn(
                                    "block h-10 flex-1 transition-colors duration-150",
                                    "border-l border-r border-gray-300",
                                    getTimeLineClass(time),
                                    "cursor-pointer touch-none",
                                    isSelected(time)
                                        ? "bg-primary hover:bg-primary/90 active:bg-primary/90"
                                        : "bg-white hover:bg-gray-50 active:bg-gray-100"
                                )}
                            />
                        </div>
                    ))}
                    <div className="flex h-0 items-start">
                        <span className="w-14 shrink-0 pr-2 -translate-y-1/2 text-right text-xs font-medium text-gray-600">
                            {leftColumn.length > 0 && (() => {
                                const lastTime = leftColumn[leftColumn.length - 1]
                                const [hour, minute] = lastTime.split(":").map(Number)
                                const nextMinute = minute === 30 ? "00" : "30"
                                const nextHour = minute === 30 ? hour + 1 : hour
                                return `${nextHour.toString().padStart(2, "0")}:${nextMinute}`
                            })()}
                        </span>
                        <div className="h-0 flex-1 border-t border-gray-300" />
                    </div>
                </div>

                <div className="col-span-2 touch-none">
                    {rightColumn.map((time) => (
                        <div
                            key={time}
                            data-time={time}
                            onPointerDown={(event) => handleStart(time, event)}
                            onPointerEnter={() => handleMove(time)}
                            className="flex h-10 items-stretch touch-none"
                        >
                            <button
                                type="button"
                                data-time={time}
                                className={cn(
                                    "block h-10 flex-1 transition-colors duration-150",
                                    "border-l border-r border-gray-300",
                                    getTimeLineClass(time),
                                    "cursor-pointer touch-none",
                                    isSelected(time)
                                        ? "bg-primary hover:bg-primary/90 active:bg-primary/90"
                                        : "bg-white hover:bg-gray-50 active:bg-gray-100"
                                )}
                            />
                            <div className="relative w-14 shrink-0">
                                <span className="absolute left-2 top-0 -translate-y-1/2 text-xs font-medium text-gray-600">
                                    {time}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="flex h-0 items-start">
                        <div className="h-0 flex-1 border-t border-gray-300" />
                        <span className="w-14 shrink-0 pl-2 -translate-y-1/2 text-left text-xs font-medium text-gray-600">
                            24:00
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface SelectedTimesDisplayProps {
    times: string[]
    className?: string
}

export function SelectedTimesDisplay({ times, className }: SelectedTimesDisplayProps) {
    if (times.length === 0) {
        return (
            <div className={cn("text-sm text-muted-foreground italic", className)}>
                선택된 시간이 없습니다
            </div>
        )
    }

    const groupedTimes: string[][] = []
    let currentGroup: string[] = []

    const sortedTimes = [...times].sort()

    sortedTimes.forEach((time, index) => {
        if (currentGroup.length === 0) {
            currentGroup.push(time)
        } else {
            const prevTime = currentGroup[currentGroup.length - 1]
            const [prevHour, prevMin] = prevTime.split(":").map(Number)
            const [currHour, currMin] = time.split(":").map(Number)

            const prevMinutes = prevHour * 60 + prevMin
            const currMinutes = currHour * 60 + currMin

            if (currMinutes - prevMinutes === 30) {
                currentGroup.push(time)
            } else {
                groupedTimes.push([...currentGroup])
                currentGroup = [time]
            }
        }

        if (index === sortedTimes.length - 1) {
            groupedTimes.push(currentGroup)
        }
    })

    return (
        <div className={cn("space-y-1", className)}>
            {groupedTimes.map((group, index) => (
                <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm font-medium">
                        {group.length === 1 ? (
                            group[0]
                        ) : (
                            <>
                                {group[0]} ~ {group[group.length - 1]}
                            </>
                        )}
                    </span>
                </div>
            ))}
        </div>
    )
}
