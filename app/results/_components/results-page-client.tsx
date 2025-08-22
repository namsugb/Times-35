"use client"

import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { DateResults } from "./date-results"
import { TimeResults } from "./time-results"
import { WeekdayResults } from "./weekday-results"

interface ResultsPageClientProps {
    appointment: any
    voters: any[]
    results: any
    token: string
}

export function ResultsPageClient({
    appointment,
    voters,
    results,
    token
}: ResultsPageClientProps) {
    const searchParams = useSearchParams()
    const { toast } = useToast()

    // URL 파라미터에서 새로고침 여부 확인 (투표 완료 후 리다이렉트)
    useEffect(() => {
        const refresh = searchParams.get("refresh")
        if (refresh) {
            toast({
                title: "투표가 완료되었습니다! 🎉",
                description: "아래에서 결과를 확인해보세요.",
            })
        }
    }, [searchParams, toast])

    // 투표 방법에 따라 적절한 결과 컴포넌트 렌더링
    if (appointment.method === "recurring") {
        return (
            <WeekdayResults
                appointment={appointment}
                voters={voters}
                results={results}
                token={token}
            />
        )
    }

    if (appointment.method === "time-scheduling") {
        return (
            <TimeResults
                appointment={appointment}
                voters={voters}
                results={results}
                token={token}
            />
        )
    }

    // 기본 날짜 투표 결과
    return (
        <DateResults
            appointment={appointment}
            voters={voters}
            results={results}
            token={token}
        />
    )
}
