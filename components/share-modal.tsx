"use client"

import { useState } from "react"
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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shareToKakao } from "@/lib/kakao"
import { Appointment } from "@/lib/types/appointment"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentData: Appointment
}

export function ShareModal({ isOpen, onClose, appointmentData }: ShareModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [isKakaoSharing, setIsKakaoSharing] = useState(false)

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

        </div>
      </DialogContent>
    </Dialog>
  )
}