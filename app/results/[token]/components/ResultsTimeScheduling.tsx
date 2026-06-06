"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, Crown, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { CreateGroupFromVotersModal } from "./CreateGroupFromVotersModal"
import { TimeResultViewer } from "@/components/time-result-viewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/auth"
import { getDateFnsLocale } from "@/lib/locale-date"
import { cn } from "@/lib/utils"

interface ResultsTimeSchedulingProps {
  appointment: any
  timeResults: Array<{ date: string; time: string; count: number; voters: string[] }>
  voters: any[]
  token: string
  localePrefix: string
}

export function ResultsTimeScheduling({
  appointment,
  timeResults,
  voters,
  token,
  localePrefix,
}: ResultsTimeSchedulingProps) {
  const router = useRouter()
  const t = useTranslations("results")
  const commonT = useTranslations("common")
  const locale = useLocale()
  const dateLocale = getDateFnsLocale(locale)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isTimeResultModalOpen, setIsTimeResultModalOpen] = useState(false)
  const [selectedRangeVoters, setSelectedRangeVoters] = useState<{ date: string; time: string; voters: string[] } | null>(null)
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false)
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      setIsLoggedIn(Boolean(user))
    }
    checkAuth()
  }, [])

  const timeResultsByDate = timeResults.reduce((acc: Record<string, typeof timeResults>, result) => {
    if (!acc[result.date]) acc[result.date] = []
    acc[result.date].push(result)
    return acc
  }, {})

  const datesWithVotes = Object.keys(timeResultsByDate).map((dateStr) => parseISO(dateStr))

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    if (timeResultsByDate[dateStr]) {
      setSelectedDate(date)
      setIsTimeResultModalOpen(true)
    }
  }

  const selectedDateResults = selectedDate ? timeResultsByDate[format(selectedDate, "yyyy-MM-dd")] || [] : []

  const calculateTopTimeRanges = () => {
    if (timeResults.length === 0) return []

    const groupedByDate: Record<string, Array<{ time: string; count: number; voters: string[] }>> = {}
    timeResults.forEach((result) => {
      if (!groupedByDate[result.date]) groupedByDate[result.date] = []
      groupedByDate[result.date].push({ time: result.time, count: result.count, voters: result.voters })
    })

    Object.keys(groupedByDate).forEach((date) => {
      groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time))
    })

    const isSameVoters = (first: string[], second: string[]) => {
      if (first.length !== second.length) return false
      const firstSet = new Set(first)
      return second.every((voter) => firstSet.has(voter))
    }

    const ranges: Array<{ date: string; startTime: string; endTime: string; count: number; voters: string[] }> = []

    Object.entries(groupedByDate).forEach(([date, times]) => {
      if (times.length === 0) return

      let currentRange = {
        date,
        startTime: times[0].time,
        endTime: times[0].time,
        count: times[0].count,
        voters: [...times[0].voters],
      }

      for (let i = 1; i < times.length; i++) {
        const [prevHour, prevMin] = times[i - 1].time.split(":").map(Number)
        const [currHour, currMin] = times[i].time.split(":").map(Number)
        const prevMinutes = prevHour * 60 + prevMin
        const currMinutes = currHour * 60 + currMin

        if (currMinutes - prevMinutes === 30 && isSameVoters(times[i - 1].voters, times[i].voters)) {
          currentRange.endTime = times[i].time
        } else {
          ranges.push(currentRange)
          currentRange = {
            date,
            startTime: times[i].time,
            endTime: times[i].time,
            count: times[i].count,
            voters: [...times[i].voters],
          }
        }
      }

      ranges.push(currentRange)
    })

    const getDuration = (startTime: string, endTime: string) => {
      const [startHour, startMin] = startTime.split(":").map(Number)
      const [endHour, endMin] = endTime.split(":").map(Number)
      return endHour * 60 + endMin - (startHour * 60 + startMin) + 30
    }

    return ranges
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        const durationDiff = getDuration(b.startTime, b.endTime) - getDuration(a.startTime, a.endTime)
        if (durationDiff !== 0) return durationDiff
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.startTime.localeCompare(b.startTime)
      })
      .slice(0, 5)
  }

  const topTimeRanges = calculateTopTimeRanges()
  const maxVoterCount = Math.max(...topTimeRanges.map((range) => range.count), voters.length > 0 ? voters.length : 1)

  const getEndTime = (time: string) => {
    const [hour, minute] = time.split(":").map(Number)
    const totalMinutes = hour * 60 + minute + 30
    return `${Math.floor(totalMinutes / 60).toString().padStart(2, "0")}:${(totalMinutes % 60).toString().padStart(2, "0")}`
  }

  const getProgressBar = (count: number, maxCount: number) => {
    const barLength = Math.max(1, Math.round((count / maxCount) * 10))
    return "■".repeat(barLength)
  }

  const isDateDisabled = (date: Date) => {
    if (!appointment?.start_date || !appointment?.end_date) return false
    return date < parseISO(appointment.start_date) || date > parseISO(appointment.end_date)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {topTimeRanges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                {t("resultTitle")}
              </CardTitle>
              <CardDescription>{t("bestTimesDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topTimeRanges.map((range, index) => {
                  const dateObj = parseISO(range.date)
                  const dateLabel = format(dateObj, "MMM d (EEE)", { locale: dateLocale })
                  const endTime = getEndTime(range.endTime)
                  const timeLabel = range.startTime === range.endTime ? range.startTime : `${range.startTime}-${endTime}`

                  return (
                    <button
                      key={`${range.date}-${range.startTime}-${index}`}
                      type="button"
                      onClick={() => {
                        setSelectedRangeVoters({
                          date: format(dateObj, "MMM d (EEE)", { locale: dateLocale }),
                          time: timeLabel,
                          voters: range.voters,
                        })
                        setIsVoterModalOpen(true)
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-gray-50"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                          index === 0 && "bg-yellow-500 text-white",
                          index === 1 && "bg-gray-400 text-white",
                          index === 2 && "bg-amber-700 text-white",
                          index > 2 && "bg-gray-200 text-gray-700"
                        )}
                      >
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold">{dateLabel}</span>
                          <span className="text-sm text-muted-foreground">{timeLabel}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="font-mono text-xs text-green-600">{getProgressBar(range.count, maxVoterCount)}</div>
                          <span className="text-xs font-semibold text-gray-700">{commonT("people", { count: range.count })}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-sm font-bold text-green-600">
                          {voters.length > 0 ? Math.round((range.count / voters.length) * 100) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {range.count}/{voters.length}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl">
              <Calendar className="h-5 w-5" />
              {t("timeCalendarTitle")}
            </CardTitle>
            <CardDescription className="text-center text-sm">{t("timeCalendarDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full rounded-md border bg-background p-2">
              <CustomCalendar
                selected={datesWithVotes}
                onDayClick={handleDateClick}
                className="mx-auto p-3"
                disabled={isDateDisabled}
                defaultMonth={parseISO(appointment.start_date)}
                fromDate={parseISO(appointment.start_date)}
                toDate={parseISO(appointment.end_date)}
                showOutsideDays={false}
                isTimeScheduling={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3 text-center">
              <div className="text-3xl font-bold text-primary">{voters.length}</div>
              <div className="text-lg font-medium">{t("participants")}</div>
              {voters.length > 0 && (
                <div className="break-words text-sm text-muted-foreground">
                  {voters.map((voter) => voter.name).join(", ")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {voters.length > 0 && isLoggedIn && (
            <Button onClick={() => setIsCreateGroupModalOpen(true)} variant="secondary" className="w-full">
              <Users className="mr-2 h-4 w-4" />
              {t("createGroupFromVoters")}
            </Button>
          )}
          <Button onClick={() => router.push(`${localePrefix}/vote/${token}`)} className="w-full">
            {t("goVote")}
          </Button>
          <Button onClick={() => router.push(localePrefix)} variant="outline" className="w-full">
            {commonT("newAppointment")}
          </Button>
        </div>
      </div>

      <Dialog open={isTimeResultModalOpen} onOpenChange={setIsTimeResultModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate &&
                t("timeDetailTitle", {
                  date: format(selectedDate, "MMM d (EEE)", { locale: dateLocale }),
                })}
            </DialogTitle>
            <DialogDescription>{t("timeDetailDescription")}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <TimeResultViewer
              dateResults={selectedDateResults}
              totalVoters={voters.length}
              allVoterNames={voters.map((voter) => voter.name)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVoterModalOpen} onOpenChange={setIsVoterModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedRangeVoters?.date} {selectedRangeVoters?.time}
            </DialogTitle>
            <DialogDescription>
              {t("availablePeople", { count: selectedRangeVoters?.voters.length || 0 })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-wrap gap-2">
              {selectedRangeVoters?.voters.map((voter, index) => (
                <div key={`${voter}-${index}`} className="rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">
                  {voter}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CreateGroupFromVotersModal
        open={isCreateGroupModalOpen}
        onOpenChange={setIsCreateGroupModalOpen}
        voters={voters}
        appointmentTitle={appointment.title}
      />
    </div>
  )
}
