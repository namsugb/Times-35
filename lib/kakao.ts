"use client"

declare global {
  interface Window {
    Kakao: any
  }
}

export class KakaoShare {
  private static isInitialized = false

  static async initialize() {
    if (typeof window === "undefined") return false
    if (this.isInitialized) return true

    try {
      // 카카오 SDK 동적 로드
      if (!window.Kakao) {
        await this.loadKakaoSDK()
      }

      const jsKey = (typeof document !== "undefined" && document.body?.dataset?.kakaoJsKey) || ""
      if (!jsKey || jsKey === "your_kakao_javascript_key_here") {
        console.warn("카카오톡 JavaScript 키가 설정되지 않았습니다.")
        return false
      }

      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(jsKey)
      }

      this.isInitialized = true
      return true
    } catch (error) {
      console.error("카카오 SDK 초기화 실패:", error)
      return false
    }
  }

  private static loadKakaoSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js"
      script.integrity = "sha384-TiCUE00h649CAMonG018J2ujOgDKW/kVWlChEuu4jK2vxfAAD0eZxzCKakxg55G4"
      script.crossOrigin = "anonymous"
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("카카오 SDK 로드 실패"))
      document.head.appendChild(script)
    })
  }

  static async shareAppointment(appointmentData: {
    title: string
    shareToken: string
    method: string
    participantCount: number
    dateRange?: string
  }) {
    const isReady = await this.initialize()
    if (!isReady) {
      throw new Error("카카오톡 공유 기능을 사용할 수 없습니다.")
    }

    const baseUrl = window.location.origin
    const voteUrl = `${baseUrl}/vote/${appointmentData.shareToken}`
    const resultUrl = `${baseUrl}/results/${appointmentData.shareToken}`

    const methodNames = {
      "all-available": "모두 가능한 날",
      "max-available": "최대 다수 가능",
      "minimum-required": "기준 인원 이상",
      "time-scheduling": "시간 정하기",
      recurring: "반복 일정",
    }

    try {
      window.Kakao.Share.sendDefault({
        objectType: "feed",
        content: {
          title: `📅 ${appointmentData.title}`,
          description: `${methodNames[appointmentData.method as keyof typeof methodNames]} 방식으로 약속을 정해요!\n${
            appointmentData.dateRange ? `📆 ${appointmentData.dateRange}` : ""
          }\n👥 예상 참여자: ${appointmentData.participantCount}명`,
          imageUrl: `${baseUrl}/api/og-image?title=${encodeURIComponent(appointmentData.title)}`,
          link: {
            mobileWebUrl: voteUrl,
            webUrl: voteUrl,
          },
        },
        buttons: [
          {
            title: "투표하러 가기",
            link: {
              mobileWebUrl: voteUrl,
              webUrl: voteUrl,
            },
          },
          {
            title: "결과 보기",
            link: {
              mobileWebUrl: resultUrl,
              webUrl: resultUrl,
            },
          },
        ],
        installTalk: true,
      })
    } catch (error) {
      console.error("카카오톡 공유 실패:", error)
      throw new Error("카카오톡 공유에 실패했습니다.")
    }
  }
}

// Web Share API 폴백
export class WebShare {
  static async shareAppointment(appointmentData: {
    title: string
    shareToken: string
    method: string
  }) {
    if (!navigator.share) {
      throw new Error("이 브라우저는 공유 기능을 지원하지 않습니다.")
    }

    const baseUrl = window.location.origin
    const voteUrl = `${baseUrl}/vote/${appointmentData.shareToken}`

    try {
      await navigator.share({
        title: `📅 ${appointmentData.title}`,
        text: `약속 투표에 참여해주세요! 🗳️`,
        url: voteUrl,
      })
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Web Share 실패:", error)
        throw new Error("공유에 실패했습니다.")
      }
    }
  }
}

// 클립보드 복사 폴백
export class ClipboardShare {
  static async copyInviteMessage(appointmentData: {
    title: string
    shareToken: string
    method: string
    dateRange?: string
  }) {
    const baseUrl = window.location.origin
    const voteUrl = `${baseUrl}/vote/${appointmentData.shareToken}`

    const methodNames = {
      "all-available": "모두 가능한 날",
      "max-available": "최대 다수 가능",
      "minimum-required": "기준 인원 이상",
      "time-scheduling": "시간 정하기",
      recurring: "반복 일정",
    }

    const message = `📅 ${appointmentData.title}

${methodNames[appointmentData.method as keyof typeof methodNames]} 방식으로 약속을 정해요!
${appointmentData.dateRange ? `📆 ${appointmentData.dateRange}` : ""}

🗳️ 투표하러 가기: ${voteUrl}

만날래말래에서 간편하게 약속을 정해보세요! ✨`

    try {
      await navigator.clipboard.writeText(message)
      return message
    } catch (error) {
      console.error("클립보드 복사 실패:", error)
      throw new Error("클립보드 복사에 실패했습니다.")
    }
  }
}

// ---------------------------------------------------------------------------
// 간단히 호출할 수 있는 래퍼 헬퍼
// share-modal 등에서 import { shareToKakao } … 로 사용
// ---------------------------------------------------------------------------
type KakaoShareParams = {
  title: string
  description?: string
  url: string
  imageUrl?: string
}

/**
 * 브라우저 환경에서 카카오톡 기본 공유 템플릿을 호출합니다.
 * 내부적으로 Kakao SDK 초기화 여부를 확인하고, feed 타입으로 공유합니다.
 */
export async function shareToKakao({ title, description = "", url, imageUrl }: KakaoShareParams) {
  const isReady = await KakaoShare.initialize()
  if (!isReady) {
    throw new Error("카카오톡 공유 기능을 사용할 수 없습니다.")
  }

  // 기본 OG 이미지가 없을 경우 placeholder 제공
  const fallbackImg = `${window.location.origin}/placeholder.svg?height=630&width=1200&query=og-image`

  window.Kakao.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      imageUrl: imageUrl || fallbackImg,
      link: {
        mobileWebUrl: url,
        webUrl: url,
      },
    },
    buttons: [
      {
        title: "바로가기",
        link: {
          mobileWebUrl: url,
          webUrl: url,
        },
      },
    ],
    installTalk: true,
  })
}
