import "./globals.css"
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import Link from "next/link"
import Image from "next/image"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "만날래말래 - 약속 잡기 서비스",
  description: "여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.",
  openGraph: {
    title: "만날래말래",
    description: "여러 사람과 만나기 좋은 날짜를 간편하게 정해보세요.",
    type: "website",
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <CustomSidebarTrigger />

                <div className="h-4 border-l border-sidebar-border" />
                <Link href="/">
                  <h1 className="text-xl font-semibold">만날래말래</h1>
                </Link>
              </header>
              <main className="flex-1 p-4">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
