import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function TermsPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="p-6 mb-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-500" />
                    이용약관
                </h1>
                <p className="text-sm mt-2 text-muted-foreground">
                    만날래말래 서비스 이용약관입니다.
                </p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제1조 (목적)</h2>
                        <p className="text-muted-foreground">
                            본 약관은 만날래말래(이하 "서비스")가 제공하는 약속 일정 조율 서비스의 이용과 관련하여
                            서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제2조 (정의)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>① "서비스"란 만날래말래가 제공하는 약속 일정 조율 웹 서비스를 의미합니다.</p>
                            <p>② "이용자"란 본 약관에 따라 서비스가 제공하는 서비스를 이용하는 자를 말합니다.</p>
                            <p>③ "회원"이란 서비스에 카카오 계정으로 로그인하여 서비스를 이용하는 자를 말합니다.</p>
                            <p>④ "비회원"이란 회원가입 없이 서비스를 이용하는 자를 말합니다.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제3조 (약관의 효력 및 변경)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>① 본 약관은 서비스를 이용하고자 하는 모든 이용자에게 그 효력이 발생합니다.</p>
                            <p>② 서비스는 필요한 경우 관련 법령을 위배하지 않는 범위 내에서 본 약관을 변경할 수 있습니다.</p>
                            <p>③ 변경된 약관은 서비스 내 공지사항을 통해 공지되며, 공지 후 7일이 경과한 시점부터 효력이 발생합니다.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제4조 (서비스의 제공)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 다음과 같은 서비스를 제공합니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>약속 일정 생성 및 공유</li>
                                <li>투표를 통한 일정 조율</li>
                                <li>투표 결과 확인</li>
                                <li>카카오 알림톡을 통한 알림 서비스</li>
                                <li>그룹 멤버 관리 (회원 전용)</li>
                                <li>기타 서비스가 정하는 서비스</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제5조 (서비스 이용)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>① 서비스는 회원가입 없이도 기본적인 약속 생성 및 투표 기능을 이용할 수 있습니다.</p>
                            <p>② 그룹 관리, 마이페이지 등 일부 기능은 카카오 로그인이 필요합니다.</p>
                            <p>③ 이용자는 본 약관 및 서비스가 정한 규정을 준수하여야 합니다.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제6조 (이용자의 의무)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>타인의 정보 도용</li>
                                <li>서비스에 게시된 정보의 변경</li>
                                <li>서비스가 정한 정보 이외의 정보 등 송신 또는 게시</li>
                                <li>서비스 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                                <li>서비스 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                                <li>기타 불법적이거나 부당한 행위</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제7조 (서비스 이용의 제한)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 다음 각 호에 해당하는 경우 서비스 이용을 제한할 수 있습니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>본 약관을 위반한 경우</li>
                                <li>서비스 운영을 고의로 방해한 경우</li>
                                <li>기타 서비스가 정한 이용조건에 위반한 경우</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제8조 (면책조항)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>① 서비스는 천재지변, 불가항력적 사유로 인한 서비스 제공 불능에 대해 책임을 지지 않습니다.</p>
                            <p>② 서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</p>
                            <p>③ 서비스는 이용자가 게재한 정보, 자료, 사실의 신뢰도, 정확성 등에 대해 책임을 지지 않습니다.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">제9조 (분쟁 해결)</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>① 서비스와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법률에 따릅니다.</p>
                            <p>② 서비스와 이용자 간에 발생한 분쟁에 관한 소송의 관할법원은 민사소송법에 따라 정합니다.</p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">부칙</h2>
                        <p className="text-muted-foreground">
                            본 약관은 2024년 1월 1일부터 시행됩니다.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    )
}

