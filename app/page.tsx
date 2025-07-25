"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, Repeat, Timer, TrendingUp, Sunrise, DollarSign, Phone, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/date-range-picker"
import { useRouter } from "next/navigation"
import { addDays, format } from "date-fns"
import { createAppointment } from "@/lib/database"
import { toast } from "sonner"
import { ShareModal } from "@/components/share-modal"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Footer } from "@/components/footer"

export default function AppointmentScheduler() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)  // 약속 생성 모달
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState(false)
  const [appointmentName, setAppointmentName] = useState("")
  const [participantCount, setParticipantCount] = useState<string>("5")
  const [creatorPhone, setCreatorPhone] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
  const [weeklyMeetings, setWeeklyMeetings] = useState<string>("1")
  const [deadline, setDeadline] = useState<string>("")
  const [isCreating, setIsCreating] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)  // 약속 공유 모달
  const [isClient, setIsClient] = useState(false)

  // 클라이언트 사이드에서만 날짜 초기화
  useEffect(() => {
    setIsClient(true)
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 14),
    })
  }, [])

  // 준비중인 기능들
  const comingSoonMethods = ["time-scheduling", "priority-voting", "time-period", "budget-consideration"]

  const methods = [
    {
      id: "all-available",
      title: "모두",
      description: "모두가 가능한 날짜를 찾습니다.",
      icon: <Calendar className="h-8 w-8 mb-2 text-primary" />,
      category: "기본",
    },
    {
      id: "max-available",
      title: "최대",
      description: "가장 많은 사람이 가능한 날짜를 제안합니다.",
      icon: <Users className="h-8 w-8 mb-2 text-primary" />,
      category: "기본",
    },
    {
      id: "minimum-required",
      title: "기준",
      description: "입력한 인원 이상이 가능한 날짜를 찾습니다.",
      icon: <Clock className="h-8 w-8 mb-2 text-primary" />,
      category: "기본",
    },
    {
      id: "recurring",
      title: "반복 요일",
      description: "매주 반복해서 만날 요일을 정합니다.",
      icon: <Repeat className="h-8 w-8 mb-2 text-primary" />,
      category: "기본",
    },
    {
      id: "time-scheduling",
      title: "약속 시간정하기",
      description: "날짜와 시간을 함께 선택하여 약속을 정합니다.",
      icon: <Timer className="h-8 w-8 mb-2 text-primary" />,
      category: "기본",
      comingSoon: true,
    },
    // 새로운 약속 종류들
    {
      id: "priority-voting",
      title: "우선순위 투표",
      description: "1순위, 2순위, 3순위로 선호도를 투표합니다.",
      icon: <TrendingUp className="h-8 w-8 mb-2 text-green-600" />,
      category: "고급",
      isNew: true,
      comingSoon: true,
    },
    {
      id: "time-period",
      title: "시간대별 투표",
      description: "오전/오후/저녁 등 시간대로 투표합니다.",
      icon: <Sunrise className="h-8 w-8 mb-2 text-orange-600" />,
      category: "고급",
      isNew: true,
      comingSoon: true,
    },
    {
      id: "budget-consideration",
      title: "예산 고려 투표",
      description: "날짜와 예산 범위를 함께 고려합니다.",
      icon: <DollarSign className="h-8 w-8 mb-2 text-purple-600" />,
      category: "고급",
      isNew: true,
      comingSoon: true,
    },
  ]

  // 메서드 선택시 모달 열기
  const handleMethodSelect = (methodId: string) => {

    // 준비중 모달 열기
    if (comingSoonMethods.includes(methodId)) {
      setIsComingSoonModalOpen(true)
      return
    }

    // 모달 열기
    setSelectedMethod(methodId)
    setIsModalOpen(true)
  }


  const handleCreateAppointment = async () => {
    if (!selectedMethod || !appointmentName || !participantCount || !creatorPhone) {
      toast.error("입력 정보를 확인해주세요", { description: "모든 필수 정보를 입력해주세요." })
      return
    }

    setIsCreating(true)

    try {
      const isRecurring = selectedMethod === "recurring"

      console.log("약속 생성 시작:", {
        title: appointmentName.trim(),
        method: selectedMethod,
        isRecurring,
        creatorPhone: creatorPhone.trim(),
      })

      const appointmentData = {
        title: appointmentName.trim(),
        method: selectedMethod as any,
        required_participants: Number.parseInt(participantCount) || 1,
        weekly_meetings: isRecurring ? Number.parseInt(weeklyMeetings) || 1 : 1,
        start_date: isRecurring || !dateRange ? null : format(dateRange.from, "yyyy-MM-dd"),
        end_date: isRecurring || !dateRange ? null : format(dateRange.to, "yyyy-MM-dd"),
        deadline: deadline ? format(new Date(deadline), "yyyy-MM-dd HH:mm:ss") : null,
        is_public: true,
        status: "active" as const,
        creator_phone: creatorPhone.trim() || undefined,
      }

      console.log("약속 데이터:", appointmentData)

      const appointment = await createAppointment(appointmentData)

      console.log("약속 생성 완료:", appointment)

      toast.success("🎉 약속이 생성되었습니다!", {
        description: "모든 인원이 투표 완료 시 카카오 알림톡을 보내드립니다.",
      })

      // 생성된 약속 정보 저장 및 공유 모달 열기
      setCreatedAppointment(appointment)
      setIsModalOpen(false)
      setIsShareModalOpen(true)
    } catch (error: any) {
      console.error("약속 생성 실패:", error)

      let errorMessage = "약속 생성에 실패했습니다."

      if (error.message.includes("연결")) {
        errorMessage = "데이터베이스 연결에 문제가 있습니다. 잠시 후 다시 시도해주세요."
      } else if (error.message.includes("생성")) {
        errorMessage = error.message
      }

      toast.error("❌ 오류가 발생했습니다", { description: errorMessage })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDateRangeChange = (newRange: { from: Date; to: Date }) => {
    setDateRange(newRange)
  }

  const isRecurring = selectedMethod === "recurring"
  const isNewMethod = ["priority-voting", "time-period", "budget-consideration"].includes(selectedMethod || "")

  // 카테고리별로 그룹화
  const basicMethods = methods.filter((m) => m.category === "기본")
  const advancedMethods = methods.filter((m) => m.category === "고급")

  // 클라이언트 사이드에서만 렌더링
  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-2 md:text-4xl">만날래말래</h1>
          <p className="text-muted-foreground text-lg mobile-break">
            여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.
          </p>
        </div>
        <div className="flex justify-center">
          <div className="animate-pulse">로딩 중...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2 md:text-4xl">만날래말래</h1>
        <p className="text-muted-foreground text-lg mobile-break">
          여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.
        </p>
      </div>

      {/* 기본 방식들 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          기본 방식
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {basicMethods.map((method) => (
            <Card
              key={method.id}
              className={`transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer relative ${method.comingSoon ? "opacity-60" : ""
                }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              {method.comingSoon && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <Lock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center">{method.icon}</div>
                <CardTitle className="text-xl">{method.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">{method.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 고급 방식들 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          고급 방식
          <span className="text-sm bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full">
            NEW
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {advancedMethods.map((method) => (
            <Card
              key={method.id}
              className={`transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer relative overflow-hidden ${method.comingSoon ? "opacity-60" : ""
                }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              {method.comingSoon && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <Lock className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}
              {method.isNew && !method.comingSoon && (
                <div className="absolute top-2 right-2 bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  NEW
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center">{method.icon}</div>
                <CardTitle className="text-xl">{method.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">{method.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 준비중 모달 */}
      <Dialog open={isComingSoonModalOpen} onOpenChange={setIsComingSoonModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-blue-100 rounded-full p-4">
                <Lock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-center">준비중입니다</DialogTitle>
            <DialogDescription className="text-center">
              해당 기능은 현재 개발 중입니다.
              <br />곧 만나보실 수 있어요! 🚀
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <Button className="w-full" onClick={() => setIsComingSoonModalOpen(false)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 약속 생성 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              {selectedMethod && methods.find((m) => m.id === selectedMethod)?.title}
              {isNewMethod && (
                <span className="text-sm bg-gradient-to-r from-green-500 to-blue-500 text-white px-2 py-1 rounded-full">
                  NEW
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              {isNewMethod ? "새로운 방식의 약속을 만들어보세요!" : "약속 세부 정보를 입력해주세요."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appointment-name" className="text-sm font-medium">
                약속 이름
              </Label>
              <Input
                id="appointment-name"
                placeholder="예: 팀 프로젝트 미팅"
                className="w-full"
                value={appointmentName}
                onChange={(e) => setAppointmentName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-count" className="text-sm font-medium">
                {selectedMethod === "minimum-required" ? "기준 인원 수" : "참여 인원 수"}
              </Label>
              <Input
                id="participant-count"
                type="number"
                min="2"
                placeholder="예: 5"
                className="w-full"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator-phone" className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                연락처
              </Label>
              <Input
                id="creator-phone"
                type="tel"
                placeholder="예: 010-1234-5678"
                className="w-full"
                value={creatorPhone}
                onChange={(e) => setCreatorPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                모든 인원이 투표 완료 시 카카오 알림톡으로 알림을 보내드립니다.
              </p>
            </div>

            {isRecurring ? (
              <div className="space-y-2">
                <Label htmlFor="weekly-meetings" className="text-sm font-medium">
                  일주일에 만날 횟수
                </Label>
                <Input
                  id="weekly-meetings"
                  type="number"
                  min="1"
                  max="7"
                  placeholder="예: 2"
                  className="w-full"
                  value={weeklyMeetings}
                  onChange={(e) => setWeeklyMeetings(e.target.value)}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">투표 가능한 날짜 범위</Label>
                <div className="flex items-center justify-center">
                  {dateRange && (
                    <DateRangePicker value={dateRange} onChange={handleDateRangeChange} className="w-full" />
                  )}
                </div>
              </div>
            )}

            {/* 새로운 방식들에 대한 추가 설정 */}
            {/* {isNewMethod && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-green-800">🚀 새로운 기능</span>
                </div>
                <p className="text-sm text-green-700">
                  {selectedMethod === "priority-voting" &&
                    "참여자들이 1순위, 2순위, 3순위로 선호도를 표시할 수 있어요."}
                  {selectedMethod === "time-period" && "오전/오후/저녁 등 큰 시간대로 나누어 투표할 수 있어요."}
                  {selectedMethod === "budget-consideration" && "날짜와 함께 예산 범위도 고려하여 투표할 수 있어요."}
                </p>
              </div>
            )} */}

            {/* 마감 시간 설정 (선택사항) */}
            {/* <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">
                투표 마감 시간 (선택사항)
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                className="w-full"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">설정하지 않으면 마감 시간이 없습니다.</p>
            </div> */}

            <div className="pt-4">
              <Button
                className="w-full py-6 text-base font-medium"
                size="lg"
                onClick={handleCreateAppointment}
                disabled={
                  isCreating ||
                  !appointmentName ||
                  !participantCount ||
                  (isRecurring ? !weeklyMeetings : !dateRange?.from || !dateRange?.to)
                }
              >
                {isCreating ? "생성 중..." : "만들기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {createdAppointment && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          appointmentData={createdAppointment}
        />
      )}
      <Footer />
    </div>
  )
}
