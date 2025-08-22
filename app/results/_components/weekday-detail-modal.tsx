"use client"

import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface WeekdayDetailModalProps {
    isOpen: boolean
    onClose: () => void
    weekday: number | null
    result: any
}

const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]

export function WeekdayDetailModal({ isOpen, onClose, weekday, result }: WeekdayDetailModalProps) {
    if (weekday === null || !result) return null

    const getStatusColor = (count: number, totalVoters: number = 1) => {
        const percentage = (count / totalVoters) * 100
        if (percentage >= 80) return "bg-green-500"
        if (percentage >= 60) return "bg-blue-500"
        if (percentage >= 40) return "bg-yellow-500"
        return "bg-gray-400"
    }

    const getStatusText = (count: number, totalVoters: number = 1) => {
        const percentage = (count / totalVoters) * 100
        if (percentage >= 80) return "완벽한 요일"
        if (percentage >= 60) return "좋은 요일"
        if (percentage >= 40) return "가능한 요일"
        return "어려운 요일"
    }

    // totalVoters는 실제로는 props로 받아야 하지만, 임시로 result.voters 길이 사용
    const totalVoters = result.voters ? result.voters.length : result.count

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {weekdayNames[weekday]}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        이 요일에 참석 가능한 사람들을 확인해보세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="text-center mb-4">
                        <Badge
                            className={`${getStatusColor(result.count, totalVoters)} text-white border-none text-lg px-4 py-2`}
                        >
                            총 {result.count}명 참석 가능
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                            {getStatusText(result.count, totalVoters)}
                        </p>
                    </div>

                    {result.voters && result.voters.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Users className="h-4 w-4" />
                                참석 가능한 사람들
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {result.voters.map((voter: string, index: number) => (
                                    <div
                                        key={index}
                                        className="text-sm p-2 bg-secondary rounded-md text-center"
                                    >
                                        {voter}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mt-6">
                        <Button onClick={onClose} className="w-full">
                            닫기
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
