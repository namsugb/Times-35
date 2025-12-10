import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function PrivacyPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="p-6 mb-2">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <Shield className="h-6 w-6 text-green-500" />
                    개인정보처리방침
                </h1>
                <p className="text-sm mt-2 text-muted-foreground">
                    만날래말래는 이용자의 개인정보를 소중히 다루고 있습니다.
                </p>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">1. 개인정보의 수집 및 이용 목적</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>만날래말래(이하 "서비스")는 다음 목적을 위해 개인정보를 수집 및 이용합니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><strong>서비스 제공:</strong> 약속 일정 조율 서비스 제공, 투표 참여자 식별</li>
                                <li><strong>알림 서비스:</strong> 카카오 알림톡을 통한 투표 완료 알림, 약속 초대 알림</li>
                                <li><strong>회원 관리:</strong> 카카오 로그인을 통한 회원 식별, 마이페이지 서비스 제공</li>
                                <li><strong>서비스 개선:</strong> 서비스 이용 통계 분석 및 개선</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">2. 수집하는 개인정보 항목</h2>
                        <div className="text-muted-foreground space-y-3">
                            <div>
                                <h3 className="font-medium text-foreground mb-1">가. 비회원 이용 시</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1">
                                    <li>투표자 이름 (닉네임)</li>
                                    <li>약속 생성자 연락처 (선택)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-1">나. 카카오 로그인 시</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1">
                                    <li>카카오 계정 식별자</li>
                                    <li>이름 (닉네임)</li>
                                    <li>이메일 주소</li>
                                    <li>전화번호 </li>
                                    <li>생년월일</li>
                                    <li>성별</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-1">다. 자동 수집 정보</h3>
                                <ul className="list-disc list-inside ml-2 space-y-1">
                                    <li>서비스 이용 기록, 접속 로그</li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">3. 개인정보의 보유 및 이용 기간</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><strong>약속 관련 정보:</strong> 약속 생성일로부터 1년 후 자동 삭제</li>
                                <li><strong>회원 정보:</strong> 회원 탈퇴 시 즉시 삭제</li>
                                <li><strong>서비스 이용 기록:</strong> 3개월간 보관 후 삭제</li>
                            </ul>
                            <p className="mt-2">
                                단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">4. 개인정보의 제3자 제공</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>이용자가 사전에 동의한 경우</li>
                                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">5. 개인정보 처리 위탁</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다:</p>
                            <div className="border rounded-lg p-3 mt-2">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium">수탁업체</th>
                                            <th className="text-left py-2 font-medium">위탁업무</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b">
                                            <td className="py-2">카카오</td>
                                            <td className="py-2">카카오 로그인, 알림톡 발송</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2">Supabase</td>
                                            <td className="py-2">데이터베이스 호스팅</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">6. 이용자의 권리와 행사 방법</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li><strong>개인정보 열람 요구:</strong> 본인의 개인정보 열람 요청</li>
                                <li><strong>개인정보 정정 요구:</strong> 오류가 있는 경우 정정 요청</li>
                                <li><strong>개인정보 삭제 요구:</strong> 개인정보 삭제 요청</li>
                                <li><strong>처리 정지 요구:</strong> 개인정보 처리 정지 요청</li>
                            </ul>
                            <p className="mt-2">
                                위 권리는 이메일(mannallemalle@gmail.com)을 통해 행사하실 수 있습니다.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">7. 개인정보의 안전성 확보 조치</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
                            <ul className="list-disc list-inside ml-2 space-y-1">
                                <li>개인정보의 암호화</li>
                                <li>해킹 등에 대비한 보안 프로그램 운영</li>
                                <li>접근 권한 관리</li>
                                <li>SSL/TLS를 통한 데이터 전송 구간 암호화</li>
                            </ul>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">8. 쿠키의 사용</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>
                                서비스는 이용자에게 보다 나은 서비스를 제공하기 위해 쿠키(Cookie)를 사용합니다.
                                쿠키는 이용자의 브라우저에 저장되는 작은 텍스트 파일로, 로그인 상태 유지 등에 사용됩니다.
                            </p>
                            <p>
                                이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나,
                                이 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">9. 개인정보 보호책임자</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고 있으며, 개인정보와 관련한 문의사항은 아래로 연락주시기 바랍니다:</p>
                            <div className="border rounded-lg p-3 mt-2">
                                <p><strong>개인정보 보호책임자:</strong> 남승수</p>
                                <p><strong>이메일:</strong> mannallemalle@gmail.com</p>
                                <p><strong>연락처:</strong> 010-3941-2259</p>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">10. 개인정보처리방침의 변경</h2>
                        <div className="text-muted-foreground space-y-2">
                            <p>
                                본 개인정보처리방침은 법령, 정책 또는 보안 기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다.
                                변경 시에는 시행 7일 전부터 서비스 내 공지사항을 통해 공지합니다.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-base font-semibold">부칙</h2>
                        <p className="text-muted-foreground">
                            본 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.
                        </p>
                    </section>
                </CardContent>
            </Card>
        </div>
    )
}

