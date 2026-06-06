"use client"

import type React from "react"
import { useEffect } from "react"
import Link from "next/link"
import { NextIntlClientProvider } from "next-intl"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { HeaderAuthButton } from "@/components/header-auth-button"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { routing, type Locale } from "@/i18n/routing"
import enMessages from "@/messages/en.json"
import jaMessages from "@/messages/ja.json"
import koMessages from "@/messages/ko.json"

const messagesByLocale: Record<Locale, typeof koMessages> = {
  ko: koMessages,
  en: enMessages,
  ja: jaMessages,
}

function getPathLocale(pathname: string): Locale {
  const firstSegment = pathname.split("/").filter(Boolean)[0]
  return routing.locales.includes(firstSegment as Locale)
    ? (firstSegment as Locale)
    : routing.defaultLocale
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const locale = getPathLocale(pathname)
  const messages = messagesByLocale[locale]
  const localePrefix = `/${locale}`

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return (
    <NextIntlClientProvider key={locale} locale={locale} messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <CustomSidebarTrigger />
              <div className="h-4 border-l border-sidebar-border" />
              <Link href={localePrefix}>
                <h1 className="text-xl font-semibold">{messages.app.name}</h1>
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
  )
}
