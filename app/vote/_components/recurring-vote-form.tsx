"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Repeat, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { submitVote, VoteFormData } from "../_actions/vote-actions"
import { VotingCompletionResult } from "@/lib/vote/checkcomplete"
import { VotingCompleteModal } from "./voting-complete-modal"

interface RecurringVoteFormProps {
    appointment: any
    voters: any[]
    token: string
    isVotingComplete: VotingCompletionResult | null
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

export function RecurringVoteForm({
    appointment,
    voters,
    token,
    isVotingComplete
}: RecurringVoteFormProps) {
    const router = useRouter()
    const { toast } = useToast()

    const [name, setName] = useState("")
    const [nameError, setNameError] = useState(false)
    const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([])
    const [submitting, setSubmitting] = useState(false)
    const [showVotingCompleteModal, setShowVotingCompleteModal] = useState(false)

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
                selectedWeekdays,
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
                        <Repeat className="h-5 w-5" />
                        <CardTitle className="text-xl sm:text-2xl">{appointment.title}</CardTitle>
                    </div>
                    <CardDescription>
                        <Badge variant="secondary" className="mb-2">
                            반복 일정 선택
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

            <VotingCompleteModal
                isOpen={showVotingCompleteModal}
                onClose={() => setShowVotingCompleteModal(false)}
                onViewResults={() => router.push(`/results/${token}`)}
            />
        </div>
    )
}
