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
                    여러 사람과 약속을 잡을 때 가장 적합한 날짜와 시간을 찾는 서비스입니다.
                </p>
            </div>
            <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-blue-500" />
                                약속 만들기
                            </CardTitle>
                            <CardDescription>
                                새로운 약속을 생성하는 방법을 알아보세요.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. 약속 정보 입력</h4>
                                <p className="text-sm text-muted-foreground">
                                    약속 제목, 설명, 기간을 입력합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">2. 가능한 날짜 선택</h4>
                                <p className="text-sm text-muted-foreground">
                                    참여자들이 투표할 수 있는 날짜들을 선택합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">3. 연락처 정보 입력</h4>
                                <p className="text-sm text-muted-foreground">
                                    카카오톡 알림을 받을 연락처를 입력합니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-green-500" />
                                참여하기
                            </CardTitle>
                            <CardDescription>
                                다른 사람이 만든 약속에 참여하는 방법입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. 링크 접속</h4>
                                <p className="text-sm text-muted-foreground">
                                    약속 생성자가 공유한 링크로 접속합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">2. 이름 입력</h4>
                                <p className="text-sm text-muted-foreground">
                                    본인의 이름을 입력합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">3. 가능한 날짜 선택</h4>
                                <p className="text-sm text-muted-foreground">
                                    본인이 가능한 날짜들을 선택하여 투표합니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-orange-500" />
                                결과 확인
                            </CardTitle>
                            <CardDescription>
                                모든 투표가 완료된 후 결과를 확인하는 방법입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. 자동 알림</h4>
                                <p className="text-sm text-muted-foreground">
                                    모든 참여자가 투표를 완료하면 카카오톡으로 알림이 갑니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">2. 결과 페이지</h4>
                                <p className="text-sm text-muted-foreground">
                                    가장 많은 표를 받은 날짜가 최종 약속 날짜로 제안됩니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">3. 참여자 현황</h4>
                                <p className="text-sm text-muted-foreground">
                                    누가 어떤 날짜에 투표했는지 확인할 수 있습니다.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Share2 className="h-5 w-5 text-purple-500" />
                                공유하기
                            </CardTitle>
                            <CardDescription>
                                약속을 다른 사람들과 공유하는 방법입니다.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="space-y-2">
                                <h4 className="font-medium">1. 링크 복사</h4>
                                <p className="text-sm text-muted-foreground">
                                    약속 생성 후 나오는 링크를 복사합니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">2. 카카오톡 공유</h4>
                                <p className="text-sm text-muted-foreground">
                                    카카오톡 버튼을 눌러 직접 공유할 수 있습니다.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">3. QR 코드</h4>
                                <p className="text-sm text-muted-foreground">
                                    QR 코드를 통해서도 약속을 공유할 수 있습니다.
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
                        <div className="space-y-2">
                            <h4 className="font-medium">Q. 약속 기간이 지나면 어떻게 되나요?</h4>
                            <p className="text-sm text-muted-foreground">
                                A. 약속 기간이 지나면 자동으로 투표가 마감되고 결과가 확정됩니다.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}