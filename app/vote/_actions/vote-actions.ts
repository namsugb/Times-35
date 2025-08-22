"use server"

import { redirect } from "next/navigation"
import { format } from "date-fns"
import {
    createVoter,
    createDateVotes,
    createTimeVotes,
    createWeekdayVotes,
    updateDateVotes,
    updateTimeVotes,
    updateWeekdayVotes,
    addNotificationToQueue,
    getVoters,
} from "@/lib/database"
import { checkVotingCompletion } from "@/lib/vote/checkcomplete"

interface DateTimeSelection {
    date: string
    times: number[]
}

export interface VoteFormData {
    appointmentId: string
    appointmentToken: string
    voterName: string
    method: string
    creatorPhone: string
    appointmentTitle: string
    selectedDates?: Date[]
    selectedDateTimes?: DateTimeSelection[]
    selectedWeekdays?: number[]
}

export interface VoteResult {
    success: boolean
    error?: string
    redirectUrl?: string
}

// 첫 투표인지 확인하는 헬퍼 함수
async function isFirstVote(appointmentId: string, voterName: string): Promise<boolean> {
    const voters = await getVoters(appointmentId)
    return !voters.some(voter => voter.name === voterName)
}

export async function submitVote(formData: VoteFormData): Promise<VoteResult> {
    try {
        const {
            appointmentId,
            appointmentToken,
            voterName,
            method,
            creatorPhone,
            appointmentTitle,
            selectedDates,
            selectedDateTimes,
            selectedWeekdays
        } = formData

        // 입력 데이터 검증
        if (!voterName.trim()) {
            return { success: false, error: "이름을 입력해주세요." }
        }

        // 1. 투표 완료 상태 확인
        const isVotingComplete = await checkVotingCompletion(appointmentId)
        const isNewVoter = await isFirstVote(appointmentId, voterName.trim())

        // 2. 투표 완료 상태에서의 처리 (기준인원 모드가 아닌 경우)
        if (isVotingComplete.isComplete && method !== "minimum-required" && isNewVoter) {
            return {
                success: false,
                error: "이미 투표가 완료된 약속입니다. 기존 투표자 이름으로만 재투표가 가능합니다."
            }
        }

        // 3. 투표자 생성/업데이트
        const voter = await createVoter(appointmentId, voterName.trim())
        if (!voter) {
            return { success: false, error: "투표자 생성에 실패했습니다." }
        }

        // 기존 투표자인 경우 기존 ID 사용
        const voters = await getVoters(appointmentId)
        const existingVoter = voters.find(v => v.name === voterName.trim())
        const actualVoterId = existingVoter ? existingVoter.id : voter.id

        // 4. 투표 방법에 따라 투표 데이터 생성/업데이트
        try {
            if (method === "recurring") {
                // 반복 일정 투표
                if (!selectedWeekdays || selectedWeekdays.length === 0) {
                    return { success: false, error: "참석 가능한 요일을 선택해주세요." }
                }

                if (isNewVoter) {
                    await createWeekdayVotes(actualVoterId, appointmentId, selectedWeekdays)
                } else {
                    await updateWeekdayVotes(actualVoterId, appointmentId, selectedWeekdays)
                }
            } else if (method === "time-scheduling") {
                // 시간 스케줄링 투표
                if (!selectedDateTimes || selectedDateTimes.length === 0) {
                    return { success: false, error: "참석 가능한 날짜와 시간을 선택해주세요." }
                }

                if (isNewVoter) {
                    await createTimeVotes(actualVoterId, appointmentId, selectedDateTimes)
                } else {
                    await updateTimeVotes(actualVoterId, appointmentId, selectedDateTimes)
                }
            } else {
                // 일반 날짜 투표
                if (!selectedDates || selectedDates.length === 0) {
                    return { success: false, error: "참석 가능한 날짜를 선택해주세요." }
                }

                const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
                if (isNewVoter) {
                    await createDateVotes(actualVoterId, appointmentId, dateStrings)
                } else {
                    await updateDateVotes(actualVoterId, appointmentId, dateStrings)
                }
            }
        } catch (voteError) {
            console.error("투표 데이터 저장 오류:", voteError)
            return { success: false, error: "투표 저장에 실패했습니다." }
        }

        // 5. 투표 후 완료 상태 재확인
        const isVotingCompleteAfter = await checkVotingCompletion(appointmentId)

        // 6. 투표 완료시 알림 처리
        if (isVotingCompleteAfter.isComplete) {
            try {
                // 알림 큐에 추가
                await addNotificationToQueue(appointmentId, creatorPhone)

                // 카카오 알림톡 전송
                await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/notifications/kakao/send_complete`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        appointmentId,
                        phoneNumber: creatorPhone,
                        appointmentTitle,
                        resultsUrl: `/results/${appointmentToken}`,
                    }),
                })
            } catch (notificationError) {
                console.error("알림 전송 오류:", notificationError)
                // 알림 실패는 투표 성공을 방해하지 않음
            }
        }

        // 7. 결과 페이지로 리다이렉트
        const resultUrl = `/results/${appointmentToken}?refresh=${Date.now()}`
        return {
            success: true,
            redirectUrl: resultUrl
        }

    } catch (error) {
        console.error("투표 제출 오류:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "투표 제출에 실패했습니다."
        }
    }
}
