"use client"

import type React from "react"
import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeSlotSelector } from "@/components/time-slot-selector"
import { Loader2 } from "lucide-react"

interface DateTimeSelection {
    date: string
    times: string[]
}

// 07:00 ~ 23:30까지 30분 간격으로 모든 시간 생성
const generateAllTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 7; hour < 24; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`)
        slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
    return slots
}

interface VoteTimeSchedulingProps {
    appointment: any
    name: string
    nameError: boolean
    submitting: boolean
    onNameChange: (value: string) => void
    onSubmit: (e: React.FormEvent, selectedDateTimes: DateTimeSelection[]) => void
}

export function VoteTimeScheduling({
    appointment,
    name,
    nameError,
    submitting,
    onNameChange,
    onSubmit,
}: VoteTimeSchedulingProps) {
    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [selectedDateTimes, setSelectedDateTimes] = useState<DateTimeSelection[]>([])
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
    const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
    const [tempSelectedTimes, setTempSelectedTimes] = useState<string[]>([])

    const handleDateSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates ?? [])
    }

    const handleDateClick = (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd")
        const existingSelection = selectedDateTimes.find((dt) => dt.date === dateStr)

        // 기본값: 모든 시간 선택 (07:00 ~ 23:30)
        const allTimes = generateAllTimeSlots()

        setCurrentSelectedDate(date)
        setTempSelectedTimes(existingSelection?.times || allTimes)
        setIsTimeModalOpen(true)
    }

    const handleTimeConfirm = () => {
        if (!currentSelectedDate) return

        const dateStr = format(currentSelectedDate, "yyyy-MM-dd")

        setSelectedDateTimes((prev) => {
            const filtered = prev.filter((dt) => dt.date !== dateStr)
            if (tempSelectedTimes.length > 0) {
                return [...filtered, { date: dateStr, times: tempSelectedTimes }]
            }
            return filtered
        })

        setIsTimeModalOpen(false)
        setCurrentSelectedDate(null)
        setTempSelectedTimes([])
    }

    const isDateDisabled = (date: Date) => {
        if (!appointment?.start_date || !appointment?.end_date) return false
        const startDate = parseISO(appointment.start_date)
        const endDate = parseISO(appointment.end_date)
        return date < startDate || date > endDate
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        console.log(selectedDateTimes)
        onSubmit(e, selectedDateTimes)
    }

    return (
        <>
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
                        참석 가능한 날짜와 시간
                    </Label>
                    <div className="w-full border rounded-md p-2 bg-background">
                        <CustomCalendar
                            selected={selectedDates}
                            onSelect={handleDateSelect}
                            onDayClick={handleDateClick}
                            className="mx-auto p-3"
                            disabled={isDateDisabled}
                            defaultMonth={parseISO(appointment.start_date)}
                            fromDate={parseISO(appointment.start_date)}
                            toDate={parseISO(appointment.end_date)}
                            showOutsideDays={false}
                            isTimeScheduling={true}
                            selectedDateTimes={selectedDateTimes}
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        type="submit"
                        className="w-full py-6 text-lg"
                        disabled={selectedDateTimes.length === 0 || !name.trim() || submitting}
                    >
                        {submitting
                            ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="animate-pulse">투표 중...</span></>
                            : <span className="font-bold">투표 완료하기</span>}
                    </Button>
                </div>
            </form>

            {/* 시간 선택 모달 */}
            <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center">시간 선택</DialogTitle>
                        <DialogDescription className="text-center">
                            {currentSelectedDate && format(currentSelectedDate, "M월 d일 (eee)", { locale: ko })} <br />
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <TimeSlotSelector
                            selectedTimes={tempSelectedTimes}
                            onChange={setTempSelectedTimes}
                        />

                        <div className="flex justify-center gap-2 mt-6">
                            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
                                취소
                            </Button>
                            <Button onClick={handleTimeConfirm}>
                                완료
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

