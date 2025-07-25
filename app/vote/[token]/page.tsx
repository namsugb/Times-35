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
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  getAppointmentByToken,
  createVoter,
  createDateVotes,
  createTimeVotes,
  createWeekdayVotes,
  getVoters,
  updateDateVotes,
  updateTimeVotes,
  updateWeekdayVotes,
  addNotificationToQueue,
} from "@/lib/database"
import { checkVotingCompletion } from "@/lib/vote/checkcomplete"
import { VotingCompletionResult } from "@/lib/vote/checkcomplete"

interface DateTimeSelection {
  date: string
  times: number[]
}

const weekdays = [
  { id: 1, name: "월요일", short: "월" },
  { id: 2, name: "화요일", short: "화" },
  { id: 3, name: "수요일", short: "수" },
  { id: 4, name: "목요일", short: "목" },
  { id: 5, name: "금요일", short: "금" },
  { id: 6, name: "토요일", short: "토" },
  { id: 0, name: "일요일", short: "일" },
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
  const [showVotingCompleteModal, setShowVotingCompleteModal] = useState(false)
  const [isVotingComplete, setIsVotingComplete] = useState<VotingCompletionResult | null>(null)

  useEffect(() => {
    if (token) {
      loadAppointment()
    }
  }, [token])

  // 투표 완료 상태 확인
  useEffect(() => {
    const checkVotingStatus = async () => {
      if (appointment && !loading) {
        try {
          const isVotingComplete: VotingCompletionResult = await checkVotingCompletion(appointment.id)
          setIsVotingComplete(isVotingComplete)
          // 기준인원 모드에서는 투표 완료 모달을 표시하지 않음
          if (isVotingComplete.isComplete && appointment.method !== "minimum-required") {
            setShowVotingCompleteModal(true)
          }
        } catch (err) {
          console.error("투표 완료 상태 확인 오류:", err)
        }
      }
    }

    checkVotingStatus()
  }, [appointment, loading])


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
    setSelectedDates(dates ?? [])
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

  // 날짜 클릭 핸들러 
  const handleDateClick = (date: Date) => {
    if (appointment?.method !== "time-scheduling") return

    const isAlreadySelected = selectedDates.some(
      (d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
    )

    if (isAlreadySelected) {
      // 이미 선택된 날짜면 모달 열지 않음 (선택은 자동 해제됨)
      return
    }

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



  // 첫 투표인지 확인 (기존 투표자 목록에서 이름 검색)
  const isFirstVote = (voterName: string) => {
    return !voters.some(voter => voter.name === voterName)
  }


  /**
   * 투표제출 로직
   * 1단계: 투표 완료 상태 확인
   * 2단계: 현재 투표자가 첫 투표인지 수정 투표인지 확인
   * 3단계: 투표 완료 상태에서의 처리
   * 4단계: 투표자 생성 (기존 투표자는 upsert로 수정됨)
   * 5단계: 투표 방법에 따라 투표 데이터 생성
   * 6단계: 투표 완료시 알림 큐에 추가
   * 7단계: 투표 완료시 알림톡 전송
   * 8단계: 결과 페이지로 이동 (수정 투표인 경우 새로고침 파라미터 추가)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setSubmitting(true)

    try {


      // 1단계: 현재 투표자가 첫 투표인지 수정 투표인지 확인
      const isNewVoter = isFirstVote(name.trim())
      console.log("1단계 투표자 첫 투표 여부 확인")
      console.log(isNewVoter)

      // 2단계: 투표 완료 상태에서의 처리
      if (isVotingComplete?.isComplete) {
        // 기준인원 모드가 아닌 경우에만 새로운 투표 제한
        if (appointment.method !== "minimum-required") {
          // 투표가 완료된 상태에서 새로운 투표자는 차단
          if (isNewVoter) {
            setShowVotingCompleteModal(true)
            setSubmitting(false)
            return
          }
        }
        // 기존 투표자는 수정 허용 (모달 닫기)
        setShowVotingCompleteModal(false)
      }


      // 4단계: 투표자 생성 (기존 투표자는 upsert로 수정됨)
      console.log("4단계 투표자 생성 시작")
      const voter = await createVoter(appointment.id, name.trim())
      console.log("4단계 투표자 생성 완료:", voter)


      // 기존 투표자인 경우 기존 ID 사용
      const existingVoter = voters.find(v => v.name === name.trim())
      const actualVoterId = existingVoter ? existingVoter.id : voter.id
      console.log("실제 사용할 투표자 ID:", actualVoterId)


      if (!voter) {
        throw new Error("투표자 생성 실패")
      }

      // 5단계: 투표 방법에 따라 투표 데이터 생성
      if (appointment.method === "recurring") {
        // 반복 일정 투표
        if (isNewVoter) {
          // 첫 투표: 새로운 요일 투표 생성
          await createWeekdayVotes(actualVoterId, appointment.id, selectedWeekdays)
        } else {
          // 수정 투표: 기존 요일 투표 삭제 후 새로 생성
          await updateWeekdayVotes(actualVoterId, appointment.id, selectedWeekdays)
        }
      } else if (appointment.method === "time-scheduling") {
        // 시간 스케줄링 투표
        if (isNewVoter) {
          // 첫 투표: 새로운 시간 투표 생성
          await createTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        } else {
          // 수정 투표: 기존 시간 투표 삭제 후 새로 생성
          await updateTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        }
      } else {
        // 일반 날짜 투표
        const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
        if (isNewVoter) {
          // 첫 투표: 새로운 날짜 투표 생성
          await createDateVotes(actualVoterId, appointment.id, dateStrings)
        } else {
          // 수정 투표: 기존 날짜 투표 삭제 후 새로 생성
          await updateDateVotes(actualVoterId, appointment.id, dateStrings)
        }
      }
      console.log("5단계 투표 완료")

      //투표후 다시 투표 완료 상태 확인
      const isVotingComplete_after = await checkVotingCompletion(appointment.id)


      // 6단계 투표 완료시 알림 큐에 추가
      if (isVotingComplete_after.isComplete) {
        console.log("6단계 알림큐 추가 완료")
        const result = await addNotificationToQueue(appointment.id, appointment.creator_phone)
        console.log(result)
      }



      // 7단계: 투표 완료 시  알림톡 전송

      if (isVotingComplete_after.isComplete) {
        console.log("7단계 알림톡 전송 시작")
        await fetch(`/api/notifications/kakao/send_complete`, {
          method: "POST",
          body: JSON.stringify({
            appointmentId: appointment.id,
            phoneNumber: appointment.creator_phone,
            appointmentTitle: appointment.title,
            resultsUrl: `/results/${token}`,
          }),
        })
      }

      // 8단계: 결과 페이지로 이동 (수정 투표인 경우 새로고침 파라미터 추가)
      const resultUrl = `/results/${token}?refresh=${Date.now()}`
      router.push(resultUrl)
    } catch (err: any) {
      console.error("투표 제출 오류:", err)
      toast({
        title: "투표 실패",
        description: err.message || "투표 제출에 실패했습니다.",
        variant: "destructive",
      })
    }
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
                  이름을 입력해주세요
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameError(false)
                  }}
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

        {/* 투표 완료 모달 */}
        <Dialog open={showVotingCompleteModal} onOpenChange={setShowVotingCompleteModal}>
          <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-center"> !투표가 완료된 약속입니다!</DialogTitle>
              <DialogDescription className="text-center">
                모든 인원이 투표에 참여하여 투표가 종료되었습니다.
                <br />
                <span className="text-sm text-muted-foreground">
                  기존 투표자 이름으로 재투표시 투표가 수정됩니다.
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 text-center">


              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => {
                    setShowVotingCompleteModal(false)
                    router.push(`/results/${token}`)
                  }}
                  className="flex-1"
                >
                  결과 보기
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowVotingCompleteModal(false)}
                  className="flex-1"
                >
                  닫기
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                이름을 입력해주세요
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError(false)
                }}
                className={nameError ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder="이름"
              />
              {nameError && <p className="text-red-500 text-sm">이름을 입력해주세요.</p>}
            </div>

            <div className="space-y-2">
              <Label className="block mb-2">
                참석 가능한 {appointment.method === "time-scheduling" ? "날짜와 시간" : "날짜"}{" "}
                {selectedDates.length > 0 && `(${selectedDates.length}개 선택됨)`}
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
                  isTimeScheduling={appointment.method === "time-scheduling"}
                  selectedDateTimes={selectedDateTimes}
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
                        <Badge variant="outline">{dt.times.length === 1 ? `${dt.times[0]}시` : `${dt.times[0]}시~${dt.times[dt.times.length - 1]}시 외 ${dt.times.length}개`}</Badge>
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
              {Array.from({ length: 24 }, (_, i) => i).map((hour) => (
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

      {/* 투표 완료 모달 */}
      <Dialog open={showVotingCompleteModal} onOpenChange={setShowVotingCompleteModal}>
        <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center"> !투표가 완료된 약속입니다!</DialogTitle>
            <DialogDescription className="text-center">
              모든 인원이 투표에 참여하여 투표가 종료되었습니다.
              <br />
              <span className="text-sm text-muted-foreground">
                기존 투표자 이름으로 재투표시 투표가 수정됩니다.
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">


            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  setShowVotingCompleteModal(false)
                  router.push(`/results/${token}`)
                }}
                className="flex-1"
              >
                결과 보기
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowVotingCompleteModal(false)}
                className="flex-1"
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
