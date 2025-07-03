"use client"

import type React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

interface DateTimeSelection {
  date: string
  times: number[]
}

const weekdays = [
  { id: 0, name: "일요일", short: "일" },
  { id: 1, name: "월요일", short: "월" },
  { id: 2, name: "화요일", short: "화" },
  { id: 3, name: "수요일", short: "수" },
  { id: 4, name: "목요일", short: "목" },
  { id: 5, name: "금요일", short: "금" },
  { id: 6, name: "토요일", short: "토" },
]

export default function VotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState("")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedDateTimes, setSelectedDateTimes] = useState<DateTimeSelection[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [nameError, setNameError] = useState(false)
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
  const [tempSelectedTimes, setTempSelectedTimes] = useState<number[]>([])

  // Get parameters from URL
  const appointmentName = searchParams.get("name") || "약속"
  const startDateStr = searchParams.get("startDate")
  const endDateStr = searchParams.get("endDate")
  const method = searchParams.get("method") || ""
  const weeklyMeetings = searchParams.get("weeklyMeetings") || "1"

  // Parse dates from URL parameters
  const startDate = startDateStr ? parseISO(startDateStr) : new Date()
  const endDate = endDateStr ? parseISO(endDateStr) : new Date()

  // Check method type
  const isTimeScheduling = method === "time-scheduling"
  const isRecurring = method === "recurring"

  // Generate time slots (0-23)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([])
      setSelectedDateTimes([])
      return
    }

    const validDates = dates.filter((date) => date instanceof Date && !isNaN(date.getTime()))
    setSelectedDates(validDates)

    if (!isTimeScheduling) {
      return
    }

    const validDateStrings = validDates.map((date) => format(date, "yyyy-MM-dd"))
    setSelectedDateTimes((prev) => prev.filter((dt) => validDateStrings.includes(dt.date)))
  }

  const handleWeekdayToggle = (weekdayId: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(weekdayId)) {
        return prev.filter((id) => id !== weekdayId)
      } else {
        return [...prev, weekdayId].sort()
      }
    })
  }

  const handleDateClick = (date: Date) => {
    if (!isTimeScheduling) return

    const dateStr = format(date, "yyyy-MM-dd")
    const existingSelection = selectedDateTimes.find((dt) => dt.date === dateStr)

    setCurrentSelectedDate(date)
    setTempSelectedTimes(existingSelection?.times || [])
    setIsTimeModalOpen(true)
  }

  const handleTimeToggle = (hour: number) => {
    setTempSelectedTimes((prev) => {
      if (prev.includes(hour)) {
        return prev.filter((h) => h !== hour)
      } else {
        return [...prev, hour].sort((a, b) => a - b)
      }
    })
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    if (isRecurring) {
      if (selectedWeekdays.length === 0) {
        return
      }

      const submissionData = {
        name,
        selectedWeekdays,
        weeklyMeetings: Number.parseInt(weeklyMeetings),
      }

      console.log(submissionData)
      router.push("/results")
      return
    }

    if (selectedDates.length === 0) {
      return
    }

    const validDates = selectedDates.filter((date) => date instanceof Date && !isNaN(date.getTime()))

    const submissionData = {
      name,
      selectedDates: validDates.map((date) => format(date, "yyyy-MM-dd")),
      ...(isTimeScheduling && { selectedDateTimes }),
    }

    console.log(submissionData)
    router.push("/results")
  }

  const isDateDisabled = (date: Date) => {
    return date < startDate || date > endDate
  }

  const getDateTimeInfo = (date: Date) => {
    if (!isTimeScheduling) return null

    const dateStr = format(date, "yyyy-MM-dd")
    const dateTimeSelection = selectedDateTimes.find((dt) => dt.date === dateStr)
    return dateTimeSelection
  }

  const formatTimeRange = (times: number[]) => {
    if (times.length === 0) return ""
    if (times.length === 1) return `${times[0]}시`
    return `${times[0]}시~${times[times.length - 1]}시 외 ${times.length}개`
  }

  if (isRecurring) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">가능한 요일을 선택해주세요</CardTitle>
            <CardDescription>
              {appointmentName}에 참석 가능한 요일을 모두 선택해주세요.
              <br />
              <span className="text-sm text-primary mt-1 block">일주일에 {weeklyMeetings}번 만날 예정입니다.</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className={nameError ? "text-red-500" : ""}>
                  이름을 입력해주세요 *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError(false)
                  }}
                  className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder="홍길동"
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
                      className={`cursor-pointer transition-all duration-200 ${
                        selectedWeekdays.includes(weekday.id)
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      }`}
                      onClick={() => handleWeekdayToggle(weekday.id)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                              selectedWeekdays.includes(weekday.id)
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}
                          >
                            {weekday.short}
                          </div>
                          <span className="font-medium">{weekday.name}</span>
                        </div>
                        {selectedWeekdays.includes(weekday.id) && (
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                          </div>
                        )}
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
                  disabled={selectedWeekdays.length === 0 || !name.trim()}
                >
                  투표 완료하기 {selectedWeekdays.length > 0 && `(${selectedWeekdays.length}개)`}
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            선택한 요일:{" "}
            {selectedWeekdays.length > 0
              ? selectedWeekdays.map((id) => weekdays.find((w) => w.id === id)?.short).join(", ")
              : "없음"}
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isTimeScheduling ? "가능한 날짜와 시간을 선택해주세요" : "가능한 날짜를 선택해주세요"}
          </CardTitle>
          <CardDescription>
            {appointmentName}에 참석 가능한 {isTimeScheduling ? "날짜와 시간을" : "날짜를"} 모두 선택해주세요.
            <br />
            <span className="text-sm text-muted-foreground mt-1">
              {format(startDate, "M월 d일", { locale: ko })} ~ {format(endDate, "M월 d일", { locale: ko })} 사이에서
              선택
            </span>
            {isTimeScheduling && (
              <span className="text-sm text-primary block mt-1">날짜를 클릭하여 시간을 선택하세요</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className={nameError ? "text-red-500" : ""}>
                이름을 입력해주세요 *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(false)
                }}
                className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="홍길동"
              />
              {nameError && <p className="text-red-500 text-sm">이름을 입력해주세요.</p>}
            </div>

            <div className="space-y-2">
              <Label className="block mb-2">
                참석 가능한 {isTimeScheduling ? "날짜와 시간" : "날짜"}{" "}
                {selectedDates.length > 0 && `(${selectedDates.length}개 선택됨)`}
              </Label>
              <div className="flex justify-center border rounded-md p-1">
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  onDayClick={handleDateClick}
                  className="rounded-md mx-auto"
                  locale={ko}
                  disabled={isDateDisabled}
                  defaultMonth={startDate}
                  fromDate={startDate}
                  toDate={endDate}
                  showOutsideDays={false}
                  fixedWeeks={false}
                  modifiers={{
                    selected: selectedDates,
                  }}
                  modifiersStyles={{
                    selected: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    },
                  }}
                  styles={{
                    day_selected: {
                      backgroundColor: "hsl(var(--primary))",
                      color: "hsl(var(--primary-foreground))",
                    },
                    day_today: {
                      backgroundColor: "transparent",
                      color: "hsl(var(--primary))",
                      fontWeight: "bold",
                    },
                  }}
                  components={{
                    DayContent: ({ date }) => {
                      const dateTimeInfo = getDateTimeInfo(date)
                      const isSelected = selectedDates.some((selectedDate) => selectedDate.getTime() === date.getTime())

                      return (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <span className={isSelected ? "text-primary-foreground" : ""}>{date.getDate()}</span>
                          {dateTimeInfo && dateTimeInfo.times.length > 0 && (
                            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                              <Clock className={`h-3 w-3 ${isSelected ? "text-primary-foreground" : "text-primary"}`} />
                            </div>
                          )}
                        </div>
                      )
                    },
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                참석 가능한 {isTimeScheduling ? "날짜를 클릭하여 시간을" : "날짜를 모두 클릭하여"} 선택해주세요.
              </p>

              {isTimeScheduling && selectedDateTimes.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm font-medium">선택된 날짜와 시간:</Label>
                  <div className="space-y-1">
                    {selectedDateTimes.map((dt) => (
                      <div key={dt.date} className="flex items-center justify-between text-sm">
                        <span>{format(parseISO(dt.date), "M월 d일 (eee)", { locale: ko })}</span>
                        <Badge variant="outline">{formatTimeRange(dt.times)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full py-6 text-lg"
                disabled={selectedDates.length === 0 || !name.trim()}
              >
                투표 완료하기 {selectedDates.length > 0 && `(${selectedDates.length}개)`}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          선택한 날짜:{" "}
          {selectedDates.length > 0
            ? selectedDates
                .filter((date) => date instanceof Date && !isNaN(date.getTime()))
                .map((date) => format(date, "M월 d일", { locale: ko }))
                .join(", ")
            : "없음"}
        </CardFooter>
      </Card>

      {/* Time Selection Modal */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>시간 선택</DialogTitle>
            <DialogDescription>
              {currentSelectedDate && format(currentSelectedDate, "M월 d일 (eee)", { locale: ko })}에 참석 가능한 시간을
              선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-12 gap-2">
              {timeSlots.map((hour) => (
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
                <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleTimeConfirm}>확인</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
