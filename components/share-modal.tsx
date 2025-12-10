"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Copy,
  Share2,
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Users,
  RotateCcw,
  Clock,
  Loader2,
  X,
  Send,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shareToKakao } from "@/lib/kakao"
import { Appointment } from "@/lib/types/appointment"
import { GroupSelectModal } from "@/components/group-select-modal"
import { getCurrentUser, supabaseAuth } from "@/lib/auth"

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
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isKakaoSharing, setIsKakaoSharing] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isGroupSelectOpen, setIsGroupSelectOpen] = useState(false)
  const [inviteMembers, setInviteMembers] = useState<InviteMember[]>([])
  const [isSendingInvite, setIsSendingInvite] = useState(false)

  // 로그인 상태 확인
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser()
      setIsLoggedIn(!!user)
    }
    if (isOpen) {
      checkAuth()
      setInviteMembers([]) // 모달 열릴 때 초기화
    }
  }, [isOpen])

  const voteUrl = `${window.location.origin}/vote/${appointmentData.share_token}`
  const resultsUrl = `${window.location.origin}/results/${appointmentData.share_token}`

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({
        title: "복사 완료!",
        description: `${type} 링크가 클립보드에 복사되었습니다.`,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "복사 실패",
        description: "링크 복사에 실패했습니다.",
        variant: "destructive",
      })
    }
  }

  const choseAdd = (appointment: Appointment) => {
    const baseUrl = window.location.origin
    const imageMap: Record<string, string> = {
      "회식": "food.jpg",
      "쇼핑": "shopping.jpg",
      "영화": "movie.jpg",
      "음악": "music.jpg",
      "책": "book.jpg",
    }

    // 키워드 매칭
    for (const [keyword, filename] of Object.entries(imageMap)) {
      if (appointment.title.includes(keyword)) {
        return `${baseUrl}/add/${filename}`
      }
    }

    // 기본 이미지
    return `${baseUrl}/logo.png`
  }

  const handleKakaoShare = async () => {
    setIsKakaoSharing(true)
    try {
      await shareToKakao({
        title: appointmentData.title,
        description: `${appointmentData.title} 투표에 참여해주세요!`,
        voteUrl: voteUrl,
        resultsUrl: resultsUrl,
        imageUrl: choseAdd(appointmentData),
      })

      // 성공 시 토스트 메시지 (모바일에서만 표시)
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile) {
        toast({
          title: "카카오톡 공유 완료!",
          description: "카카오톡 앱에서 공유가 진행됩니다.",
        })
      }
    } catch (error) {
      console.error("카카오 공유 에러:", error)
      toast({
        title: "공유 실패",
        description: "카카오톡 공유에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsKakaoSharing(false)
    }
  }

  // 그룹 멤버에게 알림톡 발송
  const handleSendInvite = async () => {
    if (inviteMembers.length === 0) return

    setIsSendingInvite(true)
    try {
      const { data: { session } } = await supabaseAuth.auth.getSession()
      const response = await fetch("/api/notifications/kakao/send_invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { "Authorization": `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          appointmentId: appointmentData.id,
          appointmentTitle: appointmentData.title,
          shareToken: appointmentData.share_token,
          members: inviteMembers,
        }),
      })

      if (!response.ok) {
        throw new Error("알림톡 발송 실패")
      }

      toast({
        title: "알림톡 발송 완료!",
        description: `${inviteMembers.length}명에게 알림톡을 발송했습니다.`,
      })
      setInviteMembers([]) // 발송 후 초기화
    } catch (err) {
      console.error("알림톡 발송 오류:", err)
      toast({
        title: "발송 실패",
        description: "알림톡 발송에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive",
      })
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="text-2xl font-bold flex justify-center items-center gap-3 text-green-600">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            약속이 생성되었습니다!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 공유 안내 */}
          <div className="text-center py-2">
            <p className="text-slate-600 font-medium">친구들에게 공유해서 투표를 받아보세요!</p>
          </div>

          {/* 투표 링크 공유 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              투표 링크
            </Label>
            <Button
              id="kakao-share-btn"
              onClick={handleKakaoShare}
              disabled={isKakaoSharing}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isKakaoSharing ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5 mr-2" />
              )}
              {isKakaoSharing ? "공유 중..." : "카카오톡으로 공유하기"}
            </Button>
            <div className="flex gap-2">
              <Input value={voteUrl} readOnly className="flex-1 bg-slate-50 border-slate-200 text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(voteUrl, "투표")}
                className="shrink-0 hover:bg-slate-100"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 그룹 멤버 초대 (로그인 사용자만) */}
          {isLoggedIn && (
            <div className="space-y-3 pt-2 border-t">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4" />
                그룹 멤버에게 알림톡 보내기
              </Label>

              <Button
                variant="outline"
                onClick={() => setIsGroupSelectOpen(true)}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                그룹에서 멤버 선택
              </Button>

              {/* 선택된 그룹 멤버 표시 */}
              {inviteMembers.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">선택된 멤버</span>
                    <span className="text-xs text-muted-foreground">{inviteMembers.length}명</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {inviteMembers.map((member, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1 pr-1 text-xs"
                      >
                        {member.name}
                        <button
                          type="button"
                          onClick={() => setInviteMembers(inviteMembers.filter((_, i) => i !== index))}
                          className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    onClick={handleSendInvite}
                    disabled={isSendingInvite}
                    className="w-full mt-2"
                    size="sm"
                  >
                    {isSendingInvite ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {isSendingInvite ? "발송 중..." : `${inviteMembers.length}명에게 알림톡 보내기`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 그룹 선택 모달 */}
        <GroupSelectModal
          open={isGroupSelectOpen}
          onOpenChange={setIsGroupSelectOpen}
          onSelect={(members) => {
            // 기존 멤버와 중복 제거하여 추가
            const existingPhones = new Set(inviteMembers.map((m) => m.phone))
            const newMembers = members.filter((m) => !existingPhones.has(m.phone))
            setInviteMembers([...inviteMembers, ...newMembers])
          }}
        />
      </DialogContent>
    </Dialog>
  )
}