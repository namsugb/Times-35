"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, CheckCircle, Mailbox } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FeedbackPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const { toast } = useToast()

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        // 실제 구현에서는 여기서 API 호출을 할 것입니다.
        // 지금은 시뮬레이션을 위해 setTimeout을 사용합니다.
        setTimeout(() => {
            setIsSubmitting(false)
            setIsSubmitted(true)
            toast({
                title: "건의사항이 전송되었습니다",
                description: "소중한 의견 감사합니다. 검토 후 반영하도록 하겠습니다.",
            })
        }, 1000)
    }

    if (isSubmitted) {
        return (
            <div className="max-w-2xl mx-auto">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                        <CheckCircle className="h-16 w-16 text-green-500" />
                        <h2 className="text-2xl font-bold">건의사항이 전송되었습니다</h2>
                        <p className="text-muted-foreground">
                            소중한 의견 감사합니다. 검토 후 서비스 개선에 반영하도록 하겠습니다.
                        </p>
                        <Button onClick={() => setIsSubmitted(false)} variant="outline">
                            새 건의사항 작성하기
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="p-6 mb-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Mailbox className="h-8 w-8 text-blue-500" />
                    건의함
                </h1>
                <p className="text-sm mt-2 text-muted-foreground">
                    만날래말래 서비스를 더 좋게 만들기 위한 여러분의 의견을 들려주세요.
                </p>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>건의사항 작성</CardTitle>
                        <CardDescription>
                            버그 신고, 기능 제안, 개선 요청 등 어떤 의견이든 환영합니다.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">이름 (선택)</Label>
                                    <Input
                                        id="name"
                                        placeholder="익명으로 제출하려면 비워두세요"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact">연락처 (선택)</Label>
                                    <Input
                                        id="contact"
                                        placeholder="답변을 받고 싶다면 입력해주세요"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">카테고리</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="건의사항 유형을 선택해주세요" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bug">버그 신고</SelectItem>
                                        <SelectItem value="feature">새 기능 제안</SelectItem>
                                        <SelectItem value="improvement">기존 기능 개선</SelectItem>
                                        <SelectItem value="ui">UI/UX 개선</SelectItem>
                                        <SelectItem value="other">기타</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">건의사항 *</Label>
                                <Textarea
                                    id="message"
                                    placeholder="자세한 내용을 작성해주세요. 버그의 경우 언제, 어떤 상황에서 발생했는지 구체적으로 적어주시면 도움이 됩니다."
                                    rows={6}
                                    required
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                        전송 중...
                                    </>
                                ) : (
                                    <>
                                        <Send className="h-4 w-4 mr-2" />
                                        건의사항 전송
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>건의사항 가이드</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-green-600">🐛 버그 신고</h4>
                            <p className="text-sm text-muted-foreground">
                                • 어떤 상황에서 발생했는지<br />
                                • 예상했던 결과와 실제 결과<br />
                                • 사용하신 기기 및 브라우저 정보
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-blue-600">💡 새 기능 제안</h4>
                            <p className="text-sm text-muted-foreground">
                                • 어떤 기능이 필요한지<br />
                                • 왜 그 기능이 필요한지<br />
                                • 어떻게 작동했으면 좋겠는지
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-purple-600">⚡ 기능 개선</h4>
                            <p className="text-sm text-muted-foreground">
                                • 현재 어떤 점이 불편한지<br />
                                • 어떻게 개선되었으면 좋겠는지<br />
                                • 구체적인 개선 방향 제안
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
