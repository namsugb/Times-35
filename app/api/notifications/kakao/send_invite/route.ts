import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

interface InviteMember {
    name: string
    phone: string
}

interface RequestBody {
    appointmentId: string
    appointmentTitle: string
    shareToken: string
    members: InviteMember[]
    invitorName: string
}

async function sendKakaoInvite(invitorName: string, phoneNumber: string, appointmentTitle: string, voteUrl: string, resultsUrl: string) {
    try {
        // Lunasoft API 설정 확인
        const LUNA_USERID = process.env.LUNA_USERID;
        const LUNA_API_KEY = process.env.LUNA_API_KEY;
        const name = appointmentTitle;
        const invitor = invitorName;


        if (!LUNA_USERID || !LUNA_API_KEY) {
            console.warn("Lunasoft 알림톡 설정이 되어있지 않습니다.");
            return { success: false, error: "Lunasoft configuration missing" };
        }

        const requestBody = {
            userid: LUNA_USERID,
            api_key: LUNA_API_KEY,
            template_id: 50081,

            messages: [
                {
                    no: "1",
                    tel_num: phoneNumber,
                    use_sms: "0",
                    sms_content: `${invitor}님께서 투표에 초대했습니다.\n${name} 투표에 참여해 주세요!`,
                    msg_content: `${invitor}님께서 투표에 초대했습니다.\n${name} 투표에 참여해 주세요!`,
                    btn_url: [{
                        url_pc: voteUrl,
                        url_mobile: voteUrl
                    }, {
                        url_pc: resultsUrl,
                        url_mobile: resultsUrl
                    }]
                },
            ],
        }

        // 디버그: 요청 바디 로깅 (API 키는 마스킹)
        console.log("알림톡 API 요청:", JSON.stringify({
            ...requestBody,
            api_key: "***MASKED***"
        }, null, 2));

        // Lunasoft API 요청
        const response = await fetch("https://jupiter.lunasoft.co.kr/api/AlimTalk/message/send", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody)
        });

        console.log("알림톡 API HTTP 상태:", response.status, response.statusText);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("알림톡 API HTTP 오류 응답:", errorText);
            throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
        }

        const result = await response.json();
        console.log("알림톡 API 응답 데이터:", JSON.stringify(result, null, 2));

        // Lunasoft API 응답 처리
        if (result.code !== 0) {
            const errorMessage = typeof result.msg === 'object'
                ? JSON.stringify(result.msg, null, 2)
                : result.msg || "알림톡 전송 실패";
            throw new Error(errorMessage);
        }

        return { success: true, data: result };
    } catch (error: any) {
        console.error("알림톡 전송 중 오류:", error);
        return { success: false, error: error.message };
    }
}


export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json()
        const { appointmentId, appointmentTitle, shareToken, members, invitorName } = body

        if (!appointmentId || !shareToken || !members || members.length === 0) {
            return NextResponse.json(
                { error: "필수 파라미터가 누락되었습니다." },
                { status: 400 }
            )
        }

        const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "https://mannallae.com"
        const voteUrl = `${origin}/vote/${shareToken}`
        const resultsUrl = `${origin}/results/${shareToken}`


        const results = []

        for (const member of members) {
            try {
                console.log(`알림톡 발송 시작: ${member.name} (${member.phone}) - ${appointmentTitle}`)
                console.log(`투표 링크: ${voteUrl}`)

                const result = await sendKakaoInvite(invitorName, member.phone, appointmentTitle, voteUrl, resultsUrl,)

                console.log(`알림톡 API 응답:`, JSON.stringify(result, null, 2))

                if (result.success) {
                    results.push({
                        phone: member.phone,
                        name: member.name,
                        status: "success",
                    })
                } else {
                    console.error(`알림톡 발송 실패 (${member.phone}):`, result.error)
                    results.push({
                        phone: member.phone,
                        name: member.name,
                        status: "failed",
                        error: result.error,
                    })
                }
            } catch (err: any) {
                console.error(`알림톡 발송 예외 (${member.phone}):`, err)
                results.push({
                    phone: member.phone,
                    name: member.name,
                    status: "failed",
                    error: err.message,
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: `${members.length}명에게 알림톡 발송 요청이 완료되었습니다.`,
            results,
        })
    } catch (error: any) {
        console.error("알림톡 발송 API 오류:", error)
        return NextResponse.json(
            { error: "알림톡 발송에 실패했습니다." },
            { status: 500 }
        )
    }
}

