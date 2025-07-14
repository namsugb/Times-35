"use client"

declare global {
  interface Window {
    Kakao?: any
    kakaoInitPromise?: Promise<void>
  }
}

type ShareOptions = {
  title: string
  description?: string
  imageUrl?: string
  linkUrl: string
}

async function initKakao() {
  if (typeof window === "undefined") return
  if (window.Kakao?.isInitialized?.()) return

  if (!window.kakaoInitPromise) {
    window.kakaoInitPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // 1. Load SDK if not already present
        if (!document.querySelector('script[src*="kakao.js"]')) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement("script")
            s.src = "https://developers.kakao.com/sdk/js/kakao.js"
            s.async = true
            s.onload = () => res()
            s.onerror = () => rej(new Error("Failed to load Kakao JS SDK"))
            document.head.appendChild(s)
          })
        }

        // 2. Fetch the secret key from the server-only route
        const { key } = await fetch("/api/kakao-js-key").then((r) => r.json())
        if (!window.Kakao) throw new Error("Kakao SDK not found on window")
        window.Kakao.init(key)
        resolve()
      } catch (err) {
        console.error(err)
        reject(err)
      }
    })
  }

  return window.kakaoInitPromise
}

export async function shareToKakao({ title, description = "", imageUrl, linkUrl }: ShareOptions) {
  try {
    await initKakao()

    // 카카오 공식 JS SDK의 sendCustom 사용 (PC/모바일 모두 지원)
    window.Kakao.Link.sendCustom({
      templateId: 3139, // 기본 피드 템플릿 ID
      templateArgs: {
        TITLE: title,
        DESCRIPTION: description,
        WEB_URL: linkUrl,
        MOBILE_WEB_URL: linkUrl,
        IMAGE_URL: imageUrl ?? `${window.location.origin}/placeholder-logo.png`,
        FIRST_BUTTON_TITLE: "보기",
        FIRST_BUTTON_WEB_URL: linkUrl,
        FIRST_BUTTON_MOBILE_WEB_URL: linkUrl,
      },
    })
  } catch (error) {
    console.error("카카오 공유 실패:", error)

    // 폴백: 링크 복사 안내
    if (typeof window !== "undefined") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

      if (!isMobile) {
        // PC에서는 링크 복사 안내
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(linkUrl)
            alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크가 클립보드에 복사되었습니다.")
          } catch (clipboardError) {
            alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크를 수동으로 복사해주세요: " + linkUrl)
          }
        } else {
          alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크를 수동으로 복사해주세요: " + linkUrl)
        }
      } else {
        // 모바일에서 에러 발생 시
        alert("카카오톡 공유에 실패했습니다.\n카카오톡 앱이 설치되어 있는지 확인해주세요.")
      }
    }
  }
}
