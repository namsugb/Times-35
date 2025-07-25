import { checkVotingCompletion, checkAndUpdateVotingCompletion } from "./checkcomplete"

// 사용 예시
export async function exampleUsage() {
    try {
        const appointmentId = "your-appointment-id-here"

        // 1. 투표 완료 체크만 수행 (상태 업데이트 없음)
        const result = await checkVotingCompletion(appointmentId)

        console.log("투표 완료 체크 결과:", {
            isComplete: result.isComplete,
            reason: result.reason,
            participantCount: result.participantCount,
            completedDate: result.completedDate
        })

        // 2. 투표 완료 체크 및 상태 업데이트
        const resultWithUpdate = await checkAndUpdateVotingCompletion(appointmentId)

        if (resultWithUpdate.isComplete) {
            console.log("투표가 완료되었습니다!")
            console.log("완료 이유:", resultWithUpdate.reason)

            if (resultWithUpdate.completedDate) {
                console.log("완료된 날짜:", resultWithUpdate.completedDate)
            }
        } else {
            console.log("아직 투표가 완료되지 않았습니다.")
            console.log("현재 상황:", resultWithUpdate.reason)
        }

    } catch (error) {
        console.error("오류 발생:", error)
    }
}

// API 호출 예시
export async function apiCallExample() {
    try {
        const appointmentId = "your-appointment-id-here"

        // POST 요청 - 투표 완료 체크 및 상태 업데이트
        const postResponse = await fetch(`/api/check-completion/${appointmentId}`, {
            method: "POST",
        })

        if (postResponse.ok) {
            const result = await postResponse.json()
            console.log("POST 응답:", result)
        }

        // GET 요청 - 투표 완료 체크만 (상태 업데이트 없음)
        const getResponse = await fetch(`/api/check-completion/${appointmentId}`, {
            method: "GET",
        })

        if (getResponse.ok) {
            const result = await getResponse.json()
            console.log("GET 응답:", result)
        }

    } catch (error) {
        console.error("API 호출 오류:", error)
    }
}

// 투표 방식별 완료 조건 설명
export const votingMethodCompletionRules = {
    "all-available": {
        description: "모든 참여자가 투표하면 완료",
        condition: "참여인원 = 투표인원",
        example: "5명 중 5명이 투표하면 완료"
    },
    "max-available": {
        description: "모든 참여자가 투표하면 완료",
        condition: "참여인원 = 투표인원",
        example: "5명 중 5명이 투표하면 완료"
    },
    "minimum-required": {
        description: "기준인원 이상 투표받은 날이 생기면 완료",
        condition: "어느 날짜든 기준인원 이상이 투표",
        example: "기준 3명인데 7월 15일에 4명이 투표하면 완료"
    },
    "time-scheduling": {
        description: "모든 참여자가 투표하면 완료",
        condition: "참여인원 = 투표인원",
        example: "5명 중 5명이 투표하면 완료"
    },
    "recurring": {
        description: "모든 참여자가 투표하면 완료",
        condition: "참여인원 = 투표인원",
        example: "5명 중 5명이 투표하면 완료"
    }
}

// 반환되는 결과 객체 구조
export interface VotingCompletionResult {
    isComplete: boolean        // 투표 완료 여부
    reason?: string           // 완료/미완료 이유
    completedDate?: string    // 완료된 날짜 (minimum-required 방식에서만)
    completedTime?: number    // 완료된 시간 (향후 확장용)
    completedWeekday?: number // 완료된 요일 (향후 확장용)
    participantCount?: number // 현재 참여자 수
} 