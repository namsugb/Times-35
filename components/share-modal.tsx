"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Copy, Share2, MessageCircle, ExternalLink, CheckCircle2 } from "lucide-react"
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
      url: voteUrl,
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
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            약속이 생성되었습니다!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 약속 정보 카드 */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{appointmentData.title}</h3>
                <Badge variant="secondary" className="mt-1">
                  {getMethodName(appointmentData.method)}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                {appointmentData.start_date && appointmentData.end_date && (
                  <p>
                    📅 투표 기간: {appointmentData.start_date} ~ {appointmentData.end_date}
                  </p>
                )}
                <p>👥 기준 인원: {appointmentData.required_participants}명</p>
                {appointmentData.method === "recurring" && <p>🔄 주간 모임: 주 {appointmentData.weekly_meetings}회</p>}
              </div>
            </CardContent>
          </Card>



          {/* 투표 링크 공유 */}
          <div className="text-sm text-muted-foreground space-y-1">
            친구들에게 공유하세요!
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">투표 링크</Label>
            <div className="flex gap-2">
              <Input value={voteUrl} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(voteUrl, "투표")}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 결과 링크 공유 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">결과 확인 링크</Label>
            <div className="flex gap-2">
              <Input value={resultsUrl} readOnly className="flex-1" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(resultsUrl, "결과")}>
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* 공유 버튼들 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">카톡으로 한 번에 공유하기</Label>
            <div className="grid grid-cols-2 gap-3 justify-center">
              <Button variant="outline" onClick={handleKakaoShare} className="flex items-center gap-2 bg-transparent bg-yellow-300">
                <MessageCircle className="h-4 w-4" />
                카카오톡
              </Button>
            </div>
          </div>

          {/* 바로가기 버튼들 */}
          <div className="grid grid-cols-2 gap-3 pt-4 border-t">
            <Button onClick={() => window.open(voteUrl, "_blank")} className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              투표 페이지
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(resultsUrl, "_blank")}
              className="flex items-center gap-2"
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
