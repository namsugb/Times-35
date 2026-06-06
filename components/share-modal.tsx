"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Copy, Loader2, MessageCircle, Send, Share2, Users, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"
import { GroupSelectModal } from "@/components/group-select-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser, getUserName, supabaseAuth } from "@/lib/auth"
import { shareToKakao } from "@/lib/kakao"
import { getLocalePrefix } from "@/lib/locale-date"
import type { Appointment } from "@/lib/types/appointment"

interface InviteMember {
  name: string
  phone: string
}

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentData: Appointment
}

export function ShareModal({ isOpen, onClose, appointmentData }: ShareModalProps) {
  const t = useTranslations("share")
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [isKakaoSharing, setIsKakaoSharing] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false)
  const [inviteMembers, setInviteMembers] = useState<InviteMember[]>([])
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      setIsLoggedIn(Boolean(user))
    }

    if (isOpen) {
      checkAuth()
      setInviteMembers([])
    }
  }, [isOpen])

  const urls = useMemo(() => {
    if (typeof window === "undefined") {
      return { voteUrl: "", resultsUrl: "" }
    }

    const localePrefix = getLocalePrefix(window.location.pathname, locale)
    const origin = window.location.origin

    return {
      voteUrl: `${origin}${localePrefix}/vote/${appointmentData.share_token}`,
      resultsUrl: `${origin}${localePrefix}/results/${appointmentData.share_token}`,
    }
  }, [appointmentData.share_token, locale])

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(t("copySuccess", { type }))
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t("copyFailed"))
    }
  }

  const getShareImageUrl = (appointment: Appointment) => {
    if (typeof window === "undefined") return "/logo.png"
    return `${window.location.origin}/logo.png`
  }

  const handleKakaoShare = async () => {
    setIsKakaoSharing(true)
    try {
      await shareToKakao({
        title: appointmentData.title,
        description: t("kakaoDescription", { title: appointmentData.title }),
        voteUrl: urls.voteUrl,
        resultsUrl: urls.resultsUrl,
        imageUrl: getShareImageUrl(appointmentData),
      })

      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        toast.success(t("kakaoSuccess"))
      }
    } catch (error) {
      console.error("Failed to share to Kakao:", error)
      toast.error(t("kakaoFailed"))
    } finally {
      setIsKakaoSharing(false)
    }
  }

  const handleSendInvite = async () => {
    if (inviteMembers.length === 0) return

    setIsSendingInvite(true)
    try {
      const {
        data: { session },
      } = await supabaseAuth.auth.getSession()
      const user = await getCurrentUser()
      const response = await fetch("/api/notifications/kakao/send_invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          appointmentId: appointmentData.id,
          appointmentTitle: appointmentData.title,
          shareToken: appointmentData.share_token,
          members: inviteMembers,
          invitorName: getUserName(user) || "",
          voteUrl: urls.voteUrl,
          resultsUrl: urls.resultsUrl,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.results?.[0]?.error || result?.error || "Failed to send invite")
      }

      if (result?.failedCount > 0) {
        toast.error(`${result.successCount ?? 0}명 성공, ${result.failedCount}명 실패`)
      } else {
        toast.success(t("inviteSent"))
        setInviteMembers([])
      }
    } catch (error) {
      console.error("Failed to send invite:", error)
      toast.error(t("inviteFailed"))
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-green-600">
            <div className="rounded-full bg-green-100 p-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            {t("createdTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="py-2 text-center">
            <p className="font-medium text-slate-600">{t("guide")}</p>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Share2 className="h-4 w-4" />
              {t("voteLink")}
            </Label>
            <Button
              id="kakao-share-btn"
              onClick={handleKakaoShare}
              disabled={isKakaoSharing}
              className="w-full rounded-lg bg-yellow-400 py-3 font-semibold text-yellow-900 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isKakaoSharing ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <MessageCircle className="mr-2 h-5 w-5" />
              )}
              {isKakaoSharing ? t("sharing") : t("kakaoShare")}
            </Button>
            <div className="flex gap-2">
              <Input value={urls.voteUrl} readOnly className="flex-1 border-slate-200 bg-slate-50 text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(urls.voteUrl, t("vote"))}
                className="shrink-0 hover:bg-slate-100"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {isLoggedIn && (
            <div className="space-y-3 border-t pt-2">
              <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Users className="h-4 w-4" />
                {t("sendToGroup")}
              </Label>

              <Button variant="outline" onClick={() => setIsGroupSelectOpen(true)} className="w-full">
                <Users className="mr-2 h-4 w-4" />
                {t("selectGroupMembers")}
              </Button>

              {inviteMembers.length > 0 && (
                <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{t("selectedMembers")}</span>
                    <span className="text-xs text-muted-foreground">{inviteMembers.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inviteMembers.map((member, index) => (
                      <Badge key={`${member.phone}-${index}`} variant="secondary" className="flex items-center gap-1 pr-1 text-xs">
                        {member.name}
                        <button
                          type="button"
                          onClick={() => setInviteMembers(inviteMembers.filter((_, itemIndex) => itemIndex !== index))}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button onClick={handleSendInvite} disabled={isSendingInvite} className="mt-2 w-full" size="sm">
                    {isSendingInvite ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="mr-2 h-4 w-4" />
                    )}
                    {isSendingInvite ? t("sendingInvite") : t("sendInvite", { count: inviteMembers.length })}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <GroupSelectModal
          open={isGroupSelectOpen}
          onOpenChange={setIsGroupSelectOpen}
          onSelect={(members) => {
            const existingPhones = new Set(inviteMembers.map((member) => member.phone))
            const newMembers = members.filter((member) => !existingPhones.has(member.phone))
            setInviteMembers([...inviteMembers, ...newMembers])
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
