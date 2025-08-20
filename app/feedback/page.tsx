"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Send, CheckCircle, Mailbox } from "lucide-react"
import { toast } from "sonner"
import { submitFeedback } from "@/lib/feedback"

export default function FeedbackPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [category, setCategory] = useState("")
    const [content, setContent] = useState("")

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const response = await submitFeedback(name, email, category, content)
            if (response.success) {
                setName("")
                setEmail("")
                setCategory("")
                setContent("")
                toast.success("건의사항이 전송되었습니다", {
                    description: "소중한 의견 감사합니다. 검토 후 반영하도록 하겠습니다.",
                })
            } else {
                toast.error("건의사항 전송 실패", {
                    description: "잠시 후 다시 시도해주세요.",
                })
            }
        } catch (error) {
            toast.error("건의사항 전송 실패", {
                description: "잠시 후 다시 시도해주세요.",
            })
        } finally {
            setIsSubmitting(false)
        }
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
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">이메일 (선택)</Label>
                                    <Input
                                        id="email"
                                        placeholder="답변을 받고 싶다면 입력해주세요"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category">카테고리</Label>
                                <Select
                                    value={category}
                                    onValueChange={(value) => setCategory(value)}
                                >
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
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
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