"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface TimeSelectionModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (selectedTimes: number[]) => void
    currentDate: Date | null
    initialSelectedTimes: number[]
}

export function TimeSelectionModal({
    isOpen,
    onClose,
    onConfirm,
    currentDate,
    initialSelectedTimes
}: TimeSelectionModalProps) {
    const [tempSelectedTimes, setTempSelectedTimes] = useState<number[]>([])

    useEffect(() => {
        setTempSelectedTimes(initialSelectedTimes)
    }, [initialSelectedTimes, isOpen])

    // 시간 선택 핸들러
    const handleTimeToggle = (hour: number) => {
        setTempSelectedTimes((prev) => {
            if (prev.includes(hour)) {
                return prev.filter((h) => h !== hour)
            } else {
                return [...prev, hour].sort((a, b) => a - b)
            }
        })
    }

    const handleConfirm = () => {
        onConfirm(tempSelectedTimes)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
                <DialogHeader>
                    <DialogTitle>시간 선택</DialogTitle>
                    <DialogDescription>
                        {currentDate && format(currentDate, "M월 d일 (eee)", { locale: ko })}에 참석 가능한 시간을
                        선택해주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
                            <Button
                                key={hour}
                                variant={tempSelectedTimes.includes(hour) ? "default" : "outline"}
                                size="sm"
                                className="h-10 text-xs"
                                onClick={() => handleTimeToggle(hour)}
                            >
                                {hour}시
                            </Button>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mt-6">
                        <div className="text-sm text-muted-foreground">
                            {tempSelectedTimes.length > 0 && `${tempSelectedTimes.length}개 시간 선택됨`}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={onClose}>
                                취소
                            </Button>
                            <Button onClick={handleConfirm}>확인</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
