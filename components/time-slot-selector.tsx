"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface TimeSlotSelectorProps {
    selectedTimes?: string[]
    onChange?: (times: string[]) => void
    className?: string
}

export function TimeSlotSelector({
    selectedTimes = [],
    onChange,
    className
}: TimeSlotSelectorProps) {
    const [selected, setSelected] = useState<Set<string>>(new Set(selectedTimes))
    const [isDragging, setIsDragging] = useState(false)
    const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select')
    const containerRef = useRef<HTMLDivElement>(null)

    // 07:00 ~ 24:00까지 30분 간격으로 시간 생성
    const generateTimeSlots = () => {
        const slots: string[] = []
        for (let hour = 7; hour < 24; hour++) {
            slots.push(`${hour.toString().padStart(2, '0')}:00`)
            slots.push(`${hour.toString().padStart(2, '0')}:30`)
        }
        return slots
    }

    const timeSlots = generateTimeSlots()

    // 왼쪽 열: 07:00 ~ 15:00 (16개)
    const leftColumn = timeSlots.slice(0, 17)
    // 오른쪽 열: 15:00 ~ 24:00 (17개)
    const rightColumn = timeSlots.slice(17)

    // 전체선택/전체해제 함수
    const selectAll = useCallback(() => {
        setSelected(new Set(timeSlots))
    }, [timeSlots])

    const deselectAll = useCallback(() => {
        setSelected(new Set())
    }, [])

    const toggleTime = useCallback((time: string, forceMode?: 'select' | 'deselect') => {
        setSelected(prev => {
            const newSet = new Set(prev)
            const mode = forceMode || (newSet.has(time) ? 'deselect' : 'select')

            if (mode === 'select') {
                newSet.add(time)
            } else {
                newSet.delete(time)
            }

            return newSet
        })
    }, [])

    // onChange를 별도의 useEffect로 처리하여 렌더링 중 state 업데이트 방지
    useEffect(() => {
        const newArray = Array.from(selected).sort()
        onChange?.(newArray)
    }, [selected, onChange])

    const handleStart = (time: string) => {
        const isSelected = selected.has(time)
        const mode = isSelected ? 'deselect' : 'select'
        setDragMode(mode)
        setIsDragging(true)
        toggleTime(time, mode)
    }

    const handleMove = (time: string) => {
        if (isDragging) {
            toggleTime(time, dragMode)
        }
    }

    const handleEnd = () => {
        setIsDragging(false)
    }

    // 터치 이벤트: 드래그 중 터치 위치의 시간 찾기
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return

        e.preventDefault() // 스크롤 방지

        const touch = e.touches[0]
        const element = document.elementFromPoint(touch.clientX, touch.clientY)

        if (element && element.hasAttribute('data-time')) {
            const time = element.getAttribute('data-time')
            if (time) {
                toggleTime(time, dragMode)
            }
        }
    }

    // 전역 마우스/터치 업 이벤트 리스너
    useEffect(() => {
        const handleGlobalEnd = () => setIsDragging(false)
        document.addEventListener('mouseup', handleGlobalEnd)
        document.addEventListener('touchend', handleGlobalEnd)
        return () => {
            document.removeEventListener('mouseup', handleGlobalEnd)
            document.removeEventListener('touchend', handleGlobalEnd)
        }
    }, [])

    const formatTimeDisplay = (time: string) => {
        return time
    }

    const isSelected = (time: string) => selected.has(time)

    // 현재 상태 체크
    const isAllSelected = selected.size === timeSlots.length
    const isAllDeselected = selected.size === 0

    return (
        <div
            ref={containerRef}
            className={cn("select-none", className)}
            onMouseUp={handleEnd}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleEnd}
        >
            {/* 전체선택/전체해제 토글 버튼 */}
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

            <div className="grid grid-cols-[60px_1fr_60px_1fr] gap-3">
                {/* 왼쪽 열 */}
                <div className="col-span-2">
                    {leftColumn.map((time, index) => (
                        <div key={time}>
                            {/* 시간 라벨 */}
                            <div className="flex items-center -mb-px">
                                <span className="text-xs font-medium text-gray-600 w-14 text-right pr-2">
                                    {time}
                                </span>
                                <div className="flex-1 border-t border-gray-300" />
                            </div>
                            {/* 시간 블록 */}
                            <div className="flex items-stretch">
                                <div className="w-14" />
                                <button
                                    type="button"
                                    data-time={time}
                                    onMouseDown={() => handleStart(time)}
                                    onMouseEnter={() => handleMove(time)}
                                    onTouchStart={(e) => {
                                        e.preventDefault()
                                        handleStart(time)
                                    }}
                                    className={cn(
                                        "flex-1 h-10 transition-colors duration-150",
                                        "border-l border-r border-gray-300",
                                        "cursor-pointer touch-none",
                                        isSelected(time)
                                            ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
                                            : "bg-white hover:bg-gray-50 active:bg-gray-100"
                                    )}
                                />
                            </div>
                        </div>
                    ))}
                    {/* 마지막 시간 라벨 */}
                    <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 w-14 text-right pr-2">
                            {leftColumn.length > 0 && (() => {
                                const lastTime = leftColumn[leftColumn.length - 1]
                                const [hour, minute] = lastTime.split(':').map(Number)
                                const nextMinute = minute === 30 ? '00' : '30'
                                const nextHour = minute === 30 ? hour + 1 : hour
                                return `${nextHour.toString().padStart(2, '0')}:${nextMinute}`
                            })()}
                        </span>
                        <div className="flex-1 border-t border-gray-300" />
                    </div>
                </div>

                {/* 오른쪽 열 */}
                <div className="col-span-2">
                    {rightColumn.map((time, index) => (
                        <div key={time}>
                            {/* 시간 라벨 */}
                            <div className="flex items-center -mb-px">
                                <div className="flex-1 border-t border-gray-300" />
                                <span className="text-xs font-medium text-gray-600 w-14 text-left pl-2">
                                    {time}
                                </span>
                            </div>
                            {/* 시간 블록 */}
                            <div className="flex items-stretch">
                                <button
                                    type="button"
                                    data-time={time}
                                    onMouseDown={() => handleStart(time)}
                                    onMouseEnter={() => handleMove(time)}
                                    onTouchStart={(e) => {
                                        e.preventDefault()
                                        handleStart(time)
                                    }}
                                    className={cn(
                                        "flex-1 h-10 transition-colors duration-150",
                                        "border-l border-r border-gray-300",
                                        "cursor-pointer touch-none",
                                        isSelected(time)
                                            ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
                                            : "bg-white hover:bg-gray-50 active:bg-gray-100"
                                    )}
                                />
                                <div className="w-14" />
                            </div>
                        </div>
                    ))}
                    {/* 마지막 시간 라벨 */}
                    <div className="flex items-center">
                        <div className="flex-1 border-t border-gray-300" />
                        <span className="text-xs font-medium text-gray-600 w-14 text-left pl-2">
                            24:00
                        </span>
                    </div>
                </div>
            </div>

            {/* 선택된 시간 개수 표시 */}
            {/* {selected.size > 0 && (
                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-green-600">{selected.size}개</span> 시간대 선택됨
                    </p>
                </div>
            )} */}
        </div>
    )
}

// 선택된 시간을 보기 좋게 표시하는 헬퍼 컴포넌트
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

    // 연속된 시간대를 그룹화
    const groupedTimes: string[][] = []
    let currentGroup: string[] = []

    const sortedTimes = [...times].sort()

    sortedTimes.forEach((time, index) => {
        if (currentGroup.length === 0) {
            currentGroup.push(time)
        } else {
            const prevTime = currentGroup[currentGroup.length - 1]
            const [prevHour, prevMin] = prevTime.split(':').map(Number)
            const [currHour, currMin] = time.split(':').map(Number)

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

