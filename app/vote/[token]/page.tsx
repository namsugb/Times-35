import { notFound } from "next/navigation"
import { getAppointmentByToken, getVoters } from "@/lib/database"
import { checkVotingCompletion } from "@/lib/vote/checkcomplete"
import { VotePageClient } from "../_components/vote-page-client"

interface VotePageProps {
    params: {
        token: string
    }
}

export default async function VotePage({ params }: VotePageProps) {
    const { token } = params

    try {
        // 1. 먼저 appointment 확인
        const appointment = await getAppointmentByToken(token)

        if (!appointment) {
            notFound()
        }

        // 2. appointment가 존재하면 병렬로 관련 데이터 페치
        const [voters, isVotingComplete] = await Promise.all([
            getVoters(appointment.id),
            checkVotingCompletion(appointment.id)
        ])

        return (
            <VotePageClient
                appointment={appointment}
                voters={voters}
                token={token}
                isVotingComplete={isVotingComplete}
            />
        )
    } catch (error) {
        console.error("데이터 로딩 오류:", error)
        // error.tsx로 에러 처리 위임하거나 직접 에러 페이지 표시
        throw error
    }
}
