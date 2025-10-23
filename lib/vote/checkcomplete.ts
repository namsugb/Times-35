import { supabase } from "../supabase"
import type { Database } from "../supabase"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
type Voter = Database["public"]["Tables"]["voters"]["Row"]
type DateVote = Database["public"]["Tables"]["date_votes"]["Row"]
type TimeVote = Database["public"]["Tables"]["time_votes"]["Row"]
type WeekdayVote = Database["public"]["Tables"]["weekday_votes"]["Row"]

export interface VotingCompletionResult {
    isComplete: boolean
    reason?: string
    completedDate?: string
    completedTime?: number
    completedWeekday?: number
    participantCount?: number
}


/**
 * 투표 완료 상태를 체크하는 함수
 * 
 * @param appointmentId - 약속 ID
 * @returns 투표 완료 여부와 관련 정보
 */
export async function checkVotingCompletion(appointmentId: string): Promise<VotingCompletionResult> {
    try {
        // 1. 약속 정보 조회
        const { data: appointment, error: appointmentError } = await supabase
            .from("appointments")
            .select("*")
            .eq("id", appointmentId)
            .single()

        if (appointmentError || !appointment) {
            throw new Error("약속을 찾을 수 없습니다.")
        }

        // 2. 투표자 수 조회
        const { data: voters, error: votersError } = await supabase
            .from("voters")
            .select("id")
            .eq("appointment_id", appointmentId)

        if (votersError) {
            throw new Error("투표자 정보를 조회할 수 없습니다.")
        }

        const totalVoters = voters?.length || 0

        // 3. 투표 방식에 따른 완료 체크
        switch (appointment.method) {
            case "all-available":
            case "max-available":
                return await checkAllAvailableCompletion(appointment, totalVoters)

            case "minimum-required":
                return await checkMinimumRequiredCompletion(appointment, totalVoters)

            case "time-scheduling":
                return await checkTimeSchedulingCompletion(appointment, totalVoters)

            case "recurring":
                return await checkRecurringCompletion(appointment, totalVoters)

            default:
                throw new Error(`지원하지 않는 투표 방식입니다: ${appointment.method}`)
        }
    } catch (error) {
        console.error("투표 완료 체크 오류:", error)
        throw error
    }
}

/**
 * all-available, max-available 방식의 완료 체크
 * 참여인원 = 투표인원 시 완료
 */
async function checkAllAvailableCompletion(
    appointment: Appointment,
    totalVoters: number
): Promise<VotingCompletionResult> {
    // required_participants가 설정되어 있으면 해당 수만큼, 없으면 모든 투표자
    const requiredParticipants = appointment.required_participants || totalVoters

    if (totalVoters >= requiredParticipants) {
        return {
            isComplete: true,
            reason: `모든 참여자(${requiredParticipants}명)가 투표를 완료했습니다.`,
            participantCount: totalVoters
        }
    }

    return {
        isComplete: false,
        reason: `아직 ${requiredParticipants - totalVoters}명이 더 투표해야 합니다.`,
        participantCount: totalVoters
    }
}

/**
 * minimum-required 방식의 완료 체크
 * 기준인원 이상 투표받은 날이 생길시 완료
 */
async function checkMinimumRequiredCompletion(
    appointment: Appointment,
    totalVoters: number
): Promise<VotingCompletionResult> {
    const requiredParticipants = appointment.required_participants || 1

    // 날짜별 투표 수 조회
    const { data: dateVotes, error: dateVotesError } = await supabase
        .from("date_votes")
        .select("vote_date")
        .eq("appointment_id", appointment.id)

    if (dateVotesError) {
        throw new Error("날짜 투표 정보를 조회할 수 없습니다.")
    }

    // 날짜별 투표 수 계산
    const dateVoteCounts = new Map<string, number>()
    dateVotes?.forEach(vote => {
        const date = vote.vote_date
        dateVoteCounts.set(date, (dateVoteCounts.get(date) || 0) + 1)
    })

    // 기준인원 이상 투표받은 날 찾기
    for (const [date, count] of dateVoteCounts) {
        if (count >= requiredParticipants) {
            return {
                isComplete: true,
                reason: `${date}에 기준인원(${requiredParticipants}명) 이상이 투표했습니다.`,
                completedDate: date,
                participantCount: count
            }
        }
    }

    return {
        isComplete: false,
        reason: `아직 기준인원(${requiredParticipants}명) 이상이 투표한 날이 없습니다.`,
        participantCount: totalVoters
    }
}

/**
 * time-scheduling 방식의 완료 체크
 * 참여인원 = 투표인원 시 완료
 */
async function checkTimeSchedulingCompletion(
    appointment: Appointment,
    totalVoters: number
): Promise<VotingCompletionResult> {
    const requiredParticipants = appointment.required_participants || totalVoters

    if (totalVoters >= requiredParticipants) {
        return {
            isComplete: true,
            reason: `모든 참여자(${requiredParticipants}명)가 투표를 완료했습니다.`,
            participantCount: totalVoters
        }
    }

    return {
        isComplete: false,
        reason: `아직 ${requiredParticipants - totalVoters}명이 더 투표해야 합니다.`,
        participantCount: totalVoters
    }
}

/**
 * recurring 방식의 완료 체크
 * 참여인원 = 투표인원 시 완료
 */
async function checkRecurringCompletion(
    appointment: Appointment,
    totalVoters: number
): Promise<VotingCompletionResult> {
    const requiredParticipants = appointment.required_participants || totalVoters

    if (totalVoters >= requiredParticipants) {
        return {
            isComplete: true,
            reason: `모든 참여자(${requiredParticipants}명)가 투표를 완료했습니다.`,
            participantCount: totalVoters
        }
    }

    return {
        isComplete: false,
        reason: `아직 ${requiredParticipants - totalVoters}명이 더 투표해야 합니다.`,
        participantCount: totalVoters
    }
}

/**
 * 투표 완료 시 약속 상태를 업데이트하는 함수
 */
export async function updateAppointmentStatusOnCompletion(appointmentId: string): Promise<void> {
    try {
        const { error } = await supabase
            .from("appointments")
            .update({
                status: "completed",
                updated_at: new Date().toISOString()
            })
            .eq("id", appointmentId)
            .eq("status", "active")

        if (error) {
            console.error("약속 상태 업데이트 오류:", error)
        }
    } catch (error) {
        console.error("약속 상태 업데이트 중 오류:", error)
    }
}

/**
 * 투표 완료 체크 및 상태 업데이트를 한번에 처리하는 함수
 */
export async function checkAndUpdateVotingCompletion(appointmentId: string): Promise<VotingCompletionResult> {
    const result = await checkVotingCompletion(appointmentId)

    if (result.isComplete) {
        await updateAppointmentStatusOnCompletion(appointmentId)
    }

    return result
}