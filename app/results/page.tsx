"use client"

import { useState } from "react"
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns"
import { ko } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Share2, Clock, Timer, CheckCircle2, Users, Calendar, Repeat, Crown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

// Enhanced mock data with more realistic voting patterns
const mockTimeVoters = [
  {
    id: 1,
    name: "김민준",
    selections: [
      { date: "2024-05-20", times: [9, 10, 11, 14, 15] },
      { date: "2024-05-21", times: [10, 11, 13, 14, 15, 16] },
      { date: "2024-05-22", times: [9, 10, 14, 15, 16] },
    ],
  },
  {
    id: 2,
    name: "이서연",
    selections: [
      { date: "2024-05-21", times: [9, 10, 11, 15, 16] },
      { date: "2024-05-22", times: [10, 11, 14, 15, 16, 17] },
      { date: "2024-05-23", times: [9, 10, 11, 13, 14] },
    ],
  },
  {
    id: 3,
    name: "박지훈",
    selections: [
      { date: "2024-05-20", times: [10, 11, 13, 14, 15] },
      { date: "2024-05-22", times: [9, 10, 11, 15, 16] },
      { date: "2024-05-24", times: [14, 15, 16, 17, 18] },
    ],
  },
  {
    id: 4,
    name: "최예은",
    selections: [
      { date: "2024-05-21", times: [10, 11, 14, 15, 16] },
      { date: "2024-05-22", times: [9, 10, 11, 14, 15] },
      { date: "2024-05-25", times: [13, 14, 15, 16, 17] },
    ],
  },
  {
    id: 5,
    name: "정도윤",
    selections: [
      { date: "2024-05-22", times: [10, 11, 14, 15, 16] },
      { date: "2024-05-23", times: [9, 10, 13, 14, 15] },
      { date: "2024-05-24", times: [15, 16, 17, 18, 19] },
    ],
  },
  {
    id: 6,
    name: "한지우",
    selections: [
      { date: "2024-05-20", times: [9, 10, 11] },
      { date: "2024-05-22", times: [14, 15, 16] },
      { date: "2024-05-23", times: [10, 11, 13, 14] },
    ],
  },
  {
    id: 7,
    name: "윤서아",
    selections: [
      { date: "2024-05-21", times: [9, 10, 15, 16] },
      { date: "2024-05-22", times: [10, 11, 14, 15] },
      { date: "2024-05-24", times: [14, 15, 16] },
    ],
  },
]

// Enhanced mock data with more varied voting patterns
const mockVoters = [
  { id: 1, name: "김민준", dates: ["2024-05-20", "2024-05-21", "2024-05-22", "2024-05-23"] },
  { id: 2, name: "이서연", dates: ["2024-05-21", "2024-05-22", "2024-05-23", "2024-05-24"] },
  { id: 3, name: "박지훈", dates: ["2024-05-20", "2024-05-22", "2024-05-24", "2024-05-25"] },
  { id: 4, name: "최예은", dates: ["2024-05-21", "2024-05-22", "2024-05-25", "2024-05-26"] },
  { id: 5, name: "정도윤", dates: ["2024-05-22", "2024-05-23", "2024-05-24", "2024-05-27"] },
  { id: 6, name: "한지우", dates: ["2024-05-20", "2024-05-22", "2024-05-23"] },
  { id: 7, name: "윤서아", dates: ["2024-05-21", "2024-05-22", "2024-05-24"] },
  { id: 8, name: "조민서", dates: ["2024-05-22", "2024-05-23", "2024-05-25"] },
]

const mockRecurringVoters = [
  { id: 1, name: "김민준", weekdays: [1, 2, 4] }, // 월, 화, 목
  { id: 2, name: "이서연", weekdays: [1, 3, 5] }, // 월, 수, 금
  { id: 3, name: "박지훈", weekdays: [2, 3, 4] }, // 화, 수, 목
  { id: 4, name: "최예은", weekdays: [1, 2, 5] }, // 월, 화, 금
  { id: 5, name: "정도윤", weekdays: [3, 4, 5] }, // 수, 목, 금
]

