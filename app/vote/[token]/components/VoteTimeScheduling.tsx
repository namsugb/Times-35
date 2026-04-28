"use client"

import type React from "react"
import { useState } from "react"
import { eachDayOfInterval, format, isSameDay, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TimeSlotSelector } from "@/components/time-slot-selector"
import { Loader2 } from "lucide-react"

interface DateTimeSelection {
    date: string
    times: string[]
}

type DateGroup = "weekend" | "weekday"

const generateAllTimeSlots = (): string[] => {
    const slots: string[] = []
    for (let hour = 7; hour < 24; hour++) {
        slots.push(`${hour.toString().padStart(2, "0")}:00`)
        slots.push(`${hour.toString().padStart(2, "0")}:30`)
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
    const [editingDates, setEditingDates] = useState<Date[]>([])
    const [tempSelectedTimes, setTempSelectedTimes] = useState<string[]>([])

    const hasAppointmentRange = Boolean(appointment?.start_date && appointment?.end_date)
    const startDate = hasAppointmentRange ? parseISO(appointment.start_date) : undefined
    const endDate = hasAppointmentRange ? parseISO(appointment.end_date) : undefined

    const getDateKey = (date: Date) => format(date, "yyyy-MM-dd")

    const isWeekendDate = (date: Date) => {
        const day = date.getDay()
        return day === 0 || day === 6
    }

    const getSelectableDatesByGroup = (group: DateGroup) => {
        if (!startDate || !endDate) return []

        return eachDayOfInterval({
            start: startDate,
            end: endDate,
        }).filter((date) => {
            if (isDateDisabled(date)) return false
            return group === "weekend" ? isWeekendDate(date) : !isWeekendDate(date)
        })
    }

    const handleDateSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates ?? [])
    }

    const handleBulkToggle = (group: DateGroup) => {
        const targetDates = getSelectableDatesByGroup(group)
        if (targetDates.length === 0) return

        setSelectedDates((prev) => {
            const hasAllTargetDates = targetDates.every((targetDate) =>
                prev.some((selectedDate) => isSameDay(selectedDate, targetDate))
            )
            const withoutTargetDates = prev.filter(
                (selectedDate) => !targetDates.some((targetDate) => isSameDay(selectedDate, targetDate))
            )

            return hasAllTargetDates ? withoutTargetDates : [...withoutTargetDates, ...targetDates]
        })
    }

    const openTimeModal = (dates: Date[], initialTimes: string[]) => {
        setEditingDates(dates)
        setTempSelectedTimes(initialTimes)
        setIsTimeModalOpen(true)
    }

    const handleDateClick = (date: Date) => {
        const dateStr = getDateKey(date)
        const existingSelection = selectedDateTimes.find((dt) => dt.date === dateStr)

        if (existingSelection) {
            openTimeModal([date], existingSelection.times)
            return
        }

        setSelectedDates((prev) => {
            const alreadySelected = prev.some((selectedDate) => isSameDay(selectedDate, date))

            return alreadySelected
                ? prev.filter((selectedDate) => !isSameDay(selectedDate, date))
                : [...prev, date]
        })
    }

    const handleApplySelectedDates = () => {
        if (selectedDates.length === 0) return

        openTimeModal(selectedDates, generateAllTimeSlots())
    }

    const handleTimeConfirm = () => {
        if (editingDates.length === 0) return

        const editingDateKeys = new Set(editingDates.map(getDateKey))

        setSelectedDateTimes((prev) => {
            const preserved = prev.filter((dt) => !editingDateKeys.has(dt.date))

            if (tempSelectedTimes.length === 0) {
                return preserved
            }

            const updates = editingDates.map((date) => ({
                date: getDateKey(date),
                times: tempSelectedTimes,
            }))

            return [...preserved, ...updates].sort((a, b) => a.date.localeCompare(b.date))
        })

        setSelectedDates((prev) => prev.filter((date) => !editingDateKeys.has(getDateKey(date))))
        setIsTimeModalOpen(false)
        setEditingDates([])
        setTempSelectedTimes([])
    }

    const handleTimeModalOpenChange = (open: boolean) => {
        setIsTimeModalOpen(open)
        if (!open) {
            setEditingDates([])
            setTempSelectedTimes([])
        }
    }

    const isDateDisabled = (date: Date) => {
        if (!startDate || !endDate) return false
        return date < startDate || date > endDate
    }

    const handleFormSubmit = (e: React.FormEvent) => {
        onSubmit(e, selectedDateTimes)
    }

    const modalTitle = editingDates.length === 1
        ? "시간 수정"
        : "선택한 날짜 시간 적용"

    const modalDescription = editingDates.length === 1
        ? format(editingDates[0], "M월 d일 (eee)", { locale: ko })
        : `${editingDates.length}개 날짜에 같은 시간을 적용합니다`

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
                        <div className="flex justify-center gap-2 py-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggle("weekend")}
                                disabled={!hasAppointmentRange}
                            >
                                주말
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleBulkToggle("weekday")}
                                disabled={!hasAppointmentRange}
                            >
                                평일
                            </Button>
                        </div>
                        {startDate && endDate && (
                            <CustomCalendar
                                selected={selectedDates}
                                onSelect={handleDateSelect}
                                onDayClick={handleDateClick}
                                className="mx-auto p-3"
                                disabled={isDateDisabled}
                                defaultMonth={startDate}
                                fromDate={startDate}
                                toDate={endDate}
                                showOutsideDays={false}
                                isTimeScheduling={true}
                                selectedDateTimes={selectedDateTimes}
                            />
                        )}
                    </div>

                    <div className="pt-2 space-y-2">
                        <Button
                            type="button"
                            className="w-full"
                            disabled={selectedDates.length === 0}
                            onClick={handleApplySelectedDates}
                        >
                            {selectedDates.length > 0
                                ? `선택한 ${selectedDates.length}개 날짜 시간 적용`
                                : "시간을 적용할 날짜를 선택해주세요"}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                            저장된 날짜를 누르면 해당 날짜의 시간을 수정할 수 있습니다.
                        </p>
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

            <Dialog open={isTimeModalOpen} onOpenChange={handleTimeModalOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="text-center">
                        <DialogTitle className="text-center">{modalTitle}</DialogTitle>
                        <DialogDescription className="text-center">
                            {modalDescription}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        <TimeSlotSelector
                            selectedTimes={tempSelectedTimes}
                            onChange={setTempSelectedTimes}
                        />

                        <div className="flex justify-center gap-2 mt-6">
                            <Button variant="outline" onClick={() => handleTimeModalOpenChange(false)}>
                                취소
                            </Button>
                            <Button onClick={handleTimeConfirm}>
                                시간 저장
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
