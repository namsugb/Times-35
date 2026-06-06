"use client"

import { Globe } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { routing } from "@/i18n/routing"

const localeLabels: Record<string, string> = {
  ko: "KO",
  en: "EN",
  ja: "JA",
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  const segments = pathname.split("/").filter(Boolean)
  const currentLocale = routing.locales.includes(segments[0] as any)
    ? segments[0]
    : routing.defaultLocale

  const switchLocale = (locale: string) => {
    const nextSegments = [...segments]

    if (routing.locales.includes(nextSegments[0] as any)) {
      nextSegments[0] = locale
    } else {
      nextSegments.unshift(locale)
    }

    router.push(`/${nextSegments.join("/")}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => switchLocale(locale)}
            disabled={locale === currentLocale}
          >
            {localeLabels[locale]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
