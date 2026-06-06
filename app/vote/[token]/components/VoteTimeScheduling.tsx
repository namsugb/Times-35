"use client"

import type React from "react"
import { useState } from "react"
import { eachDayOfInterval, format, isSameDay, parseISO } from "date-fns"
import { Loader2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { TimeSlotSelector } from "@/components/time-slot-selector"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getDateFnsLocale } from "@/lib/locale-date"

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
  const t = useTranslations("vote")
  const commonT = useTranslations("common")
  const locale = useLocale()
  const dateLocale = getDateFnsLocale(locale)
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

  const isDateDisabled = (date: Date) => {
    if (!startDate || !endDate) return false
    return date < startDate || date > endDate
  }

  const getSelectableDatesByGroup = (group: DateGroup) => {
    if (!startDate || !endDate) return []

    return eachDayOfInterval({ start: startDate, end: endDate }).filter((date) => {
      if (isDateDisabled(date)) return false
      return group === "weekend" ? isWeekendDate(date) : !isWeekendDate(date)
    })
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
    const existingSelection = selectedDateTimes.find((dateTime) => dateTime.date === dateStr)

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
      const preserved = prev.filter((dateTime) => !editingDateKeys.has(dateTime.date))

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

  const modalTitle = editingDates.length === 1 ? t("editTime") : t("applyTimeToDates")
  const modalDescription =
    editingDates.length === 1
      ? format(editingDates[0], "MMM d (eee)", { locale: dateLocale })
      : t("sameTimeForDates", { count: editingDates.length })

  return (
    <>
      <form onSubmit={(event) => onSubmit(event, selectedDateTimes)} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className={nameError ? "text-red-500" : ""}>
            {t("nameLabel")}
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
            placeholder={t("namePlaceholder")}
          />
          {nameError && <p className="text-sm text-red-500">{t("nameRequired")}</p>}
        </div>

        <div className="space-y-2">
          <Label className="mb-2 block">{t("availableDateTimes")}</Label>
          <div className="w-full rounded-md border bg-background p-2">
            <div className="flex justify-center gap-2 py-2">
              <Button type="button" variant="outline" size="sm" onClick={() => handleBulkToggle("weekend")} disabled={!hasAppointmentRange}>
                {t("weekend")}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => handleBulkToggle("weekday")} disabled={!hasAppointmentRange}>
                {t("weekday")}
              </Button>
            </div>
            {startDate && endDate && (
              <CustomCalendar
                selected={selectedDates}
                onSelect={setSelectedDates}
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

          <Button type="button" className="w-full" disabled={selectedDates.length === 0} onClick={handleApplySelectedDates}>
            {selectedDates.length > 0
              ? t("applyTimes", { count: selectedDates.length })
              : t("selectDatesForTime")}
          </Button>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full py-6 text-lg" disabled={selectedDateTimes.length === 0 || !name.trim() || submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="animate-pulse">{t("submitting")}</span>
              </>
            ) : (
              <span className="font-bold">{t("submit")}</span>
            )}
          </Button>
          {!name.trim() && <p className="mt-2 text-center text-sm text-red-500">{t("nameRequired")}</p>}
        </div>
      </form>

      <Dialog open={isTimeModalOpen} onOpenChange={handleTimeModalOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="text-center">
            <DialogTitle className="text-center">{modalTitle}</DialogTitle>
            <DialogDescription className="text-center">{modalDescription}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TimeSlotSelector selectedTimes={tempSelectedTimes} onChange={setTempSelectedTimes} />
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => handleTimeModalOpenChange(false)}>
                {commonT("cancel")}
              </Button>
              <Button onClick={handleTimeConfirm}>{t("saveTimes")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
