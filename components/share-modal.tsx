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
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { shareToKakao } from "@/lib/kakao"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentData: any
}

export function ShareModal({ isOpen, onClose, appointmentData }: ShareModalProps) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

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

  const handleKakaoShare = () => {
    shareToKakao({
      title: appointmentData.title,
      description: "언제 만날지 투표해주세요!",
      linkUrl: voteUrl,
      imageUrl: `${window.location.origin}/api/og-image?title=${encodeURIComponent(appointmentData.title)}`,
    })
  }

  const getMethodName = (method: string) => {
    const methodNames: Record<string, string> = {
      "all-available": "모두 가능한 날",
      "max-available": "최대 다수 가능",
      "minimum-required": "기준 인원 이상 가능",
      "time-scheduling": "약속 시간정하기",
      recurring: "반복 일정 선택",
      "priority-voting": "우선순위 투표",
      "time-period": "시간대별 투표",
      "budget-consideration": "예산 고려 투표",
    }
    return methodNames[method] || method
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3 text-green-600">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            약속이 생성되었습니다!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 약속 정보 카드 - 모던하고 심플한 디자인 */}
          <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-sm">
            <CardContent className="p-6 space-y-4">
              {/* 제목과 방식 */}
              <div className="space-y-3">
                <h3 className="font-bold text-xl text-slate-800 leading-tight">{appointmentData.title}</h3>
                <Badge
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 text-sm font-medium"
                >
                  {getMethodName(appointmentData.method)}
                </Badge>
              </div>

              {/* 약속 세부 정보 */}
              <div className="space-y-3 pt-2">
                {appointmentData.start_date && appointmentData.end_date && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-200 rounded-lg">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">투표 기간</p>
                      <p className="text-sm font-semibold">
                        {appointmentData.start_date} ~ {appointmentData.end_date}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-slate-600">
                  <div className="p-1.5 bg-slate-200 rounded-lg">
                    <Users className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-500">기준 인원</p>
                    <p className="text-sm font-semibold">{appointmentData.required_participants}명</p>
                  </div>
                </div>

                {appointmentData.method === "recurring" && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-200 rounded-lg">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">주간 모임</p>
                      <p className="text-sm font-semibold">주 {appointmentData.weekly_meetings}회</p>
                    </div>
                  </div>
                )}

                {appointmentData.deadline && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <div className="p-1.5 bg-slate-200 rounded-lg">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-500">투표 마감</p>
                      <p className="text-sm font-semibold">{appointmentData.deadline}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* 결과 링크 공유 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              결과 확인 링크
            </Label>
            <div className="flex gap-2">
              <Input value={resultsUrl} readOnly className="flex-1 bg-slate-50 border-slate-200 text-sm" />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(resultsUrl, "결과")}
                className="shrink-0 hover:bg-slate-100"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 카카오톡 공유 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              카톡으로 한 번에 공유하기
            </Label>
            <Button
              onClick={handleKakaoShare}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-3 rounded-lg transition-colors"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              카카오톡으로 공유하기
            </Button>
          </div>

          {/* 바로가기 버튼들 */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-200">
            <Button
              onClick={() => window.open(voteUrl, "_blank")}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 py-3"
            >
              <ExternalLink className="h-4 w-4" />
              투표 페이지
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(resultsUrl, "_blank")}
              className="flex items-center gap-2 border-slate-300 hover:bg-slate-50 py-3"
            >
              <ExternalLink className="h-4 w-4" />
              결과 페이지
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
