"use client"

import { useState, useEffect } from "react"
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
import { methods } from "@/lib/type/appointmentMethods"
import { CalendarIcon } from "lucide-react"
import { LockIcon } from "lucide-react"
import { TrendingUpIcon } from "lucide-react"
import { PhoneIcon } from "lucide-react"

export default function AppointmentScheduler() {
  const router = useRouter()
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)  // 약속 생성 모달
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





  // 메서드 선택시 모달 열기
  const handleMethodSelect = (methodId: string) => {

    // 준비중 모달 열기
    if (methods.find((m) => m.id === methodId)?.comingSoon) {
      setIsComingSoonModalOpen(true)
      return
    }

    // 모달 열기
    setSelectedMethod(methodId)
    setIsCreateModalOpen(true)
  }

  const handleCreateAppointment = async () => {
    if (!selectedMethod || !appointmentName || !participantCount || !creatorPhone) {
      toast.error("입력 정보를 확인해주세요", { description: "모든 필수 정보를 입력해주세요." })
      return
    }

    setIsCreating(true)

    try {
      const isRecurring = selectedMethod === "recurring"



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



      const appointment = await createAppointment(appointmentData)




      // 생성된 약속 정보 저장 및 공유 모달 열기
      setCreatedAppointment(appointment)
      setIsCreateModalOpen(false)
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

      {/* 약속 방식 선택 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          기본 방식
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {methods.map((method) => (
            <Card
              key={method.id}
              className={`transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer relative ${method.comingSoon ? "opacity-60" : ""
                }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              {method.comingSoon && (
                <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center z-10">
                  <div className="bg-white/90 rounded-full p-3 shadow-lg">
                    <LockIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center"><method.icon className="h-8 w-8 mb-2 text-primary" /></div>
                <CardTitle className="text-xl">{method.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">{method.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* 약속 생성 모달 */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-[400px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-3 px-6">
            <DialogTitle className="text-xl font-semibold flex justify-center items-center gap-2">
              {selectedMethod && methods.find((m) => m.id === selectedMethod)?.title}
            </DialogTitle>
            <DialogDescription>
              약속 세부 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appointment-name" className="text-sm font-medium">
                약속 이름
              </Label>
              <Input
                id="appointment-name"
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
                className="w-full"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator-phone" className="text-sm font-medium flex items-center gap-2">
                <PhoneIcon className="h-4 w-4" />
                연락처
              </Label>
              <Input
                id="creator-phone"
                type="tel"
                className="w-full"
                value={creatorPhone}
                onChange={(e) => setCreatorPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                투표 완료 시 카카오 알림톡으로 알림을 보내드립니다.
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

      {/* 준비중 모달 */}
      <Dialog open={isComingSoonModalOpen} onOpenChange={setIsComingSoonModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="bg-blue-100 rounded-full p-4">
                <LockIcon className="h-8 w-8 text-blue-600" />
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


      {/* 약속 공유 모달 */}
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
