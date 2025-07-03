import { type NextRequest, NextResponse } from "next/server"
import {
  getAppointmentByToken,
  getDateVoteResults,
  getTimeVoteResults,
  getWeekdayVoteResults,
  getVoters,
} from "@/lib/database"
import { calculateDateResults, calculateTimeResults, calculateWeekdayResults } from "@/lib/result-calculator"

export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const appointment = await getAppointmentByToken(params.token)
    const voters = await getVoters(appointment.id)

    let results

    // 서버에서 계산 수행
    if (appointment.method === "recurring") {
      const weekdayVotes = await getWeekdayVoteResults(appointment.id)
      results = calculateWeekdayResults(
        weekdayVotes,
        voters.length,
        appointment.required_participants,
        appointment.weekly_meetings,
      )
    } else if (appointment.method === "time-scheduling") {
      const timeVotes = await getTimeVoteResults(appointment.id)
      results = calculateTimeResults(timeVotes, voters.length, appointment.required_participants)
    } else {
      const dateVotes = await getDateVoteResults(appointment.id)
      results = calculateDateResults(dateVotes, voters.length, appointment.required_participants, appointment.method)
    }

    return NextResponse.json({
      appointment,
      voters,
      results,
    })
  } catch (error) {
    console.error("결과 계산 오류:", error)
    return NextResponse.json({ error: "결과를 계산할 수 없습니다" }, { status: 500 })
  }
}
