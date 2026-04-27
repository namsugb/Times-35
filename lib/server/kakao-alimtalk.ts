type AlimtalkButtonUrl = {
  url_pc: string
  url_mobile: string
}

type AlimtalkMessage = {
  no: string
  tel_num: string
  use_sms: "0" | "1"
  sms_content: string
  msg_content: string
  btn_url?: AlimtalkButtonUrl[]
}

type AlimtalkResult =
  | { success: true; data: any }
  | { success: false; error: string }

const ALIMTALK_ENDPOINT = "https://jupiter.lunasoft.co.kr/api/AlimTalk/message/send"

function getLunasoftConfig() {
  const userid = process.env.LUNA_USERID
  const apiKey = process.env.LUNA_API_KEY

  if (!userid || !apiKey) {
    return null
  }

  return { userid, apiKey }
}

async function sendAlimtalk(templateId: number, messages: AlimtalkMessage[]): Promise<AlimtalkResult> {
  try {
    const config = getLunasoftConfig()

    if (!config) {
      console.warn("Lunasoft 알림톡 설정이 누락되었습니다.")
      return { success: false, error: "Lunasoft configuration missing" }
    }

    const response = await fetch(ALIMTALK_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userid: config.userid,
        api_key: config.apiKey,
        template_id: templateId,
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const result = await response.json()

    if (result.code !== 0) {
      const errorMessage =
        typeof result.msg === "object"
          ? JSON.stringify(result.msg, null, 2)
          : result.msg || "알림톡 전송 실패"
      throw new Error(errorMessage)
    }

    return { success: true, data: result }
  } catch (error: any) {
    console.error("알림톡 전송 중 오류:", error)
    return { success: false, error: error.message }
  }
}

export function sendKakaoInvite(
  invitorName: string,
  phoneNumber: string,
  appointmentTitle: string,
  voteUrl: string,
  resultsUrl: string,
) {
  return sendAlimtalk(50081, [
    {
      no: "1",
      tel_num: phoneNumber,
      use_sms: "0",
      sms_content: `${invitorName}님께서 투표에 초대했습니다.\n${appointmentTitle} 투표에 참여해 주세요.`,
      msg_content: `${invitorName}님께서 투표에 초대했습니다.\n${appointmentTitle} 투표에 참여해 주세요.`,
      btn_url: [
        {
          url_pc: voteUrl,
          url_mobile: voteUrl,
        },
        {
          url_pc: resultsUrl,
          url_mobile: resultsUrl,
        },
      ],
    },
  ])
}

export function sendKakaoCompletion(phoneNumber: string, appointmentTitle: string, resultsUrl: string) {
  return sendAlimtalk(50082, [
    {
      no: "1",
      tel_num: phoneNumber,
      use_sms: "0",
      sms_content: `${appointmentTitle} 투표가 완료되었습니다.\n투표 결과를 확인하고 친구들에게 공유해보세요!`,
      msg_content: `${appointmentTitle} 투표가 완료되었습니다.\n투표 결과를 확인하고 친구들에게 공유해보세요!`,
      btn_url: [
        {
          url_pc: resultsUrl,
          url_mobile: resultsUrl,
        },
      ],
    },
  ])
}
