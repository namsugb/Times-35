"use client"

import { useEffect, useState } from "react"
import { AlertCircle, Calendar, Clock, Timer, Users } from "lucide-react"
import { useTranslations } from "next-intl"
import { useParams, usePathname, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getAppointmentByToken, getDateVoteResults, getTimeVoteResults, getVoters } from "@/lib/database"
import { getLocalePrefix } from "@/lib/locale-date"
import { ResultsDateBased } from "./components/ResultsDateBased"
import { ResultsTimeScheduling } from "./components/ResultsTimeScheduling"

export default function ResultsPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const t = useTranslations("results")
  const commonT = useTranslations("common")
  const voteT = useTranslations("vote")
  const tokenParam = params.token
  const token = Array.isArray(tokenParam)
    ? tokenParam[0]
    : tokenParam || pathname.split("/").filter(Boolean).at(-1) || ""
  const localePrefix = getLocalePrefix(pathname)

  const [appointment, setAppointment] = useState<any>(null)
  const [dateResults, setDateResults] = useState<any>({})
  const [timeResults, setTimeResults] = useState<any[]>([])
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [token])

  const loadResults = async () => {
    try {
      setLoading(true)
      const appointmentData = await getAppointmentByToken(token)
      if (!appointmentData) {
        setError(t("notFound"))
        return
      }

      setAppointment(appointmentData)

      const votersData = await getVoters(appointmentData.id)
      setVoters(votersData)

      if (appointmentData.method === "time-scheduling") {
        const timeData = await getTimeVoteResults(appointmentData.id)
        setTimeResults(timeData)
      } else {
        const dateData = await getDateVoteResults(appointmentData.id)
        setDateResults(dateData)
      }
    } catch (err: any) {
      console.error("Failed to load results:", err)
      setError(err.message || t("loadFailed"))
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "all-available":
        return <Calendar className="h-5 w-5" />
      case "max-available":
        return <Users className="h-5 w-5" />
      case "minimum-required":
        return <Clock className="h-5 w-5" />
      case "time-scheduling":
        return <Timer className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold">{commonT("error")}</h2>
            <p className="mb-4 text-muted-foreground">{error}</p>
            <Button onClick={() => router.push(localePrefix)} variant="outline">
              {commonT("backHome")}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!appointment) return null

  const ResultsHeader = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {getMethodIcon(appointment.method)}
          <div className="flex min-w-0">
            <CardTitle className="mr-3 truncate text-xl sm:text-2xl">{appointment.title}</CardTitle>
            <Badge variant="secondary">{voteT(`methodNames.${appointment.method}`)}</Badge>
          </div>
        </div>
      </CardHeader>
    </Card>
  )

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="space-y-6">
        <ResultsHeader />
        {appointment.method === "time-scheduling" ? (
          <ResultsTimeScheduling
            appointment={appointment}
            timeResults={timeResults}
            voters={voters}
            token={token}
            localePrefix={localePrefix}
          />
        ) : (
          <ResultsDateBased
            appointment={appointment}
            dateResults={dateResults}
            voters={voters}
            token={token}
            localePrefix={localePrefix}
          />
        )}
      </div>
    </div>
  )
}
