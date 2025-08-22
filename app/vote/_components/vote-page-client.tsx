"use client"

import { VotingCompletionResult } from "@/lib/vote/checkcomplete"
import { RecurringVoteForm } from "./recurring-vote-form"
import { DateVoteForm } from "./date-vote-form"

interface VotePageClientProps {
    appointment: any
    voters: any[]
    token: string
    isVotingComplete: VotingCompletionResult
}

export function VotePageClient({
    appointment,
    voters,
    token,
    isVotingComplete
}: VotePageClientProps) {

    // 반복 일정 투표
    if (appointment.method === "recurring") {
        return (
            <RecurringVoteForm
                appointment={appointment}
                voters={voters}
                token={token}
                isVotingComplete={isVotingComplete}
            />
        )
    }

    // 일반 날짜/시간 투표
    return (
        <DateVoteForm
            appointment={appointment}
            voters={voters}
            token={token}
            isVotingComplete={isVotingComplete}
        />
    )
}
