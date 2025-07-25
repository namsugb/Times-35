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
  voteUrl: string
  resultsUrl: string
}

async function initKakao() {
  if (typeof window === "undefined") return
  if (window.Kakao?.isInitialized?.()) return

  if (!window.kakaoInitPromise) {
    window.kakaoInitPromise = new Promise<void>(async (resolve, reject) => {
      try {
        // 1. Load SDK if not already present
        if (!document.querySelector('script[src*="kakao.min.js"]')) {
          await new Promise<void>((res, rej) => {
            const s = document.createElement("script")
            s.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
            s.integrity = "sha384-dok87au0gKqJdxs7msEdBPNnKSRT+/mhTVzq+qOhcL464zXwvcrpjeWvyj1kCdq6"
            s.crossOrigin = "anonymous"
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

export async function shareToKakao({ title, description = "", imageUrl, voteUrl, resultsUrl }: ShareOptions) {
  try {
    await initKakao()

    // 이미지 URL 검증 및 기본값 설정
    const defaultImageUrl = "https://developers.kakao.com/assets/img/about/logos/kakaotalksharing/kakaotalk_sharing_btn_medium.png"
    const finalImageUrl = imageUrl || defaultImageUrl

    console.log("카카오 공유 이미지 URL:", finalImageUrl)

    // 카카오 공식 JS SDK의 Share.sendDefault 사용
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: title,
        description: description,
        imageUrl: finalImageUrl,
        link: {
          mobileWebUrl: voteUrl,
          webUrl: voteUrl,
        },
      },
      buttons: [
        {
          title: '투표하기',
          link: {
            mobileWebUrl: voteUrl,
            webUrl: voteUrl,
          },
        },
        {
          title: '결과보기',
          link: {
            mobileWebUrl: resultsUrl,
            webUrl: resultsUrl,
          },
        },
      ],
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
            await navigator.clipboard.writeText(voteUrl)
            alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크가 클립보드에 복사되었습니다.")
          } catch (clipboardError) {
            alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크를 수동으로 복사해주세요: " + voteUrl)
          }
        } else {
          alert("PC에서는 카카오톡 공유가 제한됩니다.\n링크를 수동으로 복사해주세요: " + voteUrl)
        }
      } else {
        // 모바일에서 에러 발생 시
        alert("카카오톡 공유에 실패했습니다.\n카카오톡 앱이 설치되어 있는지 확인해주세요.")
      }
    }
  }
}
