import "./globals.css"
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { getLocale } from "next-intl/server"
import { AppShell } from "@/components/app-shell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Meet or Not",
  description: "Pick the best date to meet with a group.",
  openGraph: {
    title: "Meet or Not",
    description: "Pick the best date to meet with a group.",
    type: "website",
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