const weekdays = [
  { id: 0, name: "일요일", short: "일" },
  { id: 1, name: "월요일", short: "월" },
  { id: 2, name: "화요일", short: "화" },
  { id: 3, name: "수요일", short: "수" },
  { id: 4, name: "목요일", short: "목" },
  { id: 5, name: "금요일", short: "금" },
  { id: 6, name: "토요일", short: "토" },
]

const appointmentTitle = "팀 프로젝트 미팅"
const requiredParticipants = 4

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isTimeDetailOpen, setIsTimeDetailOpen] = useState(false)
  const [isVoterDetailOpen, setIsVoterDetailOpen] = useState(false)

  // Simple toast implementation
  const showToast = (message: string) => {
    alert(message) // Simple fallback for toast
  }

  // Get method from URL parameters
  const method = searchParams.get("method") || "all-available"
  const weeklyMeetings = Number.parseInt(searchParams.get("weeklyMeetings") || "1")

  // Use appropriate data based on scheduling method
  const voters =
    method === "time-scheduling" ? mockTimeVoters : method === "recurring" ? mockRecurringVoters : mockVoters

  // Calculate availability based on method
  const calculateAvailability = () => {
    if (method === "recurring") {
      return mockRecurringVoters.reduce(
        (acc, voter) => {
          voter.weekdays.forEach((weekday) => {
            if (!acc[weekday]) {
              acc[weekday] = { count: 0, voters: [] }
            }
            acc[weekday].count += 1
            acc[weekday].voters.push(voter.name)
          })
          return acc
        },
        {} as Record<number, { count: number; voters: string[] }>,
      )
    }

    if (method === "time-scheduling") {
      const timeAvailability: Record<string, Record<number, { count: number; voters: string[] }>> = {}
      mockTimeVoters.forEach((voter) => {
        voter.selections.forEach((selection) => {
          if (!timeAvailability[selection.date]) {
            timeAvailability[selection.date] = {}
          }
          selection.times.forEach((time) => {
            if (!timeAvailability[selection.date][time]) {
              timeAvailability[selection.date][time] = { count: 0, voters: [] }
            }
            timeAvailability[selection.date][time].count += 1
            timeAvailability[selection.date][time].voters.push(voter.name)
          })
        })
      })
      return timeAvailability
    }

    // Regular date-based availability
    return mockVoters.reduce(
      (acc, voter) => {
        voter.dates.forEach((date) => {
          if (!acc[date]) {
            acc[date] = { count: 0, voters: [] }
          }
          acc[date].count += 1
          acc[date].voters.push(voter.name)
        })
        return acc
      },
      {} as Record<string, { count: number; voters: string[] }>,
    )
  }

  const availability = calculateAvailability()

  // Calculate date availability for calendar display (for non-recurring methods)
  const dateAvailability =
    method === "recurring"
      ? {}
      : method === "time-scheduling"
        ? Object.keys(availability).reduce(
            (acc, date) => {
              const maxCount = Math.max(...Object.values(availability[date] as any).map((t: any) => t.count))
              const allVoters = new Set<string>()
              Object.values(availability[date] as any).forEach((t: any) => {
                t.voters.forEach((voter: string) => allVoters.add(voter))
              })
              acc[date] = { count: maxCount, voters: Array.from(allVoters) }
              return acc
            },
            {} as Record<string, { count: number; voters: string[] }>,
          )
        : (availability as Record<string, { count: number; voters: string[] }>)

  // Find results based on method
  const getResults = () => {
    if (method === "recurring") {
      const weekdayAvailability = availability as Record<number, { count: number; voters: string[] }>
      const sortedWeekdays = Object.entries(weekdayAvailability)
        .map(([weekday, data]) => ({ weekday: Number.parseInt(weekday), ...data }))
        .sort((a, b) => b.count - a.count)

      return {
        allAvailable: sortedWeekdays.filter((w) => w.count === mockRecurringVoters.length),
        requiredAvailable: sortedWeekdays.filter((w) => w.count >= requiredParticipants),
        maxAvailable: sortedWeekdays.slice(0, weeklyMeetings),
      }
    }

    if (method === "time-scheduling") {
      const optimalSlots: Array<{ date: string; time: number; count: number }> = []
      Object.entries(availability).forEach(([date, times]) => {
        Object.entries(times as any).forEach(([time, data]: [string, any]) => {
          optimalSlots.push({ date, time: Number.parseInt(time), count: data.count })
        })
      })
      optimalSlots.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return a.time - b.time
      })

      return { optimalSlots: optimalSlots.slice(0, 10) }
    }

    // Regular date-based methods
    const dateAvail = availability as Record<string, { count: number; voters: string[] }>
    const allAvailable = Object.entries(dateAvail)
      .filter(([_, data]) => data.count === mockVoters.length)
      .map(([date]) => date)

    const requiredAvailable = Object.entries(dateAvail)
      .filter(([_, data]) => data.count >= requiredParticipants)
      .map(([date]) => date)

    const maxAvailableDate = Object.entries(dateAvail).reduce(
      (max, [date, data]) => {
        if (!max.date || data.count > max.count) {
          return { date, count: data.count }
        }
        return max
      },
      { date: "", count: 0 },
    ).date

    return { allAvailable, requiredAvailable, maxAvailableDate }
  }

  const results = getResults()

  // Generate days for the current month (for non-recurring methods)
  const daysInMonth =
    method === "recurring"
      ? []
      : eachDayOfInterval({
          start: startOfMonth(currentMonth),
          end: endOfMonth(currentMonth),
        })

  // Get the maximum count for color scaling
  const maxCount =
    method === "recurring"
      ? Math.max(
          ...Object.values(availability as Record<number, { count: number; voters: string[] }>).map(
            (data) => data.count,
          ),
        )
      : Math.max(...Object.values(dateAvailability).map((data) => data.count))

  // Enhanced function to get color intensity based on count
  const getColorIntensity = (count: number) => {
    if (count === 0) return "bg-gray-50 text-gray-400 border-gray-200"

    const percentage = (count / maxCount) * 100

    if (percentage >= 90) return "bg-green-600 text-white border-green-700 shadow-lg"
    if (percentage >= 75) return "bg-green-500 text-white border-green-600 shadow-md"
    if (percentage >= 60) return "bg-green-400 text-white border-green-500 shadow-md"
    if (percentage >= 45) return "bg-green-300 text-gray-900 border-green-400 shadow-sm"
    if (percentage >= 30) return "bg-green-200 text-gray-900 border-green-300"
    if (percentage >= 15) return "bg-green-100 text-gray-900 border-green-200"
    return "bg-green-50 text-gray-700 border-green-100"
  }

  // Get participation rate text
  const getParticipationRate = (count: number) => {
    const percentage = Math.round((count / mockVoters.length) * 100)
    return `${percentage}%`
  }

  // Handle date click for time scheduling or voter details
  const handleDateClick = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd")

    if (method === "time-scheduling" && availability[dateStr]) {
      setSelectedDate(dateStr)
      setIsTimeDetailOpen(true)
    } else if (dateAvailability[dateStr] && dateAvailability[dateStr].count > 0) {
      setSelectedDate(dateStr)
      setIsVoterDetailOpen(true)
    }
  }

  // Function to copy the results link
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href)
      showToast("링크가 복사되었습니다")
    } else {
      showToast("링크 복사를 지원하지 않는 브라우저입니다")
    }
  }

  // Get method icon and title
  const getMethodInfo = () => {
    switch (method) {
      case "all-available":
        return { icon: <Calendar className="inline h-5 w-5 ml-1" />, title: "모두 가능한 날" }
      case "max-available":
        return { icon: <Users className="inline h-5 w-5 ml-1" />, title: "최대 다수 가능" }
      case "minimum-required":
        return { icon: <Clock className="inline h-5 w-5 ml-1" />, title: "기준 인원 이상 가능" }
      case "time-scheduling":
        return { icon: <Timer className="inline h-5 w-5 ml-1" />, title: "약속 시간정하기" }
      case "recurring":
        return { icon: <Repeat className="inline h-5 w-5 ml-1" />, title: "반복 일정 선택" }
      default:
        return { icon: null, title: "" }
    }
  }

  const methodInfo = getMethodInfo()

  if (method === "recurring") {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {appointmentTitle} 결과 {methodInfo.icon}
            </h1>
            <p className="text-muted-foreground">
              총 {mockRecurringVoters.length}명이 투표했습니다. (주 {weeklyMeetings}회 반복)
            </p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" className="flex items-center gap-2" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
              친구에게 공유하기
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">메인으로</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>요일별 참여 가능 인원</CardTitle>
                <CardDescription>각 요일별로 참여 가능한 인원 수를 보여줍니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-3">
                  {weekdays.map((weekday) => {
                    const weekdayData = availability[weekday.id] as { count: number; voters: string[] } | undefined
                    const count = weekdayData?.count || 0
                    const isOptimal = results.maxAvailable?.some((w: any) => w.weekday === weekday.id)
                    const isAllAvailable = results.allAvailable?.some((w: any) => w.weekday === weekday.id)
                    const isRequiredAvailable = results.requiredAvailable?.some((w: any) => w.weekday === weekday.id)

                    return (
                      <TooltipProvider key={weekday.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`p-4 rounded-lg text-center relative border-2 ${getColorIntensity(count)} ${
                                count > 0 ? "cursor-pointer hover:shadow-md transition-all" : ""
                              }`}
                            >
                              <div className="font-medium text-sm mb-1">{weekday.short}</div>
                              <div className="text-xs opacity-70">{weekday.name}</div>
                              <div className="text-lg font-bold mt-2">{count}명</div>
                              <div className="text-xs mt-1 opacity-80">{getParticipationRate(count)}</div>
                              {(isAllAvailable || isRequiredAvailable || isOptimal) && (
                                <div className="absolute -top-1 -right-1">
                                  <CheckCircle2 className="h-4 w-4 text-yellow-500" />
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {weekdayData ? (
                              <div>
                                <p className="font-medium">{weekday.name}</p>
                                <p>
                                  {count}명 참여 가능 ({getParticipationRate(count)})
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{weekdayData.voters.join(", ")}</p>
                              </div>
                            ) : (
                              <p>{weekday.name} - 참여 가능한 인원 없음</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>추천 요일</CardTitle>
                <CardDescription>주 {weeklyMeetings}회 기준 최적의 요일입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="optimal">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="optimal">최적</TabsTrigger>
                    <TabsTrigger value="all">모두 가능</TabsTrigger>
                    <TabsTrigger value="required">기준 인원</TabsTrigger>
                  </TabsList>

                  <TabsContent value="optimal">
                    <div className="space-y-2">
                      {results.maxAvailable?.map((weekdayData: any, index: number) => (
                        <div
                          key={weekdayData.weekday}
                          className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{index + 1}순위</span>
                            <span>{weekdays.find((w) => w.id === weekdayData.weekday)?.name}</span>
                          </div>
                          <Badge variant="outline">{weekdayData.count}명</Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="all">
                    {results.allAvailable?.length > 0 ? (
                      <div className="space-y-2">
                        {results.allAvailable.map((weekdayData: any) => (
                          <div
                            key={weekdayData.weekday}
                            className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                          >
                            <span>{weekdays.find((w) => w.id === weekdayData.weekday)?.name}</span>
                            <Badge variant="outline">{mockRecurringVoters.length}명</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">모두가 가능한 요일이 없습니다.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="required">
                    {results.requiredAvailable?.length > 0 ? (
                      <div className="space-y-2">
                        {results.requiredAvailable.map((weekdayData: any) => (
                          <div
                            key={weekdayData.weekday}
                            className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                          >
                            <span>{weekdays.find((w) => w.id === weekdayData.weekday)?.name}</span>
                            <Badge variant="outline">{weekdayData.count}명</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">기준 인원을 만족하는 요일이 없습니다.</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>투표자 리스트</CardTitle>
                <CardDescription>총 {mockRecurringVoters.length}명이 투표했습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {mockRecurringVoters.map((voter) => (
                    <li key={voter.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {voter.name.substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{voter.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {voter.weekdays.map((w) => weekdays.find((wd) => wd.id === w)?.short).join(", ")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Regular calendar-based results (for all other methods)
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {appointmentTitle} 결과 {methodInfo.icon}
          </h1>
          <p className="text-muted-foreground">
            총 {voters.length}명이 투표했습니다. ({methodInfo.title})
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            친구에게 공유하기
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">메인으로</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                투표 결과 달력
                {method === "max-available" && <Crown className="h-5 w-5 text-yellow-500" />}
                {method === "time-scheduling" && <span className="text-sm font-normal">(최대값 기준)</span>}
              </CardTitle>
              <CardDescription>
                {method === "all-available" && "모든 사람이 참석 가능한 날짜를 강조합니다."}
                {method === "max-available" &&
                  "색이 진할수록 더 많은 사람이 선택한 날짜입니다. 날짜를 클릭하면 상세 정보를 볼 수 있습니다."}
                {method === "minimum-required" && `${requiredParticipants}명 이상 참석 가능한 날짜를 표시합니다.`}
                {method === "time-scheduling" && "날짜를 클릭하면 시간별 상세 정보를 볼 수 있습니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center">
                {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
                  <div key={day} className="font-medium text-sm py-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                  <div key={`empty-start-${i}`} className="h-16 rounded-md"></div>
                ))}

                {daysInMonth.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const dayAvailability = dateAvailability[dateStr]
                  const count = dayAvailability?.count || 0

                  // Determine if this date meets the method criteria
                  let isHighlighted = false
                  let highlightIcon = null

                  if (method === "all-available") {
                    isHighlighted = results.allAvailable?.includes(dateStr)
                    if (isHighlighted) highlightIcon = <CheckCircle2 className="h-3 w-3 text-green-500" />
                  } else if (method === "max-available") {
                    isHighlighted = dateStr === results.maxAvailableDate
                    if (isHighlighted) highlightIcon = <Crown className="h-3 w-3 text-yellow-500" />
                  } else if (method === "minimum-required") {
                    isHighlighted = results.requiredAvailable?.includes(dateStr)
                    if (isHighlighted) highlightIcon = <CheckCircle2 className="h-3 w-3 text-blue-500" />
                  } else if (method === "time-scheduling") {
                    isHighlighted = availability[dateStr] !== undefined
                    if (isHighlighted) highlightIcon = <Clock className="h-3 w-3 text-primary" />
                  }

                  // Get color classes
                  const colorClasses = getColorIntensity(count)

                  return (
                    <TooltipProvider key={dateStr}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`h-16 rounded-lg flex flex-col items-center justify-center relative cursor-pointer border-2 transition-all duration-200 hover:shadow-lg ${colorClasses} ${
                              method === "time-scheduling" && availability[dateStr]
                                ? "hover:ring-2 hover:ring-primary"
                                : ""
                            } ${count > 0 ? "hover:scale-105" : ""}`}
                            onClick={() => handleDateClick(day)}
                          >
                            <span className="text-sm font-bold">{format(day, "d")}</span>
                            {count > 0 && (
                              <>
                                <span className="text-xs font-bold">{count}명</span>
                                <span className="text-xs opacity-90">{getParticipationRate(count)}</span>
                              </>
                            )}
                            {highlightIcon && <div className="absolute -top-1 -right-1">{highlightIcon}</div>}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {dayAvailability ? (
                            <div>
                              <p className="font-medium">{format(day, "M월 d일 (eee)", { locale: ko })}</p>
                              <p>
                                {count}명 참여 가능 ({getParticipationRate(count)})
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">{dayAvailability.voters.join(", ")}</p>
                              {method === "time-scheduling" && (
                                <p className="text-xs text-muted-foreground">클릭하여 시간별 보기</p>
                              )}
                              {method === "max-available" && (
                                <p className="text-xs text-muted-foreground">클릭하여 상세 보기</p>
                              )}
                            </div>
                          ) : (
                            <p>참여 가능한 인원이 없습니다.</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>

              {/* Enhanced color legend */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">참여 인원 범례</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-50 border-2 border-gray-200 rounded-md"></div>
                    <span>0명 (0%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 border-2 border-green-200 rounded-md"></div>
                    <span>1-2명 (15-30%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-300 border-2 border-green-400 rounded-md"></div>
                    <span>3-4명 (45-60%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 border-2 border-green-700 rounded-md"></div>
                    <span>{maxCount}명 (최대)</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  색이 진할수록 더 많은 사람이 선택한 날짜입니다.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{method === "time-scheduling" ? "최적의 날짜와 시간" : "계산된 약속 날짜"}</CardTitle>
              <CardDescription>
                {method === "all-available" && "모든 사람이 참석 가능한 날짜입니다."}
                {method === "max-available" && "가장 많은 사람이 참석 가능한 날짜입니다."}
                {method === "minimum-required" && `${requiredParticipants}명 이상 참석 가능한 날짜입니다.`}
                {method === "time-scheduling" && "참여 인원이 많은 순서로 정렬된 시간대입니다."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {method === "time-scheduling" ? (
                <div className="space-y-3">
                  {results.optimalSlots?.slice(0, 5).map((slot: any, index: number) => (
                    <div
                      key={`${slot.date}-${slot.time}`}
                      className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                    >
                      <div>
                        <span className="font-medium">
                          {format(parseISO(slot.date), "M월 d일 (eee)", { locale: ko })}
                        </span>
                        <span className="ml-2 text-sm text-muted-foreground">{slot.time}시</span>
                      </div>
                      <Badge variant="outline">{slot.count}명</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <Tabs defaultValue="main">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="main">
                      {method === "all-available"
                        ? "모두 가능"
                        : method === "max-available"
                          ? "최대 인원"
                          : "기준 인원"}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="main">
                    {method === "all-available" && (
                      <>
                        {results.allAvailable?.length > 0 ? (
                          <div className="space-y-2">
                            {results.allAvailable.map((date: string) => (
                              <div
                                key={date}
                                className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                              >
                                <span>{format(parseISO(date), "M월 d일 (eee)", { locale: ko })}</span>
                                <Badge variant="outline">{mockVoters.length}명</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">모두가 가능한 날짜가 없습니다.</p>
                        )}
                      </>
                    )}

                    {method === "max-available" && (
                      <>
                        {results.maxAvailableDate ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                              <div className="flex items-center gap-2">
                                <Crown className="h-4 w-4 text-yellow-600" />
                                <span className="font-medium">
                                  {format(parseISO(results.maxAvailableDate), "M월 d일 (eee)", { locale: ko })}
                                </span>
                              </div>
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                {dateAvailability[results.maxAvailableDate]?.count}명 (
                                {getParticipationRate(dateAvailability[results.maxAvailableDate]?.count || 0)})
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p className="font-medium mb-1">참여자:</p>
                              <p>{dateAvailability[results.maxAvailableDate]?.voters.join(", ")}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">참여 가능한 날짜가 없습니다.</p>
                        )}
                      </>
                    )}

                    {method === "minimum-required" && (
                      <>
                        {results.requiredAvailable?.length > 0 ? (
                          <div className="space-y-2">
                            {results.requiredAvailable.map((date: string) => (
                              <div
                                key={date}
                                className="flex justify-between items-center p-2 bg-secondary/50 rounded-md"
                              >
                                <span>{format(parseISO(date), "M월 d일 (eee)", { locale: ko })}</span>
                                <Badge variant="outline">{dateAvailability[date]?.count}명</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-center py-4">
                            기준 인원을 만족하는 날짜가 없습니다.
                          </p>
                        )}
                      </>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>투표자 리스트</CardTitle>
              <CardDescription>총 {voters.length}명이 투표했습니다.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {voters.map((voter: any) => (
                  <li key={voter.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {voter.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{voter.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {method === "time-scheduling"
                          ? `${voter.selections?.length || 0}개 날짜 선택`
                          : method === "recurring"
                            ? `${voter.weekdays?.length || 0}개 요일 선택`
                            : `${voter.dates?.length || 0}개 날짜 선택`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Voter Detail Modal for max-available method */}
      {method === "max-available" && (
        <Dialog open={isVoterDetailOpen} onOpenChange={setIsVoterDetailOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>날짜별 상세 투표 결과</DialogTitle>
              <DialogDescription>
                {selectedDate && format(parseISO(selectedDate), "M월 d일 (eee)", { locale: ko })}의 투표 상세 정보
              </DialogDescription>
            </DialogHeader>

            {selectedDate && dateAvailability[selectedDate] && (
              <div className="py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-green-900">총 참여 인원</h3>
                      <p className="text-2xl font-bold text-green-700">{dateAvailability[selectedDate].count}명</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600">참여율</p>
                      <p className="text-lg font-semibold text-green-700">
                        {getParticipationRate(dateAvailability[selectedDate].count)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">참여자 목록</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {dateAvailability[selectedDate].voters.map((voterName, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {voterName.substring(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{voterName}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">불참자</h4>
                    <div className="text-sm text-muted-foreground">
                      {mockVoters
                        .filter((voter) => !dateAvailability[selectedDate].voters.includes(voter.name))
                        .map((voter) => voter.name)
                        .join(", ") || "없음"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Time Detail Modal for time-scheduling method */}
      {method === "time-scheduling" && (
        <Dialog open={isTimeDetailOpen} onOpenChange={setIsTimeDetailOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>시간별 참여 가능 인원</DialogTitle>
              <DialogDescription>
                {selectedDate && format(parseISO(selectedDate), "M월 d일 (eee)", { locale: ko })}의 시간별 상세 정보
              </DialogDescription>
            </DialogHeader>

            {selectedDate && availability[selectedDate] && (
              <div className="py-4">
                <div className="grid grid-cols-12 gap-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const timeData = (availability[selectedDate] as any)[hour]
                    const count = timeData?.count || 0
                    const maxTimeCount = Math.max(
                      ...Object.values(availability[selectedDate] as any).map((t: any) => t.count),
                    )

                    return (
                      <TooltipProvider key={hour}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-12 rounded-md flex flex-col items-center justify-center text-xs border-2 ${
                                count === 0
                                  ? "bg-gray-50 text-gray-400 border-gray-200"
                                  : count === maxTimeCount
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-primary/50 text-primary-foreground border-primary/50"
                              }`}
                            >
                              <span className="font-medium">{hour}시</span>
                              <span className="text-xs">{count}명</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {timeData ? (
                              <div>
                                <p className="font-medium">{hour}시</p>
                                <p>{count}명 참여 가능</p>
                                <p className="text-xs text-muted-foreground">{timeData.voters.join(", ")}</p>
                              </div>
                            ) : (
                              <p>{hour}시 - 참여 가능한 인원 없음</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  })}
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>
                    가장 진한 색상: 최대 참여 인원 (
                    {Math.max(...Object.values(availability[selectedDate] as any).map((t: any) => t.count))}명)
                  </p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
