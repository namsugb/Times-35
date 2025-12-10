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

// 약속 생성 
export async function createAppointment(data: AppointmentInsert) {
  try {
    // 환경 변수 디버깅
    console.log("🔧 환경 변수 확인:")
    console.log("  - SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("  - SUPABASE_KEY 존재:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    console.log("  - Supabase 클라이언트:", supabase ? "초기화됨" : "없음")

    // ➜ 1) 필수값 & 기본값 채우기
    const prepared: AppointmentInsert = {
      title: data.title.trim(),
      method: data.method,
      required_participants: data.required_participants ?? 1,
      weekly_meetings: data.weekly_meetings ?? 1,
      start_date: data.start_date ?? null,
      end_date: data.end_date ?? null,
      status: data.status ?? "active",
      is_public: data.is_public ?? true,
      share_token: generateShareToken(),
      creator_phone: data.creator_phone?.trim() || undefined,
    }

    // ➜ 2) Supabase는 `undefined` 값을 허용하지 않으므로 필터링
    const payload = Object.fromEntries(
      Object.entries(prepared).filter(([_, v]) => v !== undefined),
    ) as AppointmentInsert

    // ➜ 3) INSERT
    console.log("🔵 Supabase INSERT 시작...")
    console.log("🔵 Payload:", payload)

    const startTime = Date.now()
    const { data: appointment, error } = await supabase.from("appointments").insert(payload).select().single()
    const endTime = Date.now()

    console.log(`🔵 Supabase 응답 시간: ${endTime - startTime}ms`)
    console.log("🔵 응답 data:", appointment)
    console.log("🔵 응답 error:", error)

    // ➜ 4) 에러 처리
    if (error) {
      console.error("❌ 약속 생성 오류:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      })
      throw new Error(`약속 생성 실패: ${error.message || "Unknown error"}`)
    }

    console.log("✅ 약속 생성 성공!")
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

// 약속 조회 
export async function getAppointmentByToken(shareToken: string | undefined) {
  try {
    // ➜ 0) 잘못된 토큰(빈 문자열 · undefined · null) 차단
    if (!shareToken || shareToken === "undefined") {
      return
    }

    const { data: appointment, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("share_token", shareToken)
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

// 투표자 생성 (로그인한 사용자는 user_id도 저장)
export async function createVoter(appointmentId: string, name: string, authUserId?: string | null) {
  try {
    const voterData: any = {
      appointment_id: appointmentId,
      name: name.trim(),
    }

    // 로그인한 사용자인 경우 auth_id로 users 테이블에서 user_id 조회
    if (authUserId) {
      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("auth_id", authUserId)
        .single()

      if (userData) {
        voterData.user_id = userData.id
      }
    }

    const { data: voter, error } = await supabase
      .from("voters")
      .upsert(voterData, { onConflict: "appointment_id,name" })
      .select()
      .single()

    if (error) {
      console.error("투표자 생성 오류:", error)
      throw new Error(`투표자 등록에 실패했습니다: ${error.message}`)
    }

    return voter

  } catch (error: any) {
    console.error("createVoter 오류:", error)
    throw error
  }
}

// 날짜 방식(모두가능, 최대, 기준) 투표 데이터 생성
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

// 날짜 방식(모두가능, 최대, 기준) 투표 데이터 수정
export async function updateDateVotes(voterId: string, appointmentId: string, dates: string[]) {
  try {
    // 기존 투표 삭제 후 새로 생성 (수정을 위해)
    await supabase
      .from("date_votes")
      .delete()
      .eq("voter_id", voterId)
      .eq("appointment_id", appointmentId)

    const votes = dates.map((date) => ({
      voter_id: voterId,
      appointment_id: appointmentId,
      vote_date: date,
    }))

    const { data, error } = await supabase.from("date_votes").insert(votes).select()

    if (error) {
      console.error("날짜 투표 수정 오류:", error)
      throw new Error(`날짜 투표 수정에 실패했습니다: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("updateDateVotes 오류:", error)
    throw error
  }
}

// 시간 투표 생성 (날짜별 시간 배열로 저장)
export async function createTimeVotes(
  voterId: string,
  appointmentId: string,
  timeVotes: { date: string; times: string[] }[],
) {
  try {
    // 날짜별로 시간 배열 형태로 저장 (UPSERT)
    const votes = timeVotes.map(({ date, times }) => ({
      voter_id: voterId,
      appointment_id: appointmentId,
      vote_date: date,
      vote_times: times.sort(), // 시간 정렬하여 저장
    }))

    const { data, error } = await supabase
      .from("time_votes")
      .upsert(votes, { onConflict: "voter_id,appointment_id,vote_date" })
      .select()

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

// 시간 투표 수정 (날짜별 시간 배열로 저장)
export async function updateTimeVotes(
  voterId: string,
  appointmentId: string,
  timeVotes: { date: string; times: string[] }[],
) {
  try {
    // 기존 해당 약속의 투표 삭제
    await supabase
      .from("time_votes")
      .delete()
      .eq("voter_id", voterId)
      .eq("appointment_id", appointmentId)

    // 새로운 투표 데이터가 있으면 삽입
    if (timeVotes.length === 0) {
      return []
    }

    const votes = timeVotes.map(({ date, times }) => ({
      voter_id: voterId,
      appointment_id: appointmentId,
      vote_date: date,
      vote_times: times.sort(), // 시간 정렬하여 저장
    }))

    const { data, error } = await supabase
      .from("time_votes")
      .insert(votes)
      .select()

    if (error) {
      console.error("시간 투표 수정 오류:", error)
      throw new Error(`시간 투표 수정에 실패했습니다: ${error.message}`)
    }

    return data
  } catch (error: any) {
    console.error("updateTimeVotes 오류:", error)
    throw error
  }
}


// 날짜별 투표 현황 조회
export async function getDateVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("date_votes")
    .select(`
      vote_date,
      voter_id,
      voters!inner(name)
    `)
    .eq("appointment_id", appointmentId)

  if (error) throw error

  // 날짜별로 그룹화
  const results = data.reduce(
    (acc, vote) => {
      const date = vote.vote_date
      if (!acc[date]) {
        acc[date] = { count: 0, voterss: [] }
      }
      acc[date].count += 1
      // Supabase JOIN 결과 처리
      const voters = vote.voters as any
      const voterName = Array.isArray(voters)
        ? voters[0]?.name
        : voters?.name
      if (voterName) {
        acc[date].voterss.push(voterName)
      }

      return acc
    },
    {} as Record<string, { count: number; voterss: string[] }>,
  )
  return results
}

// 시간별 투표 현황 조회 (배열 형태 데이터 처리)
export async function getTimeVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("time_votes")
    .select(`
      vote_date,
      vote_times,
      voter_id,
      voters(name)
    `)
    .eq("appointment_id", appointmentId)

  if (error) throw error

  // 날짜-시간별로 그룹화 (배열 데이터 펼치기)
  const results: Record<string, { date: string; time: string; count: number; voters: string[] }> = {}

  for (const vote of data) {
    const voterData = vote.voters as any
    const voterName = Array.isArray(voterData)
      ? voterData[0]?.name
      : voterData?.name

    // 각 시간에 대해 결과 추가
    for (const time of vote.vote_times) {
      const key = `${vote.vote_date}-${time}`
      if (!results[key]) {
        results[key] = {
          date: vote.vote_date,
          time: time,
          count: 0,
          voters: [],
        }
      }
      results[key].count += 1
      if (voterName) {
        results[key].voters.push(voterName)
      }
    }
  }

  return Object.values(results)
}

// 요일별 투표 현황 조회
export async function getWeekdayVoteResults(appointmentId: string) {
  const { data, error } = await supabase
    .from("weekday_votes")
    .select(`
      weekday,
      voter_id,
      voters(name)
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
      // Supabase JOIN 결과 처리
      const voters = vote.voters as any
      const voterName = Array.isArray(voters)
        ? voters[0]?.name
        : voters?.name
      if (voterName) {
        acc[weekday].voters.push(voterName)
      }

      return acc
    },
    {} as Record<number, { count: number; voters: string[] }>,
  )

  return results
}

// 투표자 목록 조회 (users 테이블 JOIN하여 phone 정보 포함)
export async function getVoters(appointmentId: string) {
  const { data, error } = await supabase
    .from("voters")
    .select(`
      *,
      users:user_id (
        id,
        name,
        phone
      )
    `)
    .eq("appointment_id", appointmentId)
    .order("voted_at", { ascending: true })

  if (error) throw error

  // users 정보가 있으면 phone을 voter 객체에 추가
  const votersWithPhone = data?.map((voter: any) => ({
    ...voter,
    phone: voter.users?.phone || null,
    user_name: voter.users?.name || null,
  })) || []

  return votersWithPhone
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



// 알림큐 추가
export async function addNotificationToQueue(appointmentId: string, phone: string) {
  const { data, error } = await supabase.from("notification_queue").insert({
    appointment_id: appointmentId,
    phone_number: phone,
    message_type: "voting_complete",
    status: "pending",
  })

  if (error) throw error

  return { success: true, message: "알림큐에 추가되었습니다." }
}