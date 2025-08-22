import { notFound } from "next/navigation"
import {
    getAppointmentByToken,
    getDateVoteResults,
    getTimeVoteResults,
    getWeekdayVoteResults,
    getVoters,
} from "@/lib/database"
import { ResultsPageClient } from "../_components/results-page-client"

interface ResultsPageProps {
    params: {
        token: string
    }
}

export default async function ResultsPage({ params }: ResultsPageProps) {
    const { token } = params

    try {
        // 1. 먼저 appointment 확인
        const appointment = await getAppointmentByToken(token)

        if (!appointment) {
            notFound()
        }

        // 2. appointment 타입에 따라 필요한 데이터 병렬로 페치
        const [voters, results] = await Promise.all([
            getVoters(appointment.id),
            // 투표 방법에 따라 적절한 결과 데이터 가져오기
            appointment.method === "recurring"
                ? getWeekdayVoteResults(appointment.id)
                : appointment.method === "time-scheduling"
                    ? getTimeVoteResults(appointment.id)
                    : getDateVoteResults(appointment.id)
        ])

        return (
            <ResultsPageClient
                appointment={appointment}
                voters={voters}
                results={results}
                token={token}
            />
        )
    } catch (error) {
        console.error("결과 데이터 로딩 오류:", error)
        throw error
    }
}
