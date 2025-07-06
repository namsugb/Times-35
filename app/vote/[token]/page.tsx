"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, Clock, Users, Repeat, Timer, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getAppointmentByToken,
  createVoter,
  createDateVotes,
  createTimeVotes,
  createWeekdayVotes,
  getVoters,
} from "@/lib/database"
import 'react-day-picker/dist/style.css'

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
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [appointment, setAppointment] = useState<any>(null)
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState(false)
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [selectedDateTimes, setSelectedDateTimes] = useState<DateTimeSelection[]>([])
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
  const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
  const [tempSelectedTimes, setTempSelectedTimes] = useState<number[]>([])

  useEffect(() => {
    if (token) {
      loadAppointment()
    }
  }, [token])

  const loadAppointment = async () => {
    try {
      setLoading(true)
      const appointmentData = await getAppointmentByToken(token)
      if (!appointmentData) {
        setError("약속을 찾을 수 없습니다.")
        return
      }
      setAppointment(appointmentData)

      // 기존 투표자 목록도 로드
      const votersData = await getVoters(appointmentData.id)
      setVoters(votersData)
    } catch (err: any) {
      console.error("약속 로딩 오류:", err)
      setError(err.message || "약속을 불러오는데 실패했습니다.")
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "all-available":
        return <Calendar className="h-5 w-5" />
      case "max-available":
        return <Users className="h-5 w-5" />
      case "minimum-required":
        return <Clock className="h-5 w-5" />
      case "time-scheduling":
        return <Timer className="h-5 w-5" />
      case "recurring":
        return <Repeat className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  const getMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      "all-available": "모두 가능한 날",
      "max-available": "최대 다수 가능",
      "minimum-required": "기준 인원 이상 가능",
      "time-scheduling": "약속 시간정하기",
      recurring: "반복 일정 선택",
    }
    return methodNames[method] || method
  }

  // 날짜 선택 핸들러
  const handleDateSelect = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([])
      setSelectedDateTimes([])
      return
    }

    const validDates = dates.filter((date) => date instanceof Date && !isNaN(date.getTime()))
    setSelectedDates(validDates)

    if (appointment?.method !== "time-scheduling") {
      return
    }

    const validDateStrings = validDates.map((date) => format(date, "yyyy-MM-dd"))
    setSelectedDateTimes((prev) => prev.filter((dt) => validDateStrings.includes(dt.date)))
  }

  // 요일 선택 핸들러
  const handleWeekdayToggle = (weekdayId: number) => {
    setSelectedWeekdays((prev) => {
      if (prev.includes(weekdayId)) {
        return prev.filter((id) => id !== weekdayId)
      } else {
        return [...prev, weekdayId].sort()
      }
    })
  }

  // 날짜 클릭 핸들러 (시간 스케줄링용)
  const handleDateClick = (date: Date) => {
    if (appointment?.method !== "time-scheduling") return

    const dateStr = format(date, "yyyy-MM-dd")
    const existingSelection = selectedDateTimes.find((dt) => dt.date === dateStr)

    setCurrentSelectedDate(date)
    setTempSelectedTimes(existingSelection?.times || [])
    setIsTimeModalOpen(true)
  }

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

  // 시간 선택 확인
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

  // 날짜가 선택 가능한지 확인
  const isDateDisabled = (date: Date) => {
    if (!appointment?.start_date || !appointment?.end_date) return false
    const startDate = parseISO(appointment.start_date)
    const endDate = parseISO(appointment.end_date)
    return date < startDate || date > endDate
  }

  // 투표 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      toast({
        title: "이름을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    // 방식별 유효성 검사
    if (appointment.method === "recurring") {
      if (selectedWeekdays.length === 0) {
        toast({
          title: "요일을 선택해주세요",
          variant: "destructive",
        })
        return
      }
    } else {
      if (selectedDates.length === 0) {
        toast({
          title: "날짜를 선택해주세요",
          variant: "destructive",
        })
        return
      }
    }

    try {
      setSubmitting(true)

      // 1. 투표자 생성
      const voter = await createVoter({
        appointment_id: appointment.id,
        name: name.trim(),
        session_id: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      })

      // 2. 방식별 투표 데이터 저장
      if (appointment.method === "recurring") {
        await createWeekdayVotes(voter.id, appointment.id, selectedWeekdays)
      } else if (appointment.method === "time-scheduling") {
        await createTimeVotes(voter.id, appointment.id, selectedDateTimes)
      } else {
        const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
        await createDateVotes(voter.id, appointment.id, dateStrings)
      }

      toast({
        title: "🎉 투표가 완료되었습니다!",
        description: "참여해주셔서 감사합니다.",
      })

      // 결과 페이지로 이동
      router.push(`/results/${token}`)
    } catch (error: any) {
      console.error("투표 제출 오류:", error)
      toast({
        title: "투표 실패",
        description: error.message || "투표 제출에 실패했습니다.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // 시간 슬롯 생성 (0-23시)
  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  // 날짜-시간 정보 가져오기
  const getDateTimeInfo = (date: Date) => {
    if (appointment?.method !== "time-scheduling") return null
    const dateStr = format(date, "yyyy-MM-dd")
    return selectedDateTimes.find((dt) => dt.date === dateStr)
  }

  // 시간 범위 포맷팅
  const formatTimeRange = (times: number[]) => {
    if (times.length === 0) return ""
    if (times.length === 1) return `${times[0]}시`
    return `${times[0]}시~${times[times.length - 1]}시 외 ${times.length}개`
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">약속 정보를 불러오는 중...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">오류가 발생했습니다</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push("/")} variant="outline">
              홈으로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 반복 일정 UI
  if (appointment.method === "recurring") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getMethodIcon(appointment.method)}
              <CardTitle className="text-xl sm:text-2xl">{appointment.title}</CardTitle>
            </div>
            <CardDescription>
              <Badge variant="secondary" className="mb-2">
                {getMethodName(appointment.method)}
              </Badge>
              <br />
              참석 가능한 요일을 모두 선택해주세요.
              <br />
              <span className="text-sm text-primary mt-1 block">
                일주일에 {appointment.weekly_meetings}번 만날 예정입니다.
              </span>
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
                  placeholder="남승수"
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
            </form>
          </CardContent>
          <CardContent className="pt-0">
            <div className="text-center text-sm text-muted-foreground">
              선택한 요일:{" "}
              {selectedWeekdays.length > 0
                ? selectedWeekdays.map((id) => weekdays.find((w) => w.id === id)?.short).join(", ")
                : "없음"}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 일반 날짜 선택 UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getMethodIcon(appointment.method)}
            <CardTitle className="text-xl sm:text-2xl">{appointment.title}</CardTitle>
          </div>
          <CardDescription>
            <Badge variant="secondary" className="mb-2">
              {getMethodName(appointment.method)}
            </Badge>
            <br />
            {appointment.method === "time-scheduling" ? "가능한 날짜와 시간을" : "가능한 날짜를"} 모두 선택해주세요.
            <br />
            <span className="text-sm text-muted-foreground mt-1">
              {format(parseISO(appointment.start_date), "M월 d일", { locale: ko })} ~{" "}
              {format(parseISO(appointment.end_date), "M월 d일", { locale: ko })} 사이에서 선택
            </span>
            {appointment.method === "time-scheduling" && (
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
                placeholder="남승수"
              />
              {nameError && <p className="text-red-500 text-sm">이름을 입력해주세요.</p>}
            </div>

            <div className="space-y-2">
              <Label className="block mb-2">
                참석 가능한 {appointment.method === "time-scheduling" ? "날짜와 시간" : "날짜"}{" "}
                {selectedDates.length > 0 && `(${selectedDates.length}개 선택됨)`}
              </Label>
              <div className="w-full border rounded-md p-2 bg-background">
                <CalendarComponent
                  mode="multiple"
                  numberOfMonths={1}
                  locale={ko}
                  selected={selectedDates}
                  onSelect={handleDateSelect}
                  onDayClick={handleDateClick}
                  className="w-full mx-auto"
                  disabled={isDateDisabled}
                  defaultMonth={parseISO(appointment.start_date)}
                  fromDate={parseISO(appointment.start_date)}
                  toDate={parseISO(appointment.end_date)}
                  showOutsideDays={false}
                  fixedWeeks={false}
                  classNames={{
                    months: "",
                    month: "",
                    caption: "flex items-center justify-between px-2 h-10",
                    caption_label: "text-base font-semibold text-center flex-1 leading-7",

                    nav_button:
                      "h-7 w-7 flex items-center justify-center text-lg bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md border border-input text-primary hover:bg-accent hover:text-accent-foreground transition-colors",
                    nav_button_previous: "order-first",
                    nav_button_next: "order-last",
                    table: "w-full border-collapse space-y-1",
                    head_row: "",
                    head_cell: "text-muted-foreground rounded-md font-normal text-[0.8rem]",
                    row: "",
                    cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground",
                    day_selected:
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside:
                      "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
                  }}
                />
              </div>

              <p className="text-sm text-muted-foreground mt-2">
                참석 가능한{" "}
                {appointment.method === "time-scheduling" ? "날짜를 클릭하여 시간을" : "날짜를 모두 클릭하여"}{" "}
                선택해주세요.
              </p>

              {appointment.method === "time-scheduling" && selectedDateTimes.length > 0 && (
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
                disabled={selectedDates.length === 0 || !name.trim() || submitting}
              >
                {submitting
                  ? "투표 중..."
                  : `투표 완료하기 ${selectedDates.length > 0 ? `(${selectedDates.length}개)` : ""}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 시간 선택 모달 */}
      <Dialog open={isTimeModalOpen} onOpenChange={setIsTimeModalOpen}>
        <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle>시간 선택</DialogTitle>
            <DialogDescription>
              {currentSelectedDate && format(currentSelectedDate, "M월 d일 (eee)", { locale: ko })}에 참석 가능한 시간을
              선택해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
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
