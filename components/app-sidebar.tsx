"use client"

import { useEffect, useMemo, useState } from "react"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { BookOpen, Home, Mailbox, User } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { getCurrentUser } from "@/lib/auth"
import { getLocalePrefix } from "@/lib/locale-date"

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const navT = useTranslations("nav")
  const appT = useTranslations("app")
  const { setOpenMobile, isMobile } = useSidebar()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  const localePrefix = getLocalePrefix(pathname, locale)

  const items = useMemo(
    () => [
      {
        title: navT("home"),
        path: "",
        icon: Home,
      },
      {
        title: navT("fast"),
        path: "/fast",
        icon: BookOpen,
      },
      {
        title: navT("feedback"),
        path: "/feedback",
        icon: Mailbox,
      },
    ],
    [navT]
  )

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

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  const handleMypage = () => {
    handleMenuClick()
    router.push(`${localePrefix}/mypage`)
  }

  const isActive = (path: string) => {
    const target = `${localePrefix}${path}` || localePrefix
    if (path === "") return pathname === localePrefix || pathname === `${localePrefix}/`
    return pathname === target || pathname.startsWith(`${target}/`)
  }

  return (
    <Sidebar variant="sidebar" className="border-r bg-sidebar">
      <SidebarHeader className="bg-sidebar">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="text-lg font-bold text-sidebar-foreground">{appT("name")}</div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <SidebarGroup>
          <SidebarGroupLabel>{navT("menu")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.path || "home"}>
                  <SidebarMenuButton asChild isActive={isActive(item.path)}>
                    <Link href={`${localePrefix}${item.path}`} onClick={handleMenuClick}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {!loading && user && (
                <SidebarMenuItem>
                  <SidebarMenuButton isActive={isActive("/mypage")} onClick={handleMypage}>
                    <User />
                    <span>{navT("mypage")}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
