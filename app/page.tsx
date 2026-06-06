"use client"

import { useEffect, useState } from "react"
import { addDays, format } from "date-fns"
import { Loader2, LockIcon, PhoneIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { DateRangePicker } from "@/components/date-range-picker"
import { Footer } from "@/components/footer"
import { ShareModal } from "@/components/share-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAppointment } from "@/lib/database"
import { methods } from "@/lib/type/appointmentMethods"

export default function AppointmentScheduler() {
  const t = useTranslations("home")
  const appT = useTranslations("app")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [appointmentName, setAppointmentName] = useState("")
  const [participantCount, setParticipantCount] = useState("5")
  const [creatorPhone, setCreatorPhone] = useState("")
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null)
  const [deadline] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setDateRange({
      from: new Date(),
      to: addDays(new Date(), 14),
    })
  }, [])

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    setIsCreateModalOpen(true)
  }

  const getMethodTitle = (methodId: string) => t(`methods.${methodId}.title`)
  const getMethodDescription = (methodId: string) => t(`methods.${methodId}.description`)

  const handleCreateAppointment = async () => {
    if (!selectedMethod || !appointmentName || !participantCount || !creatorPhone) {
      toast.error(t("requiredErrorTitle"), { description: t("requiredErrorDescription") })
      return
    }

    setIsCreating(true)

    try {
      const appointmentData = {
        title: appointmentName.trim(),
        method: selectedMethod as any,
        required_participants: Number.parseInt(participantCount) || 1,
        weekly_meetings: 1,
        start_date: dateRange ? format(dateRange.from, "yyyy-MM-dd") : null,
        end_date: dateRange ? format(dateRange.to, "yyyy-MM-dd") : null,
        deadline: deadline ? format(new Date(deadline), "yyyy-MM-dd HH:mm:ss") : null,
        is_public: true,
        status: "active" as const,
        creator_phone: creatorPhone.trim() || undefined,
      }

      const appointment = await createAppointment(appointmentData)
      setCreatedAppointment(appointment)
      setIsCreateModalOpen(false)
      setIsShareModalOpen(true)
    } catch (error: any) {
      console.error("Failed to create appointment:", error)
      toast.error("Error", {
        description: error.message || "Failed to create appointment.",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!isClient) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">{appT("name")}</h1>
          <p className="text-lg text-muted-foreground mobile-break">{appT("description")}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold md:text-4xl">{appT("name")}</h1>
        <p className="text-lg text-muted-foreground mobile-break">{appT("description")}</p>
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {methods.map((method) => (
            <Card
              key={method.id}
              className={`relative cursor-pointer transition-all duration-300 hover:border-primary hover:shadow-lg ${
                method.comingSoon ? "opacity-60" : ""
              }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              {method.comingSoon && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/20">
                  <div className="rounded-full bg-white/90 p-3 shadow-lg">
                    <LockIcon className="h-6 w-6 text-gray-600" />
                  </div>
                </div>
              )}
              <CardHeader className="pb-2 text-center">
                <div className="flex justify-center">
                  <method.icon className="mb-2 h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">{getMethodTitle(method.id)}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-sm">
                  {getMethodDescription(method.id)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-[400px] overflow-y-auto">
          <DialogHeader className="space-y-3 px-6">
            <DialogTitle className="flex items-center justify-center gap-2 text-xl font-semibold">
              {selectedMethod && getMethodTitle(selectedMethod)}
            </DialogTitle>
            <DialogDescription>{t("createInfo")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="appointment-name" className="text-sm font-medium">
                {t("appointmentName")}
              </Label>
              <Input
                id="appointment-name"
                className="w-full"
                value={appointmentName}
                onChange={(event) => setAppointmentName(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant-count" className="text-sm font-medium">
                {selectedMethod === "minimum-required" ? t("requiredCount") : t("participantCount")}
              </Label>
              <Input
                id="participant-count"
                type="number"
                min="2"
                className="w-full"
                value={participantCount}
                onChange={(event) => setParticipantCount(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="creator-phone" className="flex items-center gap-2 text-sm font-medium">
                <PhoneIcon className="h-4 w-4" />
                {t("contact")}
              </Label>
              <Input
                id="creator-phone"
                type="tel"
                className="w-full"
                value={creatorPhone}
                onChange={(event) => setCreatorPhone(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">{t("contactHelp")}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("dateRange")}</Label>
              <div className="flex items-center justify-center">
                {dateRange && (
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    className="w-full"
                  />
                )}
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="w-full py-6 text-base font-medium"
                size="lg"
                onClick={handleCreateAppointment}
                disabled={isCreating || !appointmentName || !participantCount || !dateRange?.from || !dateRange?.to}
              >
                {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isCreating ? t("creating") : t("create")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {createdAppointment && (
        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          appointmentData={createdAppointment}
        />
      )}

      <Footer />
    </div>
  )
}
