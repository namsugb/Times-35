// 결과 계산 로직을 담당하는 유틸리티 함수들

export interface VoteResult {
  date?: string
  weekday?: number
  hour?: number
  count: number
  voters: string[]
  percentage: number
}

export interface CalculatedResults {
  allAvailable: VoteResult[]
  requiredAvailable: VoteResult[]
  maxAvailable: VoteResult[]
  optimalSlots?: VoteResult[]
  statistics: {
    totalVoters: number
    totalVotes: number
    avgVotesPerVoter: number
    completionRate: number
    mostPopularOption: string
  }
}

// 날짜별 투표 결과 계산
export function calculateDateResults(
  dateVotes: Record<string, { count: number; voters: string[] }>,
  totalVoters: number,
  requiredParticipants: number,
  method: string,
): CalculatedResults {
  const results: VoteResult[] = Object.entries(dateVotes).map(([date, data]) => ({
    date,
    count: data.count,
    voters: data.voters,
    percentage: totalVoters > 0 ? Math.round((data.count / totalVoters) * 100) : 0,
  }))

  // 투표 수 기준으로 정렬
  results.sort((a, b) => b.count - a.count)

  const allAvailable = results.filter((r) => r.count === totalVoters)
  const requiredAvailable = results.filter((r) => r.count >= requiredParticipants)
  const maxAvailable = results.length > 0 ? [results[0]] : []

  // 통계 계산
  const totalVotes = results.reduce((sum, r) => sum + r.count, 0)
  const avgVotesPerVoter = totalVoters > 0 ? totalVotes / totalVoters : 0
  const completionRate = totalVoters > 0 ? (results.length > 0 ? 100 : 0) : 0
  const mostPopularOption = results.length > 0 ? results[0].date || "없음" : "없음"

  return {
    allAvailable,
    requiredAvailable,
    maxAvailable,
    statistics: {
      totalVoters,
      totalVotes,
      avgVotesPerVoter: Math.round(avgVotesPerVoter * 100) / 100,
      completionRate,
      mostPopularOption,
    },
  }
}

// 시간별 투표 결과 계산
export function calculateTimeResults(
  timeVotes: Array<{ date: string; hour: number; count: number; voters: string[] }>,
  totalVoters: number,
  requiredParticipants: number,
): CalculatedResults {
  const results: VoteResult[] = timeVotes.map((vote) => ({
    date: vote.date,
    hour: vote.hour,
    count: vote.count,
    voters: vote.voters,
    percentage: totalVoters > 0 ? Math.round((vote.count / totalVoters) * 100) : 0,
  }))

  // 투표 수 기준으로 정렬
  results.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    if (a.date !== b.date) return a.date!.localeCompare(b.date!)
    return (a.hour || 0) - (b.hour || 0)
  })

  const allAvailable = results.filter((r) => r.count === totalVoters)
  const requiredAvailable = results.filter((r) => r.count >= requiredParticipants)
  const maxAvailable = results.length > 0 ? [results[0]] : []
  const optimalSlots = results.slice(0, 10)

  // 통계 계산
  const totalVotes = results.reduce((sum, r) => sum + r.count, 0)
  const avgVotesPerVoter = totalVoters > 0 ? totalVotes / totalVoters : 0
  const completionRate = totalVoters > 0 ? (results.length > 0 ? 100 : 0) : 0
  const mostPopularOption = results.length > 0 ? `${results[0].date} ${results[0].hour}시` : "없음"

  return {
    allAvailable,
    requiredAvailable,
    maxAvailable,
    optimalSlots,
    statistics: {
      totalVoters,
      totalVotes,
      avgVotesPerVoter: Math.round(avgVotesPerVoter * 100) / 100,
      completionRate,
      mostPopularOption,
    },
  }
}

// 요일별 투표 결과 계산
export function calculateWeekdayResults(
  weekdayVotes: Record<number, { count: number; voters: string[] }>,
  totalVoters: number,
  requiredParticipants: number,
  weeklyMeetings: number,
): CalculatedResults {
  const weekdayNames = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"]

  const results: VoteResult[] = Object.entries(weekdayVotes).map(([weekday, data]) => ({
    weekday: Number.parseInt(weekday),
    count: data.count,
    voters: data.voters,
    percentage: totalVoters > 0 ? Math.round((data.count / totalVoters) * 100) : 0,
  }))

  // 투표 수 기준으로 정렬
  results.sort((a, b) => b.count - a.count)

  const allAvailable = results.filter((r) => r.count === totalVoters)
  const requiredAvailable = results.filter((r) => r.count >= requiredParticipants)
  const maxAvailable = results.slice(0, weeklyMeetings) // 주간 미팅 횟수만큼

  // 통계 계산
  const totalVotes = results.reduce((sum, r) => sum + r.count, 0)
  const avgVotesPerVoter = totalVoters > 0 ? totalVotes / totalVoters : 0
  const completionRate = totalVoters > 0 ? (results.length > 0 ? 100 : 0) : 0
  const mostPopularOption = results.length > 0 ? weekdayNames[results[0].weekday!] : "없음"

  return {
    allAvailable,
    requiredAvailable,
    maxAvailable,
    statistics: {
      totalVoters,
      totalVotes,
      avgVotesPerVoter: Math.round(avgVotesPerVoter * 100) / 100,
      completionRate,
      mostPopularOption,
    },
  }
}

// 날짜별 달력 표시용 데이터 계산
export function calculateCalendarData(
  dateVotes: Record<string, { count: number; voters: string[] }>,
  timeVotes: Array<{ date: string; hour: number; count: number; voters: string[] }>,
  method: string,
): Record<string, { count: number; voters: string[]; maxTimeCount?: number }> {
  if (method === "time-scheduling") {
    // 시간 투표의 경우 날짜별로 최대 투표 수 계산
    const dateGroups: Record<string, { count: number; voters: string[]; maxTimeCount: number }> = {}

    timeVotes.forEach((vote) => {
      if (!dateGroups[vote.date]) {
        dateGroups[vote.date] = { count: 0, voters: [], maxTimeCount: 0 }
      }
      if (vote.count > dateGroups[vote.date].maxTimeCount) {
        dateGroups[vote.date].maxTimeCount = vote.count
        dateGroups[vote.date].count = vote.count
      }
      // 모든 투표자 수집 (중복 제거)
      vote.voters.forEach((voter) => {
        if (!dateGroups[vote.date].voters.includes(voter)) {
          dateGroups[vote.date].voters.push(voter)
        }
      })
    })

    return dateGroups
  }

  return dateVotes
}

// 색상 강도 계산
export function getColorIntensity(count: number, maxCount: number): string {
  if (count === 0) return "bg-gray-50 text-gray-400 border-gray-200"

  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0

  if (percentage >= 90) return "bg-green-600 text-white border-green-700 shadow-lg"
  if (percentage >= 75) return "bg-green-500 text-white border-green-600 shadow-md"
  if (percentage >= 60) return "bg-green-400 text-white border-green-500 shadow-md"
  if (percentage >= 45) return "bg-green-300 text-gray-900 border-green-400 shadow-sm"
  if (percentage >= 30) return "bg-green-200 text-gray-900 border-green-300"
  if (percentage >= 15) return "bg-green-100 text-gray-900 border-green-200"
  return "bg-green-50 text-gray-700 border-green-100"
}
