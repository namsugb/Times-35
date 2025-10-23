"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

const weekdays = [
    { id: 1, name: "월요일", short: "월" },
    { id: 2, name: "화요일", short: "화" },
    { id: 3, name: "수요일", short: "수" },
    { id: 4, name: "목요일", short: "목" },
    { id: 5, name: "금요일", short: "금" },
    { id: 6, name: "토요일", short: "토" },
    { id: 0, name: "일요일", short: "일" },
]

interface VoteRecurringProps {
    appointment: any
    name: string
    nameError: boolean
    submitting: boolean
    onNameChange: (value: string) => void
    onSubmit: (e: React.FormEvent, selectedWeekdays: number[]) => void
}

export function VoteRecurring({
    appointment,
    name,
    nameError,
    submitting,
    onNameChange,
    onSubmit,
}: VoteRecurringProps) {
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])

    const handleWeekdayToggle = (weekdayId: number) => {
        setSelectedWeekdays((prev) => {
            if (prev.includes(weekdayId)) {
                return prev.filter((id) => id !== weekdayId)
            } else {
                return [...prev, weekdayId].sort()
            }
        })
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        onSubmit(e, selectedWeekdays)
    }

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="name" className={nameError ? "text-red-500" : ""}>
                    이름을 입력해주세요
                </Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                    placeholder="이름"
                />
                {nameError && <p className="text-red-500 text-sm">이름을 입력해주세요.</p>}
            </div>

            <div className="space-y-2">
                <Label className="block mb-2">
                    참석 가능한 요일 {selectedWeekdays.length > 0 && `(${selectedWeekdays.length}개 선택됨)`}
                </Label>
                <div className="grid grid-cols-1 gap-3">
                    {weekdays.map((weekday) => (
                        <Card
                            key={weekday.id}
                            className={`cursor-pointer transition-all duration-200 ${selectedWeekdays.includes(weekday.id)
                                    ? "border-primary bg-primary/5 shadow-md"
                                    : "border-border hover:border-primary/50 hover:shadow-sm"
                                }`}
                            onClick={() => handleWeekdayToggle(weekday.id)}
                        >
                            <CardContent className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${selectedWeekdays.includes(weekday.id)
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-secondary text-secondary-foreground"
                                            }`}
                                    >
                                        {weekday.short}
                                    </div>
                                    <span className="font-medium">{weekday.name}</span>
                                </div>
                                {selectedWeekdays.includes(weekday.id) && <CheckCircle2 className="w-5 h-5 text-primary" />}
                            </CardContent>
                        </Card>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">참석 가능한 요일을 모두 선택해주세요.</p>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full py-6 text-lg"
                    disabled={selectedWeekdays.length === 0 || !name.trim() || submitting}
                >
                    {submitting
                        ? "투표 중..."
                        : `투표 완료하기 ${selectedWeekdays.length > 0 ? `(${selectedWeekdays.length}개)` : ""}`}
                </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
                선택한 요일:{" "}
                {selectedWeekdays.length > 0
                    ? selectedWeekdays.map((id) => weekdays.find((w) => w.id === id)?.short).join(", ")
                    : "없음"}
            </div>
        </form>
    )
}

