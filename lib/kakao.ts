// No changes needed here – just confirming there is **no**
// reference to process.env.NEXT_PUBLIC_KAKAO_JS_KEY anywhere.
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
  await initKakao()
  window.Kakao.Link.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      imageUrl: imageUrl ?? `${window.location.origin}/placeholder-logo.png`,
      link: { mobileWebUrl: linkUrl, webUrl: linkUrl },
    },
    buttons: [{ title: "보기", link: { mobileWebUrl: linkUrl, webUrl: linkUrl } }],
  })
}
