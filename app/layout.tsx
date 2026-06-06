import "./globals.css"
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages, getTranslations } from "next-intl/server"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { HeaderAuthButton } from "@/components/header-auth-button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

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
  const messages = await getMessages()
  const appT = await getTranslations("app")

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                  <CustomSidebarTrigger />
                  <div className="h-4 border-l border-sidebar-border" />
                  <Link href="/">
                    <h1 className="text-xl font-semibold">{appT("name")}</h1>
                  </Link>

                  <div className="ml-auto flex items-center gap-1">
                    <LanguageSwitcher />
                    <HeaderAuthButton />
                  </div>
                </header>
                <main className="flex-1 p-4">{children}</main>
              </SidebarInset>
            </SidebarProvider>
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
