"use client"

import { format, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface DateDetailModalProps {
    isOpen: boolean
    onClose: () => void
    date: string | null
    result: any
}

export function DateDetailModal({ isOpen, onClose, date, result }: DateDetailModalProps) {
    if (!date || !result) return null

    const getStatusColor = (status: string) => {
        switch (status) {
            case "perfect":
                return "bg-green-500"
            case "good":
                return "bg-blue-500"
            case "possible":
                return "bg-yellow-500"
            default:
                return "bg-gray-300"
        }
    }

    const getStatusText = (status: string) => {
        switch (status) {
            case "perfect":
                return "완벽한 날짜"
            case "good":
                return "좋은 날짜"
            case "possible":
                return "가능한 날짜"
            default:
                return "불가능한 날짜"
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="w-[90vw] max-w-[400px] mx-auto">
                <DialogHeader>
                    <DialogTitle className="text-center">
                        {format(parseISO(date), "M월 d일 (eee)", { locale: ko })}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        이 날짜에 참석 가능한 사람들을 확인해보세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="text-center mb-4">
                        <Badge
                            className={`${getStatusColor(result.status)} text-white border-none text-lg px-4 py-2`}
                        >
                            총 {result.count}명 참석 가능
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-2">
                            {getStatusText(result.status)}
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
