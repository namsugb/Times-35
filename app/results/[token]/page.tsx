"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  getAppointmentByToken,
  getDateVoteResults,
  getTimeVoteResults,
  getWeekdayVoteResults,
  getVoters,
} from "@/lib/database"
import { format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { ko } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  Timer,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Crown,
  CheckCircle2,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [appointment, setAppointment] = useState<any>(null)
  const [dateResults, setDateResults] = useState<any>({})
  const [timeResults, setTimeResults] = useState<any[]>([])
  const [weekdayResults, setWeekdayResults] = useState<any>({})
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showDateDetail, setShowDateDetail] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    loadResults()
  }, [token])

  useEffect(() => {
    // 약속 시작 날짜로 초기 월 설정
    if (appointment?.start_date) {
      setCurrentMonth(parseISO(appointment.start_date))
    }
  }, [appointment])

  const loadResults = async () => {
    try {
      setLoading(true)

      const appointmentData = await getAppointmentByToken(token)
      if (!appointmentData) {
        setError("약속을 찾을 수 없습니다.")
        return
      }

      setAppointment(appointmentData)

      // 투표자 목록 조회
      const votersData = await getVoters(appointmentData.id)
      setVoters(votersData)

      // 투표 결과 조회
      if (appointmentData.method === "recurring") {
        const weekdayData = await getWeekdayVoteResults(appointmentData.id)
        setWeekdayResults(weekdayData)
      } else if (appointmentData.method === "time-scheduling") {
        const timeData = await getTimeVoteResults(appointmentData.id)
        setTimeResults(timeData)
      } else {
        const dateData = await getDateVoteResults(appointmentData.id)
        setDateResults(dateData)
      }
    } catch (err: any) {
      console.error("결과 로딩 오류:", err)
      setError(err.message || "결과를 불러오는데 실패했습니다.")
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

  // 투표 수에 따른 색상 강도 계산 (개선된 버전)
  const getColorIntensity = (count: number, totalVoters: number) => {
    if (count === 0) return "bg-gray-50 text-gray-500 border-gray-200"

    const percentage = totalVoters > 0 ? (count / totalVoters) * 100 : 0

    if (percentage === 100) return "bg-emerald-600 text-white border-emerald-700 shadow-lg font-bold"
    if (percentage >= 80) return "bg-green-600 text-white border-green-700 shadow-md font-semibold"
    if (percentage >= 60) return "bg-green-500 text-white border-green-600 shadow-md"
    if (percentage >= 40) return "bg-green-400 text-gray-900 border-green-500 shadow-sm"
    if (percentage >= 20) return "bg-green-300 text-gray-900 border-green-400"
    return "bg-green-200 text-gray-800 border-green-300"
  }

  // 날짜 클릭 핸들러
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")
    if (dateResults[dateStr] && dateResults[dateStr].count > 0) {
      setSelectedDate(dateStr)
      setShowDateDetail(true)
    }
  }

  // 월 네비게이션
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  // 현재 월에 투표 가능한 날짜가 있는지 확인
  const hasVotesInCurrentMonth = () => {
    if (!appointment?.start_date || !appointment?.end_date) return false

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const appointmentStart = parseISO(appointment.start_date)
    const appointmentEnd = parseISO(appointment.end_date)

    return appointmentStart <= monthEnd && appointmentEnd >= monthStart
  }

  // 최적의 날짜 계산
  const getOptimalDates = () => {
    const sortedDates = Object.entries(dateResults)
      .map(([date, result]: [string, any]) => ({
        date,
        count: result.count,
        voters: result.voters,
        percentage: Math.round((result.count / voters.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    const allAvailable = sortedDates.filter((d) => d.count === voters.length)
    const maxAvailable = sortedDates.length > 0 ? [sortedDates[0]] : []
    const requiredAvailable = sortedDates.filter((d) => d.count >= appointment.required_participants)

    return {
      allAvailable,
      maxAvailable,
      requiredAvailable: requiredAvailable.slice(0, 5), // 상위 5개만
    }
  }

  const optimalDates = getOptimalDates()

  // 특별한 날짜인지 확인 (최적의 날짜들) 아이콘 추가
  const getDateBadge = (dateStr: string) => {
    const result = dateResults[dateStr]
    if (!result) return null

    if (optimalDates.allAvailable.some((d) => d.date === dateStr)) {
      return <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-white rounded-full" />
    }
    if (optimalDates.maxAvailable.some((d) => d.date === dateStr)) {
      return <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500 bg-white rounded-full" />
    }
    return null
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">결과를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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

  // 반복 일정 전용 UI
  if (appointment.method === "recurring") {
    const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]
    const weekdayShorts = ["일", "월", "화", "수", "목", "금", "토"]

    // 요일별 결과를 투표수 순으로 정렬
    const sortedWeekdays = Object.entries(weekdayResults)
      .map(([weekday, result]: [string, any]) => ({
        weekday: Number.parseInt(weekday),
        count: result.count,
        voters: result.voters,
        percentage: Math.round((result.count / voters.length) * 100),
      }))
      .sort((a, b) => b.count - a.count)

    // 상위 요일들 (주간 모임 횟수만큼)
    const selectedWeekdays = sortedWeekdays.slice(0, appointment.weekly_meetings)

    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 메인 콘텐츠 영역 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 약속 정보 헤더 */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  {getMethodIcon(appointment.method)}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl sm:text-2xl truncate">{appointment.title}</CardTitle>
                    <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                      <Badge variant="secondary">{getMethodName(appointment.method)}</Badge>
                      <span className="text-sm">주 {appointment.weekly_meetings}회 모임</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* 요일별 투표 결과 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">요일별 투표 현황</CardTitle>
                <CardDescription className="text-sm">
                  투표수가 많은 순으로 정렬되었습니다. 상위 {appointment.weekly_meetings}개 요일이 선택됩니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-6">
                  {weekdayShorts.map((day, weekdayIndex) => {
                    const result = weekdayResults[weekdayIndex] || { count: 0, voters: [] }
                    const isSelected = selectedWeekdays.some((w) => w.weekday === weekdayIndex)
                    const rank = sortedWeekdays.findIndex((w) => w.weekday === weekdayIndex) + 1

                    return (
                      <div
                        key={weekdayIndex}
                        className={`relative p-2 sm:p-4 rounded-lg border-2 text-center transition-all duration-200 ${isSelected
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-700 shadow-lg transform scale-105"
                          : result.count > 0
                            ? "bg-green-50 border-green-200 hover:border-green-300"
                            : "bg-gray-50 border-gray-200"
                          }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-yellow-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold shadow-md">
                            {rank}
                          </div>
                        )}

                        <div
                          className={`font-medium text-xs sm:text-sm mb-1 ${isSelected ? "text-white" : "text-gray-700"}`}
                        >
                          {day}
                        </div>
                        <div
                          className={`text-xs mb-1 sm:mb-2 hidden sm:block ${isSelected ? "text-green-100" : "text-gray-500"}`}
                        >
                          {weekdayNames[weekdayIndex]}
                        </div>
                        <div
                          className={`text-lg sm:text-2xl font-bold mb-1 ${isSelected ? "text-white" : result.count > 0 ? "text-green-600" : "text-gray-400"}`}
                        >
                          {result.count}
                        </div>
                        <div className={`text-xs ${isSelected ? "text-green-100" : "text-gray-500"}`}>
                          {result.count > 0 ? `${Math.round((result.count / voters.length) * 100)}%` : "0%"}
                        </div>

                        {isSelected && (
                          <div className="absolute inset-0 border-2 border-yellow-400 rounded-lg animate-pulse"></div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* 선택된 요일 요약 */}
                {selectedWeekdays.length > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-600" />
                      선택된 모임 요일 (주 {appointment.weekly_meetings}회)
                    </h3>
                    <div className="space-y-2">
                      {selectedWeekdays.map((weekday, index) => (
                        <div key={weekday.weekday} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium text-green-900">{weekdayNames[weekday.weekday]}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-700">{weekday.count}명</div>
                            <div className="text-sm text-green-600">{weekday.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 전체 순위 */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-gray-700">전체 투표 현황</h4>
                  <div className="space-y-2">
                    {sortedWeekdays.map((weekday, index) => {
                      const isSelected = index < appointment.weekly_meetings
                      return (
                        <div
                          key={weekday.weekday}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isSelected ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                                }`}
                            >
                              {index + 1}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium">{weekdayNames[weekday.weekday]}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {weekday.voters.join(", ") || "투표 없음"}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold">{weekday.count}명</div>
                            <div className="text-sm text-muted-foreground">{weekday.percentage}%</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 통계 정보 */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-3">
                  <div className="text-3xl font-bold text-primary">{voters.length}</div>
                  <div className="text-lg font-medium">총 참여자</div>
                  {voters.length > 0 && (
                    <div className="text-sm text-muted-foreground break-words">
                      {voters.map((voter) => voter.name).join(", ")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 모임 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">모임 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">주간 모임 횟수</span>
                  <span className="font-medium">{appointment.weekly_meetings}회</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">총 투표 수</span>
                  <span className="font-medium">
                    {Object.values(weekdayResults).reduce((sum: number, result: any) => sum + result.count, 0)}개
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">평균 참여율</span>
                  <span className="font-medium">
                    {voters.length > 0
                      ? Math.round(
                        (Object.values(weekdayResults).reduce((sum: number, result: any) => sum + result.count, 0) /
                          (voters.length * 7)) *
                        100,
                      )
                      : 0}
                    %
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 추가 액션 버튼들 */}
            <div className="space-y-3">
              <Button onClick={() => router.push(`/vote/${token}`)} className="w-full">
                투표 페이지로 이동
              </Button>
              <Button onClick={() => router.push("/")} variant="outline" className="w-full">
                새 약속 만들기
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 시간 스케줄링 방식 처리
  if (appointment.method === "time-scheduling") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center py-8">
          <p className="text-muted-foreground">시간 스케줄링 방식은 아직 지원하지 않습니다.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 영역 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 약속 정보 헤더 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {getMethodIcon(appointment.method)}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl truncate">{appointment.title}</CardTitle>
                  <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1">
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 달력 투표 결과 */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">투표 결과 달력</CardTitle>
                  <CardDescription className="text-sm mt-2">
                    색이 진할수록 더 많은 사람이 선택한 날짜입니다. 날짜를 클릭하면 상세 정보를 볼 수 있습니다.
                  </CardDescription>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    className="h-8 w-8 p-0 bg-transparent"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-base sm:text-lg font-semibold min-w-[120px] text-center">
                    {format(currentMonth, "yyyy년 M월", { locale: ko })}
                  </div>
                  <Button variant="outline" size="sm" onClick={goToNextMonth} className="h-8 w-8 p-0 bg-transparent">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {hasVotesInCurrentMonth() ? (
                <>
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
                    {["일", "월", "화", "수", "목", "금", "토"].map((day, index) => (
                      <div
                        key={day}
                        className={`text-center py-2 text-xs sm:text-sm font-medium ${index === 0 ? "text-red-500" : index === 6 ? "text-blue-500" : "text-gray-700"
                          }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* 달력 그리드 */}
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {/* 월 시작 전 빈 칸 */}
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`empty-start-${i}`} className="h-16 sm:h-20"></div>
                    ))}

                    {/* 실제 날짜들 */}
                    {eachDayOfInterval({
                      start: startOfMonth(currentMonth),
                      end: endOfMonth(currentMonth),
                    }).map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd")
                      const result = dateResults[dateStr] || { count: 0, voters: [] }
                      const isInRange =
                        appointment.start_date &&
                        appointment.end_date &&
                        day >= parseISO(appointment.start_date) &&
                        day <= parseISO(appointment.end_date)
                      const colorClasses = isInRange
                        ? getColorIntensity(result.count, voters.length)
                        : "bg-gray-50 text-gray-400 border-gray-200"

                      return (
                        <div
                          key={dateStr}
                          className={`h-16 sm:h-20 rounded-lg flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all duration-200 ${colorClasses} ${result.count > 0 && isInRange ? "hover:scale-105 hover:shadow-lg" : ""
                            } ${!isInRange ? "cursor-default" : ""}`}
                          onClick={() => isInRange && result.count > 0 && handleDateClick(day)}
                        >
                          <span className="text-sm sm:text-lg font-bold mb-1">{format(day, "d")}</span>
                          {isInRange && result.count > 0 && (
                            <>
                              <span className="text-xs font-semibold">
                                {result.count}/{voters.length}
                              </span>
                              <span className="text-xs opacity-90 hidden sm:block">
                                {Math.round((result.count / voters.length) * 100)}%
                              </span>
                            </>
                          )}
                          {getDateBadge(dateStr)}
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">이 달에는 투표 가능한 날짜가 없습니다.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 통계 정보 */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-3">
                <div className="text-3xl font-bold text-primary">
                  {voters.length}/{appointment.required_participants}
                </div>
                <div className="text-lg font-medium">참여 인원</div>
                {voters.length > 0 && (
                  <div className="text-sm text-muted-foreground break-words">
                    {voters.map((voter) => voter.name).join(", ")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 최적의 날짜 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">투표 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* 전원 참여 가능 */}
              {appointment.method === "all-available" && (
                <div>
                  {optimalDates.allAvailable.length > 0 ? (
                    <>
                      <h4 className="font-medium text-emerald-700 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        전원 참여 가능
                      </h4>
                      <div className="space-y-1">
                        {optimalDates.allAvailable.map((date) => (
                          <div
                            key={date.date}
                            className="flex justify-between items-center p-2 bg-emerald-50 rounded text-sm"
                          >
                            <span className="truncate">{format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 flex-shrink-0">
                              {date.count}명 (100%)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-2">
                      전원이 참여 가능한 날이 없습니다..!
                    </div>
                  )}
                </div>
              )}

              {/* 최다 참여 */}
              {appointment.method === "maximum-participants" && (
                <div>
                  {optimalDates.maxAvailable.length > 0 && (
                    <div>
                      <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        최다 참여
                      </h4>
                      <div className="space-y-1">
                        {optimalDates.maxAvailable.map((date) => (
                          <div
                            key={date.date}
                            className="flex justify-between items-center p-2 bg-yellow-50 rounded text-sm"
                          >
                            <span className="truncate">{format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}</span>
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                              {date.count}명 ({date.percentage}%)
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>)}

              {/* 기준 인원 이상 */}
              {optimalDates.requiredAvailable.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    기준 인원 이상 ({appointment.required_participants}명+)
                  </h4>
                  <div className="space-y-1">
                    {optimalDates.requiredAvailable.map((date) => (
                      <div key={date.date} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                        <span className="truncate">{format(parseISO(date.date), "M월 d일 (E)", { locale: ko })}</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 flex-shrink-0">
                          {date.count}명 ({date.percentage}%)
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {optimalDates.allAvailable.length === 0 &&
                optimalDates.maxAvailable.length === 0 &&
                optimalDates.requiredAvailable.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">아직 투표 결과가 없습니다.</div>
                )}
            </CardContent>
          </Card>

          {/* 추가 액션 버튼들 */}
          <div className="space-y-3">
            <Button onClick={() => router.push(`/vote/${token}`)} className="w-full">
              투표 페이지로 이동
            </Button>
            <Button onClick={() => router.push("/")} variant="outline" className="w-full">
              새 약속 만들기
            </Button>
          </div>
        </div>
      </div>

      {/* 날짜 상세 정보 모달 */}
      <Dialog open={showDateDetail} onOpenChange={setShowDateDetail}>
        <DialogContent className="sm:max-w-[500px] mx-4">
          <DialogHeader>
            <DialogTitle>날짜별 상세 투표 결과</DialogTitle>
            <DialogDescription>
              {selectedDate && format(parseISO(selectedDate), "M월 d일 (E)", { locale: ko })}의 투표 상세 정보
            </DialogDescription>
          </DialogHeader>

          {selectedDate && dateResults[selectedDate] && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-3">가능</h4>
                  <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                    {dateResults[selectedDate].voters.map((voterName: string, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                        <span className="text-sm font-medium truncate">{voterName}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">불가능</h4>
                  <div className="text-sm text-muted-foreground break-words">
                    {voters
                      .filter((voter) => !dateResults[selectedDate].voters.includes(voter.name))
                      .map((voter) => voter.name)
                      .join(", ") || "없음"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
