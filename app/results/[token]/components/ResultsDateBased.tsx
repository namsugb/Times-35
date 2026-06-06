"use client"

import { useEffect, useState } from "react"
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns"
import { Calendar, CheckCircle2, ChevronLeft, ChevronRight, Crown, UserPlus, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getCurrentUser } from "@/lib/auth"
import { getDateFnsLocale } from "@/lib/locale-date"
import { CreateGroupFromVotersModal } from "./CreateGroupFromVotersModal"

interface ResultsDateBasedProps {
  appointment: any
  dateResults: any
  voters: any[]
  token: string
  localePrefix: string
}

export function ResultsDateBased({ appointment, dateResults, voters, token, localePrefix }: ResultsDateBasedProps) {
  const router = useRouter()
  const t = useTranslations("results")
  const commonT = useTranslations("common")
  const locale = useLocale()
  const dateLocale = getDateFnsLocale(locale)
  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    format(addDays(new Date(2020, 7, 2), index), "EEE", { locale: dateLocale })
  )
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDateDetail, setShowDateDetail] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(
    appointment?.start_date ? parseISO(appointment.start_date) : new Date()
  )
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      setIsLoggedIn(Boolean(user))
    }
    checkAuth()
  }, [])

  const getResultVoters = (dateStr: string) => {
    const result = dateResults[dateStr]
    return result?.voterss || result?.voters || []
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    if (dateResults[dateStr] && dateResults[dateStr].count > 0) {
      setSelectedDate(dateStr)
      setShowDateDetail(true)
    }
  }

  const hasVotesInCurrentMonth = () => {
    if (!appointment?.start_date || !appointment?.end_date) return false
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const appointmentStart = parseISO(appointment.start_date)
    const appointmentEnd = parseISO(appointment.end_date)
    return appointmentStart <= monthEnd && appointmentEnd >= monthStart
  }

  const getColorIntensity = (count: number, totalVoters: number) => {
    if (count === 0) return "bg-gray-50 text-gray-400 border-gray-100"
    const percentage = totalVoters > 0 ? (count / totalVoters) * 100 : 0
    if (percentage === 100) return "bg-emerald-500 text-white border-emerald-600 shadow-sm"
    if (percentage >= 80) return "bg-green-500 text-white border-green-600 shadow-sm"
    if (percentage >= 60) return "bg-green-400 text-white border-green-500"
    if (percentage >= 40) return "bg-green-300 text-gray-900 border-green-400"
    if (percentage >= 20) return "bg-green-200 text-gray-800 border-green-300"
    return "bg-green-100 text-gray-700 border-green-200"
  }

  const sortedDates = Object.entries(dateResults)
    .map(([date, result]: [string, any]) => ({
      date,
      count: result.count,
      voters: result.voterss || result.voters || [],
    }))
    .sort((a, b) => b.count - a.count)

  const allAvailable = sortedDates.filter((date) => date.count === voters.length && voters.length > 0)
  const maxCount = sortedDates.length > 0 ? sortedDates[0].count : 0
  const maxAvailable = sortedDates.filter((date) => date.count === maxCount && maxCount > 0)
  const requiredAvailable = sortedDates.filter((date) => date.count >= appointment.required_participants)

  const getDateBadge = (dateStr: string) => {
    if (appointment.method === "all-available" && allAvailable.some((date) => date.date === dateStr)) {
      return <CheckCircle2 className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-emerald-500" />
    }
    if (appointment.method === "max-available" && maxAvailable.some((date) => date.date === dateStr)) {
      return <Crown className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-yellow-500" />
    }
    if (appointment.method === "minimum-required" && requiredAvailable.some((date) => date.date === dateStr)) {
      return <Users className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-blue-500" />
    }
    return null
  }

  const highlightDates =
    appointment.method === "all-available"
      ? allAvailable
      : appointment.method === "minimum-required"
        ? requiredAvailable
        : maxAvailable

  const highlightTitle =
    appointment.method === "all-available"
      ? t("allAvailable")
      : appointment.method === "minimum-required"
        ? t("requiredAvailable", { count: appointment.required_participants })
        : t("maxAvailable")

  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">{t("calendarTitle")}</CardTitle>
                  <CardDescription className="mt-2 text-sm">{t("calendarDescription")}</CardDescription>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))} className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="min-w-[140px] text-center text-lg font-semibold">
                    {format(currentMonth, "yyyy MMM", { locale: dateLocale })}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))} className="h-8 w-8 rounded-full p-0 hover:bg-gray-100">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasVotesInCurrentMonth() ? (
                <>
                  <div className="mb-3 grid grid-cols-7 gap-1">
                    {weekdayLabels.map((day, index) => (
                      <div
                        key={day}
                        className={`py-2 text-center text-sm font-medium ${
                          index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-600"
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
                      <div key={`empty-start-${index}`} className="aspect-square" />
                    ))}

                    {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }).map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd")
                      const result = dateResults[dateStr] || { count: 0 }
                      const isInRange =
                        appointment.start_date &&
                        appointment.end_date &&
                        day >= parseISO(appointment.start_date) &&
                        day <= parseISO(appointment.end_date)
                      const colorClasses = isInRange
                        ? getColorIntensity(result.count, voters.length)
                        : "bg-gray-50 text-gray-300 border-gray-100"

                      return (
                        <button
                          key={dateStr}
                          type="button"
                          className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border transition-all duration-200 ${colorClasses} ${
                            result.count > 0 && isInRange ? "cursor-pointer hover:scale-105 hover:shadow-md active:scale-95" : "cursor-default"
                          }`}
                          onClick={() => isInRange && result.count > 0 && handleDateClick(day)}
                        >
                          <span className="mb-0.5 text-sm font-semibold">{format(day, "d")}</span>
                          {isInRange && result.count > 0 && (
                            <div className="text-center">
                              <div className="text-xs font-medium leading-none">{result.count}</div>
                              <div className="mt-0.5 hidden text-xs leading-none opacity-75 sm:block">
                                {voters.length > 0 ? `${Math.round((result.count / voters.length) * 100)}%` : "0%"}
                              </div>
                            </div>
                          )}
                          {getDateBadge(dateStr)}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <Calendar className="mx-auto mb-3 h-12 w-12 opacity-50" />
                  <p>{t("noVotesInMonth")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3 text-center">
                <div className="text-3xl font-bold text-primary">
                  {appointment.method === "minimum-required" ? voters.length : `${voters.length}/${appointment.required_participants}`}
                </div>
                <div className="text-lg font-medium">{t("participants")}</div>
                {voters.length > 0 && (
                  <div className="break-words text-sm text-muted-foreground">
                    {voters.map((voter) => voter.name).join(", ")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("resultTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {highlightDates.length > 0 ? (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 font-medium text-green-700">
                    <Crown className="h-4 w-4" />
                    {highlightTitle}
                  </h4>
                  <div className="space-y-2">
                    {highlightDates.map((date) => (
                      <div key={date.date} className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                        <span className="truncate font-medium">
                          {format(parseISO(date.date), "MMM d (EEE)", { locale: dateLocale })}
                        </span>
                        <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800">
                          {commonT("people", { count: date.count })}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-gray-50 py-6 text-center text-sm text-muted-foreground">
                  <Calendar className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>{t("noResults")}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            {voters.length > 0 && isLoggedIn && (
              <Button onClick={() => setIsCreateGroupModalOpen(true)} variant="secondary" className="w-full">
                <UserPlus className="mr-2 h-4 w-4" />
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
      </div>

      <Dialog open={showDateDetail} onOpenChange={setShowDateDetail}>
        <DialogContent className="mx-auto max-h-[75vh] max-w-[300px] rounded-xl p-2 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t("dateDetailTitle")}</DialogTitle>
            <DialogDescription>
              {selectedDate &&
                t("dateDetailDescription", {
                  date: format(parseISO(selectedDate), "MMM d (EEE)", { locale: dateLocale }),
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedDate && dateResults[selectedDate] && (
            <div className="py-2">
              <div className="space-y-2">
                <div>
                  <h4 className="mb-2 font-medium text-green-700">
                    {t("availableVoters", { count: dateResults[selectedDate].count })}
                  </h4>
                  <div className="grid max-h-40 grid-cols-1 gap-1 overflow-y-auto">
                    {getResultVoters(selectedDate).map((voter: string, index: number) => (
                      <div key={`${voter}-${index}`} className="flex items-center gap-1 rounded border border-green-200 bg-green-50 p-1">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                        <span className="truncate text-sm font-medium">{voter}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-gray-700">{t("unavailableVoters")}</h4>
                  <div className="rounded bg-gray-50 p-2 text-sm text-muted-foreground">
                    {voters
                      .filter((voter) => !getResultVoters(selectedDate).includes(voter.name))
                      .map((voter) => voter.name)
                      .join(", ") || commonT("none")}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <CreateGroupFromVotersModal
        open={isCreateGroupModalOpen}
        onOpenChange={setIsCreateGroupModalOpen}
        voters={voters}
        appointmentTitle={appointment.title}
      />
    </>
  )
}
