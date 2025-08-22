"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Calendar, Clock, Users, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CustomCalendar } from "@/components/ui/custom-calendar"
import { useToast } from "@/hooks/use-toast"
import { submitVote, VoteFormData } from "../_actions/vote-actions"
import { VotingCompletionResult } from "@/lib/vote/checkcomplete"
import { VotingCompleteModal } from "./voting-complete-modal"
import { TimeSelectionModal } from "./time-selection-modal"

interface DateTimeSelection {
    date: string
    times: number[]
}

interface DateVoteFormProps {
    appointment: any
    voters: any[]
    token: string
    isVotingComplete: VotingCompletionResult | null
}

export function DateVoteForm({
    appointment,
    voters,
    token,
    isVotingComplete
}: DateVoteFormProps) {
    const router = useRouter()
    const { toast } = useToast()

    const [name, setName] = useState("")
    const [nameError, setNameError] = useState(false)
    const [selectedDates, setSelectedDates] = useState<Date[]>([])
    const [selectedDateTimes, setSelectedDateTimes] = useState<DateTimeSelection[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [showVotingCompleteModal, setShowVotingCompleteModal] = useState(false)
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false)
    const [currentSelectedDate, setCurrentSelectedDate] = useState<Date | null>(null)
    const [tempSelectedTimes, setTempSelectedTimes] = useState<number[]>([])

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

    // 날짜 선택 핸들러
    const handleDateSelect = (dates: Date[] | undefined) => {
        setSelectedDates(dates ?? [])
    }

    // 날짜 클릭 핸들러 
    const handleDateClick = (date: Date) => {
        if (appointment?.method !== "time-scheduling") return

        const isAlreadySelected = selectedDates.some(
            (d) => format(d, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        )

        if (isAlreadySelected) {
            return
        }

        const dateStr = format(date, "yyyy-MM-dd")
        const existingSelection = selectedDateTimes.find((dt) => dt.date === dateStr)

        setCurrentSelectedDate(date)
        setTempSelectedTimes(existingSelection?.times || [])
        setIsTimeModalOpen(true)
    }

    // 시간 선택 확인
    const handleTimeConfirm = (selectedTimes: number[]) => {
        if (!currentSelectedDate) return

        const dateStr = format(currentSelectedDate, "yyyy-MM-dd")

        setSelectedDateTimes((prev) => {
            const filtered = prev.filter((dt) => dt.date !== dateStr)
            if (selectedTimes.length > 0) {
                return [...filtered, { date: dateStr, times: selectedTimes }]
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

    // 첫 투표인지 확인
    const isFirstVote = (voterName: string) => {
        return !voters.some(voter => voter.name === voterName)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            setNameError(true)
            return
        }

        setSubmitting(true)

        try {
            // 투표 완료 상태에서 새 투표자 차단 (클라이언트 사이드 빠른 피드백)
            const isNewVoter = isFirstVote(name.trim())
            if (isVotingComplete?.isComplete && appointment.method !== "minimum-required" && isNewVoter) {
                setShowVotingCompleteModal(true)
                setSubmitting(false)
                return
            }

            // Server Action으로 투표 제출
            const formData: VoteFormData = {
                appointmentId: appointment.id,
                appointmentToken: token,
                voterName: name.trim(),
                method: appointment.method,
                creatorPhone: appointment.creator_phone,
                appointmentTitle: appointment.title,
                selectedDates: appointment.method !== "time-scheduling" ? selectedDates : undefined,
                selectedDateTimes: appointment.method === "time-scheduling" ? selectedDateTimes : undefined,
            }

            const result = await submitVote(formData)

            if (!result.success) {
                toast({
                    title: "투표 실패",
                    description: result.error || "투표 제출에 실패했습니다.",
                    variant: "destructive",
                })
                return
            }

            // 성공시 결과 페이지로 이동
            if (result.redirectUrl) {
                router.push(result.redirectUrl)
            }
        } catch (err: any) {
            console.error("투표 제출 오류:", err)
            toast({
                title: "투표 실패",
                description: "투표 제출에 실패했습니다.",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

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
                                                <Badge variant="outline">
                                                    {dt.times.length === 1
                                                        ? `${dt.times[0]}시`
                                                        : `${dt.times[0]}시~${dt.times[dt.times.length - 1]}시 외 ${dt.times.length}개`
                                                    }
                                                </Badge>
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

            <TimeSelectionModal
                isOpen={isTimeModalOpen}
                onClose={() => setIsTimeModalOpen(false)}
                onConfirm={handleTimeConfirm}
                currentDate={currentSelectedDate}
                initialSelectedTimes={tempSelectedTimes}
            />

            <VotingCompleteModal
                isOpen={showVotingCompleteModal}
                onClose={() => setShowVotingCompleteModal(false)}
                onViewResults={() => router.push(`/results/${token}`)}
            />
        </div>
    )
}
