import { supabase } from "./supabase"
import type { Database } from "./supabase"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"]
type AppointmentInsert = Database["public"]["Tables"]["appointments"]["Insert"]
type Voter = Database["public"]["Tables"]["voters"]["Row"]
type VoterInsert = Database["public"]["Tables"]["voters"]["Insert"]
type DateVote = Database["public"]["Tables"]["date_votes"]["Row"]
type TimeVote = Database["public"]["Tables"]["time_votes"]["Row"]
type WeekdayVote = Database["public"]["Tables"]["weekday_votes"]["Row"]

// 세션 ID 생성 함수
export function generateSessionId(): string {
  return "session_" + Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 약속 생성 (연락처 필드 추가)
export async function createAppointment(data: AppointmentInsert & { creator_phone?: string }) {
  try {
    // ➜ 1) 필수값 & 기본값 채우기
    const prepared: AppointmentInsert & { creator_phone?: string } = {
      title: data.title.trim(),
      method: data.method,
      required_participants: data.required_participants ?? 1,
      weekly_meetings: data.weekly_meetings ?? 1,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      status: data.status ?? "active",
      is_public: data.is_public ?? true,
      share_token: generateShareToken(),
      creator_phone: data.creator_phone?.trim() || null,
    }

    // ➜ 2) Supabase는 `undefined` 값을 허용하지 않으므로 필터링
    const payload = Object.fromEntries(
      Object.entries(prepared).filter(([_, v]) => v !== undefined),
    ) as AppointmentInsert

    // ➜ 3) INSERT
    const { data: appointment, error } = await supabase.from("appointments").insert(payload).select().single()

    // ➜ 4) 에러 처리
    if (error) {
      console.error("약속 생성 오류:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`약속 생성 실패: ${error.message || "Unknown error"}`)
    }

    return appointment
  } catch (err) {
    console.error("createAppointment 실패:", err)
    throw err
  }
}

// Share token 생성
function generateShareToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// 약속 조회 (share_token으로)
export async function getAppointmentByToken(shareToken: string | null | undefined) {
  try {
    // ➜ 0) 잘못된 토큰(빈 문자열 · undefined · null) 차단
    if (!shareToken || shareToken === "undefined") {
      return null
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("share_token", shareToken)
      .eq("is_public", true)
      .single()

    if (error) {
      console.error("약속 조회 오류:", error)
      throw new Error(`약속을 찾을 수 없습니다: ${error.message}`)
    }

    return appointment
  } catch (error: any) {
    console.error("getAppointmentByToken 오류:", error)
    throw error
  }
}

// 투표자 생성 또는 업데이트 (기존 투표자가 있으면 업데이트)
export async function createVoter(data: VoterInsert) {
  try {
    // 기존 투표자 체크
    const { data: existingVoter } = await supabase
      .from("voters")
      .select("id")
      .eq("appointment_id", data.appointment_id)
      .eq("name", data.name.trim())
      .single()

    let voter

    if (existingVoter) {
      // 기존 투표자가 있으면 업데이트
      const { data: updatedVoter, error } = await supabase
        .from("voters")
        .update({
          session_id: data.session_id,
          voted_at: new Date().toISOString(),
        })
        .eq("id", existingVoter.id)
        .select()
        .single()

      if (error) {
        console.error("투표자 업데이트 오류:", error)
        throw new Error(`투표자 정보 업데이트에 실패했습니다: ${error.message}`)
      }

      voter = updatedVoter

      // 기존 투표 데이터 삭제
      await deleteExistingVotes(existingVoter.id, data.appointment_id)
    } else {
      // 새 투표자 생성
      const { data: newVoter, error } = await supabase
        .from("voters")
        .insert({
          ...data,
          name: data.name.trim(),
        })
        .select()
        .single()

      if (error) {
        console.error("투표자 생성 오류:", error)
        throw new Error(`투표자 등록에 실패했습니다: ${error.message}`)
      }

      voter = newVoter
    }

    // 투표 완료 체크
    await checkVotingCompletion(data.appointment_id)

    return voter
  } catch (error: any) {
    console.error("createVoter 오류:", error)
    throw error
  }
}

// 기존 투표 데이터 삭제 함수
async function deleteExistingVotes(voterId: string, appointmentId: string) {
  try {
    // 날짜 투표 삭제
    await supabase.from("date_votes").delete().eq("voter_id", voterId).eq("appointment_id", appointmentId)

    // 시간 투표 삭제
    await supabase.from("time_votes").delete().eq("voter_id", voterId).eq("appointment_id", appointmentId)

    // 요일 투표 삭제
    await supabase.from("weekday_votes").delete().eq("voter_id", voterId).eq("appointment_id", appointmentId)

    console.log("기존 투표 데이터 삭제 완료")
  } catch (error) {
    console.error("기존 투표 데이터 삭제 오류:", error)
    // 삭제 실패해도 계속 진행
  }
}

// 투표 완료 체크 함수
async function checkVotingCompletion(appointmentId: string) {
  try {
    await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/check-completion/${appointmentId}`,
      {
        method: "POST",
      },
    )
  } catch (error) {
    console.error("투표 완료 체크 실패:", error)
  }
}

// 날짜 투표 생성
export async function createDateVotes(voterId: string, appointmentId: string, dates: string[]) {
  try {
    const votes = dates.map((date) => ({
      voter_id: voterId,
      appointment_id: appointmentId,
      vote_date: date,
    }))

    const { data, error } = await supabase.from("date_votes").insert(votes).select()

    if (error) {
      console.error("날짜 투표 생성 오류:", error)
      throw new Error(`날짜 투표 저장에 실패했습니다: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("createDateVotes 오류:", error)
    throw error
  }
}

// 시간 투표 생성
export async function createTimeVotes(
  voterId: string,
  appointmentId: string,
  timeVotes: { date: string; times: number[] }[],
) {
  try {
    const votes = timeVotes.flatMap(({ date, times }) =>
      times.map((hour) => ({
        voter_id: voterId,
        appointment_id: appointmentId,
        vote_date: date,
        vote_hour: hour,
      })),
    )

    const { data, error } = await supabase.from("time_votes").insert(votes).select()

    if (error) {
      console.error("시간 투표 생성 오류:", error)
      throw new Error(`시간 투표 저장에 실패했습니다: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("createTimeVotes 오류:", error)
    throw error
  }
}

// 요일 투표 생성
export async function createWeekdayVotes(voterId: string, appointmentId: string, weekdays: number[]) {
  try {
    const votes = weekdays.map((weekday) => ({
      voter_id: voterId,
      appointment_id: appointmentId,
      weekday,
    }))

    const { data, error } = await supabase.from("weekday_votes").insert(votes).select()

    if (error) {
      console.error("요일 투표 생성 오류:", error)
      throw new Error(`요일 투표 저장에 실패했습니다: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("createWeekdayVotes 오류:", error)
    throw error
  }
}

// 날짜별 투표 현황 조회
export async function getDateVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("date_votes")
    .select(`
      vote_date,
      voters!inner(name)
    `)
    .eq("appointment_id", appointmentId)

  if (error) throw error

  // 날짜별로 그룹화
  const results = data.reduce(
    (acc, vote) => {
      const date = vote.vote_date
      if (!acc[date]) {
        acc[date] = { count: 0, voters: [] }
      }
      acc[date].count += 1
      acc[date].voters.push(vote.voters.name)
      return acc
    },
    {} as Record<string, { count: number; voters: string[] }>,
  )

  return results
}

// 시간별 투표 현황 조회
export async function getTimeVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("time_votes")
    .select(`
      vote_date,
      vote_hour,
      voters!inner(name)
    `)
    .eq("appointment_id", appointmentId)

  if (error) throw error

  // 날짜-시간별로 그룹화
  const results = data.reduce(
    (acc, vote) => {
      const key = `${vote.vote_date}-${vote.vote_hour}`
      if (!acc[key]) {
        acc[key] = {
          date: vote.vote_date,
          hour: vote.vote_hour,
          count: 0,
          voters: [],
        }
      }
      acc[key].count += 1
      acc[key].voters.push(vote.voters.name)
      return acc
    },
    {} as Record<string, { date: string; hour: number; count: number; voters: string[] }>,
  )

  return Object.values(results)
}

// 요일별 투표 현황 조회
export async function getWeekdayVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("weekday_votes")
    .select(`
      weekday,
      voters!inner(name)
    `)
    .eq("appointment_id", appointmentId)

  if (error) throw error

  // 요일별로 그룹화
  const results = data.reduce(
    (acc, vote) => {
      const weekday = vote.weekday
      if (!acc[weekday]) {
        acc[weekday] = { count: 0, voters: [] }
      }
      acc[weekday].count += 1
      acc[weekday].voters.push(vote.voters.name)
      return acc
    },
    {} as Record<number, { count: number; voters: string[] }>,
  )

  return results
}

// 투표자 목록 조회
export async function getVoters(appointmentId: string) {
  const { data, error } = await supabase
    .from("voters")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("voted_at", { ascending: true })

  if (error) throw error
  return data
}

// 약속 통계 조회 (함수 호출)
export async function getAppointmentStatistics(appointmentId: string) {
  const { data, error } = await supabase.rpc("get_appointment_statistics", { appointment_uuid: appointmentId })

  if (error) throw error
  return data?.[0] || null
}

// 최대 다수 가능 날짜 조회 (함수 호출)
export async function getMaxAvailableDates(appointmentId: string) {
  const { data, error } = await supabase.rpc("get_max_available_dates", { appointment_uuid: appointmentId })

  if (error) throw error
  return data || []
}

// 최적 시간 슬롯 조회 (함수 호출)
export async function getOptimalTimeSlots(appointmentId: string, limit = 10) {
  const { data, error } = await supabase.rpc("get_optimal_time_slots", {
    appointment_uuid: appointmentId,
    slot_limit: limit,
  })

  if (error) throw error
  return data || []
}

// 요일별 가용성 조회 (함수 호출)
export async function getWeekdayAvailability(appointmentId: string) {
  const { data, error } = await supabase.rpc("get_weekday_availability", { appointment_uuid: appointmentId })

  if (error) throw error
  return data || []
}

// 연결 테스트 함수
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from("appointments").select("count(*)").limit(1)

    if (error) {
      throw new Error(`데이터베이스 연결 실패: ${error.message}`)
    }

    return { success: true, message: "데이터베이스 연결 성공!" }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
