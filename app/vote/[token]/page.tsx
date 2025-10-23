"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, Clock, Users, Repeat, Timer, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { VoteRecurring } from "./components/VoteRecurring"
import { VoteDateBased } from "./components/VoteDateBased"
import { VoteTimeScheduling } from "./components/VoteTimeScheduling"

interface DateTimeSelection {
  date: string
  times: number[]
}

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

  // 첫 투표인지 확인 (기존 투표자 목록에서 이름 검색)
  const isFirstVote = (voterName: string) => {
    return !voters.some((voter) => voter.name === voterName)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setNameError(false)
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
  const handleSubmit = async (
    e: React.FormEvent,
    data: Date[] | number[] | DateTimeSelection[]
  ) => {
    e.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setSubmitting(true)

    try {
      // 1단계: 현재 투표자가 첫 투표인지 수정 투표인지 확인
      const isNewVoter = isFirstVote(name.trim())

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
      const voter = await createVoter(appointment.id, name.trim())

      // 기존 투표자인 경우 기존 ID 사용
      const existingVoter = voters.find((v) => v.name === name.trim())
      const actualVoterId = existingVoter ? existingVoter.id : voter.id

      if (!voter) {
        throw new Error("투표자 생성 실패")
      }

      // 5단계: 투표 방법에 따라 투표 데이터 생성
      if (appointment.method === "recurring") {
        // 반복 일정 투표
        const selectedWeekdays = data as number[]
        if (isNewVoter) {
          await createWeekdayVotes(actualVoterId, appointment.id, selectedWeekdays)
        } else {
          await updateWeekdayVotes(actualVoterId, appointment.id, selectedWeekdays)
        }
      } else if (appointment.method === "time-scheduling") {
        // 시간 스케줄링 투표
        const selectedDateTimes = data as DateTimeSelection[]
        if (isNewVoter) {
          await createTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        } else {
          await updateTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        }
      } else {
        // 일반 날짜 투표
        const selectedDates = data as Date[]
        const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
        if (isNewVoter) {
          await createDateVotes(actualVoterId, appointment.id, dateStrings)
        } else {
          await updateDateVotes(actualVoterId, appointment.id, dateStrings)
        }
      }

      //투표후 다시 투표 완료 상태 확인
      const isVotingComplete_after = await checkVotingCompletion(appointment.id)

      // 6단계 투표 완료시 알림 큐에 추가
      if (isVotingComplete_after.isComplete) {
        await addNotificationToQueue(appointment.id, appointment.creator_phone)
      }

      // 7단계: 투표 완료 시  알림톡 전송
      if (isVotingComplete_after.isComplete) {
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
    } finally {
      setSubmitting(false)
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

  // 공통 헤더 컴포넌트
  const VoteHeader = () => (
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
        {appointment.method === "recurring" ? (
          <>
            참석 가능한 요일을 모두 선택해주세요.
            <br />
            <span className="text-sm text-primary mt-1 block">
              일주일에 {appointment.weekly_meetings}번 만날 예정입니다.
            </span>
          </>
        ) : appointment.method === "time-scheduling" ? (
          <>
            가능한 날짜와 시간을 모두 선택해주세요.
            <br />
            <span className="text-sm text-muted-foreground mt-1">
              {format(parseISO(appointment.start_date), "M월 d일", { locale: ko })} ~{" "}
              {format(parseISO(appointment.end_date), "M월 d일", { locale: ko })} 사이에서 선택
            </span>
            <span className="text-sm text-primary block mt-1">날짜를 클릭하여 시간을 선택하세요</span>
          </>
        ) : (
          <>
            가능한 날짜를 모두 선택해주세요.
            <br />
            <span className="text-sm text-muted-foreground mt-1">
              {format(parseISO(appointment.start_date), "M월 d일", { locale: ko })} ~{" "}
              {format(parseISO(appointment.end_date), "M월 d일", { locale: ko })} 사이에서 선택
            </span>
          </>
        )}
      </CardDescription>
    </CardHeader>
  )

  // 투표 완료 모달
  const VotingCompleteModal = () => (
    <Dialog open={showVotingCompleteModal} onOpenChange={setShowVotingCompleteModal}>
      <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">투표가 완료된 약속입니다!</DialogTitle>
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
            <Button variant="outline" onClick={() => setShowVotingCompleteModal(false)} className="flex-1">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  // 방식별 컴포넌트 렌더링
  const renderVoteComponent = () => {
    switch (appointment.method) {
      case "recurring":
        return (
          <VoteRecurring
            appointment={appointment}
            name={name}
            nameError={nameError}
            submitting={submitting}
            onNameChange={handleNameChange}
            onSubmit={handleSubmit}
          />
        )
      case "time-scheduling":
        return (
          <VoteTimeScheduling
            appointment={appointment}
            name={name}
            nameError={nameError}
            submitting={submitting}
            onNameChange={handleNameChange}
            onSubmit={handleSubmit}
          />
        )
      default:
        return (
          <VoteDateBased
            appointment={appointment}
            name={name}
            nameError={nameError}
            submitting={submitting}
            onNameChange={handleNameChange}
            onSubmit={handleSubmit}
          />
        )
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <VoteHeader />
        <CardContent>{renderVoteComponent()}</CardContent>
      </Card>

      <VotingCompleteModal />
    </div>
  )
}
