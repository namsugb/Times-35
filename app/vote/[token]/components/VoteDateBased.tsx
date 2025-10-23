"use client"

import type React from "react"
import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CustomCalendar } from "@/components/ui/custom-calendar"

interface VoteDateBasedProps {
    appointment: any
    name: string
    nameError: boolean
    submitting: boolean
    onNameChange: (value: string) => void
    onSubmit: (e: React.FormEvent, selectedDates: Date[]) => void
}

export function VoteDateBased({
    appointment,
    name,
    nameError,
    submitting,
    onNameChange,
    onSubmit,
}: VoteDateBasedProps) {
    const [selectedDates, setSelectedDates] = useState<Date[]>([])

    const handleDateSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates ?? [])
    }

    const isDateDisabled = (date: Date) => {
        if (!appointment?.start_date || !appointment?.end_date) return false
        const startDate = parseISO(appointment.start_date)
        const endDate = parseISO(appointment.end_date)
        return date < startDate || date > endDate
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        onSubmit(e, selectedDates)
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
                    참석 가능한 날짜 {selectedDates.length > 0 && `(${selectedDates.length}개 선택됨)`}
                </Label>
                <div className="w-full border rounded-md p-2 bg-background">
                    <CustomCalendar
                        selected={selectedDates}
                        onSelect={handleDateSelect}
                        className="mx-auto p-3"
                        disabled={isDateDisabled}
                        defaultMonth={parseISO(appointment.start_date)}
                        fromDate={parseISO(appointment.start_date)}
                        toDate={parseISO(appointment.end_date)}
                        showOutsideDays={false}
                    />
                </div>
                <p className="text-sm text-muted-foreground mt-2">참석 가능한 날짜를 모두 클릭하여 선택해주세요.</p>
            </div>

            <div className="pt-4">
                <Button
                    type="submit"
                    className="w-full py-6 text-lg"
                    disabled={selectedDates.length === 0 || !name.trim() || submitting}
                >
                    {submitting
                        ? "투표 중..."
                        : `투표 완료하기 ${selectedDates.length > 0 ? `(${selectedDates.length}개)` : "선택된 날짜 없음"}`}
                </Button>
            </div>
        </form>
    )
}

