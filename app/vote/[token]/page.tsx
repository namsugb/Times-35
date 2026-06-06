"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { AlertCircle, Calendar, Clock, Repeat, Timer, Users } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useParams, usePathname, useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  addNotificationToQueue,
  createDateVotes,
  createTimeVotes,
  createVoter,
  getAppointmentByToken,
  getVoters,
  updateDateVotes,
  updateTimeVotes,
} from "@/lib/database"
import { getCurrentUser } from "@/lib/auth"
import { getDateFnsLocale, getLocalePrefix } from "@/lib/locale-date"
import { checkVotingCompletion, type VotingCompletionResult } from "@/lib/vote/checkcomplete"
import { VoteDateBased } from "./components/VoteDateBased"
import { VoteTimeScheduling } from "./components/VoteTimeScheduling"

interface DateTimeSelection {
  date: string
  times: string[]
}

export default function VotePage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const t = useTranslations("vote")
  const commonT = useTranslations("common")
  const locale = useLocale()
  const dateLocale = getDateFnsLocale(locale)
  const localePrefix = getLocalePrefix(pathname, locale)
  const tokenParam = params.token
  const token = Array.isArray(tokenParam)
    ? tokenParam[0]
    : tokenParam || pathname.split("/").filter(Boolean).at(-1) || ""

  const [appointment, setAppointment] = useState<any>(null)
  const [voters, setVoters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState(false)
  const [showVotingCompleteModal, setShowVotingCompleteModal] = useState(false)
  const [isVotingComplete, setIsVotingComplete] = useState<VotingCompletionResult | null>(null)

  useEffect(() => {
    if (token) {
      loadAppointment()
    }

    const checkAuth = async () => {
      const user = await getCurrentUser()
      setCurrentUser(user)
    }
    checkAuth()
  }, [token])

  useEffect(() => {
    const checkVotingStatus = async () => {
      if (appointment && !loading) {
        try {
          const completion = await checkVotingCompletion(appointment.id)
          setIsVotingComplete(completion)
          if (completion.isComplete && appointment.method !== "minimum-required") {
            setShowVotingCompleteModal(true)
          }
        } catch (err) {
          console.error("Failed to check voting completion:", err)
        }
      }
    }

    checkVotingStatus()
  }, [appointment, loading])

  const loadAppointment = async () => {
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
    } catch (err: any) {
      console.error("Failed to load appointment:", err)
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
      case "recurring":
        return <Repeat className="h-5 w-5" />
      default:
        return <Calendar className="h-5 w-5" />
    }
  }

  const getMethodName = (method: string) => t(`methodNames.${method}`)

  const isFirstVote = (voterName: string) => {
    return !voters.some((voter) => voter.name === voterName)
  }

  const handleNameChange = (value: string) => {
    setName(value)
    setNameError(false)
  }

  const handleSubmit = async (
    event: React.FormEvent,
    data: Date[] | string[] | DateTimeSelection[]
  ) => {
    event.preventDefault()

    if (!name.trim()) {
      setNameError(true)
      return
    }

    setSubmitting(true)

    try {
      const isNewVoter = isFirstVote(name.trim())

      if (isVotingComplete?.isComplete && appointment.method !== "minimum-required" && isNewVoter) {
        setShowVotingCompleteModal(true)
        setSubmitting(false)
        return
      }

      const voter = await createVoter(appointment.id, name.trim(), currentUser?.id)
      const existingVoter = voters.find((item) => item.name === name.trim())
      const actualVoterId = existingVoter ? existingVoter.id : voter.id

      if (!voter) {
        throw new Error(t("submitFailedDescription"))
      }

      if (appointment.method === "time-scheduling") {
        const selectedDateTimes = data as DateTimeSelection[]
        if (isNewVoter) {
          await createTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        } else {
          await updateTimeVotes(actualVoterId, appointment.id, selectedDateTimes)
        }
      } else {
        const selectedDates = data as Date[]
        const dateStrings = selectedDates.map((date) => format(date, "yyyy-MM-dd"))
        if (isNewVoter) {
          await createDateVotes(actualVoterId, appointment.id, dateStrings)
        } else {
          await updateDateVotes(actualVoterId, appointment.id, dateStrings)
        }
      }

      const completionAfterSubmit = await checkVotingCompletion(appointment.id)

      if (completionAfterSubmit.isComplete && appointment.creator_phone) {
        await addNotificationToQueue(appointment.id, appointment.creator_phone)
        await fetch("/api/notifications/kakao/send_complete", {
          method: "POST",
          body: JSON.stringify({
            appointmentId: appointment.id,
            phoneNumber: appointment.creator_phone,
            appointmentTitle: appointment.title,
            resultsUrl: `${localePrefix}/results/${token}`,
          }),
        })
      }

      router.push(`${localePrefix}/results/${token}?refresh=${Date.now()}`)
    } catch (err: any) {
      console.error("Failed to submit vote:", err)
      toast({
        title: t("submitFailed"),
        description: err.message || t("submitFailedDescription"),
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="space-y-4 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p className="text-sm text-muted-foreground">{t("loading")}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
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

  const startLabel = format(parseISO(appointment.start_date), "MMM d", { locale: dateLocale })
  const endLabel = format(parseISO(appointment.end_date), "MMM d", { locale: dateLocale })

  const VoteHeader = () => (
    <CardHeader className="text-center">
      <div className="mb-2 flex items-center justify-center gap-2">
        {getMethodIcon(appointment.method)}
        <CardTitle className="text-xl sm:text-2xl">{appointment.title}</CardTitle>
      </div>
      <CardDescription>
        <Badge variant="secondary" className="mb-2">
          {getMethodName(appointment.method)}
        </Badge>
        <br />
        {appointment.method === "time-scheduling" ? t("timeInstruction") : t("dateInstruction")}
        <br />
        <span className="mt-1 text-sm text-muted-foreground">
          {t("dateRange", { start: startLabel, end: endLabel })}
        </span>
        {appointment.method === "time-scheduling" && (
          <span className="mt-1 block text-sm text-primary">{t("clickDateForTime")}</span>
        )}
      </CardDescription>
    </CardHeader>
  )

  const VotingCompleteModal = () => (
    <Dialog open={showVotingCompleteModal} onOpenChange={setShowVotingCompleteModal}>
      <DialogContent className="mx-auto w-[90vw] max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-center">{t("completeTitle")}</DialogTitle>
          <DialogDescription className="text-center">
            {t("completeDescription")}
            <br />
            <span className="text-sm text-muted-foreground">{t("completeHint")}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 text-center">
          <div className="flex justify-center gap-2">
            <Button
              onClick={() => {
                setShowVotingCompleteModal(false)
                router.push(`${localePrefix}/results/${token}`)
              }}
              className="flex-1"
            >
              {t("viewResults")}
            </Button>
            <Button variant="outline" onClick={() => setShowVotingCompleteModal(false)} className="flex-1">
              {commonT("close")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )

  const renderVoteComponent = () => {
    if (appointment.method === "time-scheduling") {
      return (
        <VoteTimeScheduling
          appointment={appointment}
          name={name}
          nameError={nameError}
          submitting={submitting}
          onNameChange={handleNameChange}
          onSubmit={handleSubmit}
        />
      )
    }

    return (
      <VoteDateBased
        appointment={appointment}
        name={name}
        nameError={nameError}
        submitting={submitting}
        onNameChange={handleNameChange}
        onSubmit={handleSubmit}
      />
    )
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <VoteHeader />
        <CardContent>{renderVoteComponent()}</CardContent>
      </Card>
      <VotingCompleteModal />
    </div>
  )
}
