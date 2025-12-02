import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CalendarDays, Users, Clock, Share2, BookOpen } from "lucide-react"

export default function GuidePage() {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="p-6 mb-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <BookOpen className="h-8 w-8 text-blue-500" />
                    만날래말래 설명서
                </h1>
                <p className="text-sm mt-2 text-muted-foreground">
                    만날래 말래는 약속 종류에 따라 다양한 계산 방식과 ui를 제공합니다.
                </p>
            </div>
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-blue-500" />
                                모두
                            </CardTitle>
                            <CardDescription>
                                모두가 가능한 날을 찾을 때 사용하는 방식입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">투표완료</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 약속 생성시 설정한 인원 수 만큼의 인원이 투표에 참여하면 투표가 완료됩니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">추천 상황</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 모두가 참여 해야하는 약속<br />
                                    • 동아리 모임<br />
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-500" />
                                최대
                            </CardTitle>
                            <CardDescription>
                                가장 많은 인원이 가능한 날을 찾을 때 사용하는 방식입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">투표완료</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 약속 생성시 설정한 인원 수 만큼의 인원이 투표에 참여하면 투표가 완료됩니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">추천 상황</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 모두가 참석해야하는건 아니지만 최대한 많으면 좋은 약속<br />
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                기준
                            </CardTitle>
                            <CardDescription>
                                특정 인원이 모일 수 있는 날을 찾을 때 사용하는 방식입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">투표완료</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 약속 생성시 설정한 인원 수 만큼이 모일 수 있는 날이 생기면 투표가 완료됩니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">추천 상황</h4>
                                <p className="text-sm text-muted-foreground">
                                    • 풋살 약속(12명이 모일 수 있는 날 찾기)<br />
                                </p>
                            </div>
                        </CardContent>
                    </Card>


                </div>

                <Separator />

                <Card>
                    <CardHeader>
                        <CardTitle>자주 묻는 질문</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium">Q. 투표는 익명인가요?</h4>
                            <p className="text-sm text-muted-foreground">
                                A. 아니요, 누가 어떤 날짜에 투표했는지 모든 참여자가 확인할 수 있습니다.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Q. 투표를 수정할 수 있나요?</h4>
                            <p className="text-sm text-muted-foreground">
                                A. 네, 같은 이름으로 다시 투표하면 이전 투표가 덮어씌워집니다.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium">Q. 카카오톡 알림은 필수인가요?</h4>
                            <p className="text-sm text-muted-foreground">
                                A. 아니요, 선택사항입니다. 하지만 알림을 받으시면 결과를 더 빠르게 확인할 수 있습니다.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}