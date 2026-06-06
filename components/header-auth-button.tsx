"use client"

import { useEffect, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { Loader2, LogIn, LogOut, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUser, signOut } from "@/lib/auth"
import { getLocalePrefix } from "@/lib/locale-date"

export function HeaderAuthButton() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations("auth")
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const localePrefix = getLocalePrefix(pathname, locale)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (err) {
        console.error("Failed to check auth:", err)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname])

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await signOut()
      setUser(null)
      router.push(localePrefix)
    } catch (err) {
      console.error("Failed to log out:", err)
    } finally {
      setLoggingOut(false)
    }
  }

  const handleLogin = () => {
    const currentUrl = pathname + (typeof window !== "undefined" ? window.location.search : "")
    router.push(`${localePrefix}/login?redirect=${encodeURIComponent(currentUrl)}`)
  }

  const handleMypage = () => {
    router.push(`${localePrefix}/mypage`)
  }

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled aria-label={t("checking")}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    )
  }

  if (!user) {
    return (
      <Button variant="default" size="sm" onClick={handleLogin}>
        <LogIn className="mr-2 h-4 w-4" />
        {t("login")}
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loggingOut}>
          {loggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loggingOut")}
            </>
          ) : (
            <>
              <User className="mr-2 h-4 w-4" />
              {user.user_metadata?.name || user.email || t("account")}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleMypage}>
          <User className="mr-2 h-4 w-4" />
          {t("mypage")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
