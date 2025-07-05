"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import {
  Calendar,
  Clock,
  Users,
  Repeat,
  Timer,
  AlertCircle,
  Share2,
  Crown,
  TrendingUp,
  CheckCircle,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import {
  getAppointmentByToken,
  getDateVoteResults,
  getTimeVoteResults,
  getWeekdayVoteResults,
  getVoters,
  getAppointmentStatistics,
  getMaxAvailableDates,
  getOptimalTimeSlots,
  getWeekdayAvailability,
} from "@/lib/database"
import { ShareModal } from "@/components/share-modal"

const weekdays = [
  { id: 0, name: "일요일", short: "일" },
  { id: 1, name: "월요일", short: "월" },
  { id: 2, name: "화요일", short: "화" },
  { id: 3, name: "수요일", short: "수" },
  { id: 4, name: "목요일", short: "목" },
  { id: 5, name: "금요일", short: "금" },
  { id: 6, name: "토요일", short: "토" },
]

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const token = params.token as string

  const [appointment, setAppointment] = useState<any>(null)
  const [voters, setVoters] = useState<any[]>([])
  const [dateResults, setDateResults] = useState<any>({})
  const [timeResults, setTimeResults] = useState<any[]>([])
  const [weekdayResults, setWeekdayResults] = useState<any>({})
  const [statistics, setStatistics] = useState<any>(null)
  const [maxAvailableDates, setMaxAvailableDates] = useState<any[]>([])
  const [optimalTimeSlots, setOptimalTimeSlots] = useState<any[]>([])
  const [weekdayAvailability, setWeekdayAvailability] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareModalOpen, setShareModalOpen] = useState(false)

  useEffect(() => {
    if (token) {
      loadResults()
    }
  }, [token])

  const loadResults = async () => {
    try {
      setLoading(true)
      console.log("약속 데이터 로딩 시작:", token)

      const appointmentData = await getAppointmentByToken(token)
      if (!appointmentData) {
        setError("약속을 찾을 수 없습니다.")
        return
      }
      console.log("약속 데이터:", appointmentData)
      setAppointment(appointmentData)

      const votersData = await getVoters(appointmentData.id)
      console.log("투표자 데이터:", votersData)
      setVoters(votersData)

      // 방식별 결과 로드
      if (appointmentData.method === "recurring") {
        const weekdayData = await getWeekdayVoteResults(appointmentData.id)
        setWeekdayResults(weekdayData)

        const weekdayAvailData = await getWeekdayAvailability(appointmentData.id)
        setWeekdayAvailability(weekdayAvailData)
      } else if (appointmentData.method === "time-scheduling") {
        const timeData = await getTimeVoteResults(appointmentData.id)
        setTimeResults(timeData)

        const optimalSlots = await getOptimalTimeSlots(appointmentData.id)
        setOptimalTimeSlots(optimalSlots)
      } else {
        const dateData = await getDateVoteResults(appointmentData.id)
        console.log("날짜 투표 결과:", dateData)
        setDateResults(dateData)

        const stats = await getAppointmentStatistics(appointmentData.id)
        setStatistics(stats)

        const maxDates = await getMaxAvailableDates(appointmentData.id)
        setMaxAvailableDates(maxDates)
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

  const handleShare = () => {
    setShareModalOpen(true)
  }

  const handleVoteAgain = () => {
    router.push(`/vote/${token}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">결과를 불러오는 중...</p>
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

  // 방식별 최적 결과 계산
  const getOptimalResults = () => {
    if (appointment.method === "all-available") {
      // 모두 가능한 날: 전원 참여 가능한 날만
      const totalVoters = voters.length
      if (totalVoters === 0) return []

      return Object.entries(dateResults)
        .filter(([_, data]: [string, any]) => data.count === totalVoters)
        .map(([date, data]: [string, any]) => ({
          date,
          count: data.count,
          voters: data.voters,
          isOptimal: true,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (appointment.method === "max-available") {
      // 최대 다수 가능: 가장 많은 사람이 가능한 날만
      const maxCount = Math.max(...Object.values(dateResults).map((data: any) => data.count))
      if (maxCount === 0) return []

      return Object.entries(dateResults)
        .filter(([_, data]: [string, any]) => data.count === maxCount)
        .map(([date, data]: [string, any]) => ({
          date,
          count: data.count,
          voters: data.voters,
          isOptimal: true,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    } else if (appointment.method === "minimum-required") {
      // 기준 인원 이상 가능: 기준 인원 이상 가능한 날만
      const requiredCount = appointment.required_participants || 1

      return Object.entries(dateResults)
        .filter(([_, data]: [string, any]) => data.count >= requiredCount)
        .map(([date, data]: [string, any]) => ({
          date,
          count: data.count,
          voters: data.voters,
          isOptimal: data.count >= requiredCount,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    return []
  }

  const optimalResults = getOptimalResults()

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      {/* 헤더 */}
      <Card className="mb-6">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getMethodIcon(appointment.method)}
            <CardTitle className="text-xl sm:text-2xl">{appointment.title}</CardTitle>
          </div>
          <CardDescription>
            <Badge variant="secondary" className="mb-2">
              {getMethodName(appointment.method)}
            </Badge>
            <br />총 {voters.length}명이 참여했습니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button onClick={handleVoteAgain} variant="outline" className="flex-1 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              다시 투표하기
            </Button>
            <Button onClick={handleShare} className="flex-1">
              <Share2 className="h-4 w-4 mr-2" />
              공유하기
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 투표 결과 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            투표 결과
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* 반복 일정 결과 */}
          {appointment.method === "recurring" && (
            <div className="space-y-4">
              {weekdayAvailability.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">추천 요일</h4>
                  {weekdayAvailability
                    .sort((a, b) => b.participant_count - a.participant_count)
                    .slice(0, 3)
                    .map((item, index) => {
                      const weekday = weekdays.find((w) => w.id === item.weekday)
                      return (
                        <div
                          key={item.weekday}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            index === 0 ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {index === 0 && <Crown className="h-4 w-4 text-primary" />}
                            <span className="font-medium">{weekday?.name}</span>
                          </div>
                          <Badge variant={index === 0 ? "default" : "secondary"}>{item.participant_count}명</Badge>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">아직 투표 결과가 없습니다.</p>
              )}
            </div>
          )}

          {/* 시간 스케줄링 결과 */}
          {appointment.method === "time-scheduling" && (
            <div className="space-y-4">
              {optimalTimeSlots.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">최적 시간</h4>
                  {optimalTimeSlots.slice(0, 5).map((slot, index) => (
                    <div
                      key={`${slot.vote_date}-${slot.vote_hour}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {index === 0 && <Crown className="h-4 w-4 text-primary" />}
                        <div>
                          <div className="font-medium">
                            {format(parseISO(slot.vote_date), "M월 d일 (eee)", { locale: ko })}
                          </div>
                          <div className="text-sm text-muted-foreground">{slot.vote_hour}시</div>
                        </div>
                      </div>
                      <Badge variant={index === 0 ? "default" : "secondary"}>{slot.participant_count}명</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">아직 투표 결과가 없습니다.</p>
              )}
            </div>
          )}

          {/* 날짜 기반 결과 (모두 가능한 날, 최대 다수 가능, 기준 인원 이상) */}
          {["all-available", "max-available", "minimum-required"].includes(appointment.method) && (
            <div className="space-y-4">
              {optimalResults.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {appointment.method === "all-available" && "모두 가능한 날"}
                    {appointment.method === "max-available" && "최대 다수 가능한 날"}
                    {appointment.method === "minimum-required" && "기준 인원 이상 가능한 날"}
                  </h4>
                  {optimalResults.map((result, index) => (
                    <div
                      key={result.date}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        index === 0 ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {appointment.method === "all-available" && <Crown className="h-4 w-4 text-primary" />}
                        {appointment.method === "max-available" && index === 0 && (
                          <Crown className="h-4 w-4 text-primary" />
                        )}
                        {appointment.method === "minimum-required" &&
                          result.count >= (appointment.required_participants || 1) && (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          )}
                        <div>
                          <div className="font-medium">
                            {format(parseISO(result.date), "M월 d일 (eee)", { locale: ko })}
                          </div>
                          <div className="text-xs text-muted-foreground">{result.voters.join(", ")}</div>
                        </div>
                      </div>
                      <Badge variant={index === 0 || result.isOptimal ? "default" : "secondary"}>
                        {result.count}명
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {appointment.method === "all-available" && "모두 가능한 날이 없습니다."}
                  {appointment.method === "max-available" && "아직 투표 결과가 없습니다."}
                  {appointment.method === "minimum-required" &&
                    `기준 인원(${appointment.required_participants}명) 이상 가능한 날이 없습니다.`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 참여자 목록 */}
      {voters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">참여자 ({voters.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {voters.map((voter) => (
                <Badge key={voter.id} variant="secondary">
                  {voter.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 공유 모달 */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        shareUrl={`${window.location.origin}/vote/${token}`}
        title={appointment.title}
      />
    </div>
  )
}
