"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAppointmentByToken, getDateVoteResults, getTimeVoteResults, getVoters } from "@/lib/database"
import { Calendar, Clock, Users, Timer, AlertCircle } from "lucide-react"
import { ResultsTimeScheduling } from "./components/ResultsTimeScheduling"
import { ResultsDateBased } from "./components/ResultsDateBased"

export default function ResultsPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [appointment, setAppointment] = useState<any>(null)
  const [dateResults, setDateResults] = useState<any>({})
  const [timeResults, setTimeResults] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [token])

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
      if (appointmentData.method === "time-scheduling") {
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
    }
    return methodNames[method] || method
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

  if (!appointment) {
    return null
  }

  // 공통 헤더 컴포넌트
  const ResultsHeader = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getMethodIcon(appointment.method)}
          <div className="flex min-w-0">
            <CardTitle className="text-xl sm:text-2xl truncate mr-3">{appointment.title}</CardTitle>
            {/* <CardDescription className="flex  sm:flex-row sm:items-center gap-2 mt-1"> */}
            <Badge variant="secondary">{getMethodName(appointment.method)}</Badge>
            {/* </CardDescription> */}
          </div>
        </div>
      </CardHeader>
    </Card>
  )

  // 방식별 컴포넌트 렌더링
  const renderResultsComponent = () => {
    switch (appointment.method) {
      case "time-scheduling":
        return (
          <ResultsTimeScheduling
            appointment={appointment}
            timeResults={timeResults}
            voters={voters}
            token={token}
          />
        )
      default:
        return (
          <ResultsDateBased
            appointment={appointment}
            dateResults={dateResults}
            voters={voters}
            token={token}
          />
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-6">
        <ResultsHeader />
        {renderResultsComponent()}
      </div>
    </div>
  )
}
