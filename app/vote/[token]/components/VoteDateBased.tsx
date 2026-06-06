"use client"

import type React from "react"
import { useState } from "react"
import { eachDayOfInterval, isSameDay, parseISO } from "date-fns"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface VoteDateBasedProps {
  appointment: any
  name: string
  nameError: boolean
  submitting: boolean
  onNameChange: (value: string) => void
  onSubmit: (e: React.FormEvent, selectedDates: Date[]) => void
}

type DateGroup = "weekend" | "weekday"

export function VoteDateBased({
  appointment,
  name,
  nameError,
  submitting,
  onNameChange,
  onSubmit,
}: VoteDateBasedProps) {
  const t = useTranslations("vote")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])

  const handleDateSelect = (dates: Date[] | undefined) => {
    setSelectedDates(dates ?? [])
  }

  const isDateDisabled = (date: Date) => {
    if (!appointment?.start_date || !appointment?.end_date) return false
    return date < parseISO(appointment.start_date) || date > parseISO(appointment.end_date)
  }

  const isWeekendDate = (date: Date) => {
    const day = date.getDay()
    return day === 0 || day === 6
  }

  const getSelectableDatesByGroup = (group: DateGroup) => {
    if (!appointment?.start_date || !appointment?.end_date) return []

    return eachDayOfInterval({
      start: parseISO(appointment.start_date),
      end: parseISO(appointment.end_date),
    }).filter((date) => {
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

  const handleFormSubmit = (event: React.FormEvent) => {
    onSubmit(event, selectedDates)
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
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
        <Label className="mb-2 block">
          {t("availableDates")}{" "}
          {selectedDates.length > 0 && `(${t("selectedCount", { count: selectedDates.length })})`}
        </Label>
        <div className="w-full rounded-md border bg-background p-2">
          <div className="flex justify-center gap-2 py-2">
            <Button type="button" variant="outline" size="sm" onClick={() => handleBulkToggle("weekend")}>
              {t("weekend")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => handleBulkToggle("weekday")}>
              {t("weekday")}
            </Button>
          </div>
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
      </div>

      <div className="pt-4">
        <Button
          type="submit"
          className="w-full py-6 text-lg"
          disabled={selectedDates.length === 0 || !name.trim() || submitting}
        >
          {submitting ? t("submitting") : t("submit")}
        </Button>
        {!name.trim() && <p className="mt-2 text-center text-sm text-red-500">{t("nameRequired")}</p>}
      </div>
    </form>
  )
}
