"use client"

import { useState, useEffect, ReactNode } from "react"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DateRangePicker } from "@/components/date-range-picker"
import { useRouter } from "next/navigation"
import { addDays, format } from "date-fns"
import { toast } from "sonner"
import { ShareModal } from "@/components/share-modal"

interface Method {
    id: string
    title: string
    description: string
    icon: ReactNode
    category: string
    comingSoon?: boolean
    isNew?: boolean
}

interface AppointmentCreationModalProps {
    isOpen: boolean
    onClose: () => void
    selectedMethod: string | null
    methods: Method[]
}

export function AppointmentCreationModal({
    isOpen,
    onClose,
    selectedMethod,
    methods
}: AppointmentCreationModalProps) {
    const router = useRouter()
    const [appointmentName, setAppointmentName] = useState("")
    const [participantCount, setParticipantCount] = useState<string>("5")
    const [creatorPhone, setCreatorPhone] = useState("")
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
    const [weeklyMeetings, setWeeklyMeetings] = useState<string>("1")
    const [deadline, setDeadline] = useState<string>("")
    const [isCreating, setIsCreating] = useState(false)
    const [createdAppointment, setCreatedAppointment] = useState<any>(null)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)

    // 클라이언트 사이드에서만 날짜 초기화
    useEffect(() => {
        setDateRange({
            from: new Date(),
            to: addDays(new Date(), 14),
        })
    }, [])

    // 모달이 닫힐 때 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            setAppointmentName("")
            setParticipantCount("5")
            setCreatorPhone("")
            setWeeklyMeetings("1")
            setDeadline("")
            setIsCreating(false)
        }
    }, [isOpen])

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

            // API 라우트로 약속 생성 요청
            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(appointmentData),
            })

            if (!response.ok) {
                let errorMessage = "약속 생성에 실패했습니다"
                try {
                    const errorData = await response.json()
                    errorMessage = errorData.message || errorMessage
                    console.error("API 에러 응답:", errorData)
                } catch (parseError) {
                    // JSON 파싱 실패시 응답 텍스트 확인
                    const errorText = await response.text()
                    console.error("API 에러 텍스트:", errorText)
                    errorMessage = `서버 오류 (${response.status}): ${errorText.slice(0, 100)}...`
                }
                throw new Error(errorMessage)
            }

            const appointment = await response.json()
            console.log("약속 생성 완료:", appointment)

            // 생성된 약속 정보 저장 및 공유 모달 열기
            setCreatedAppointment(appointment)
            onClose() // 생성 모달 닫기
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

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-[400px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3 px-6">
                        <DialogTitle className="text-xl font-semibold flex justify-center items-center gap-2">
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
                                <Phone className="h-4 w-4" />
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
        </>
    )
}
