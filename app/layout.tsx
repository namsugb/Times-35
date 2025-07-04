import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "만날래말래 - 약속 스케줄러",
  description: "여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body data-kakao-js-key={process.env.KAKAO_JS_KEY ?? ""} className="min-h-screen flex flex-col">
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
