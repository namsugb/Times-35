"use client"

import { Signpost } from "lucide-react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"

export function CustomSidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  const t = useTranslations("nav")

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-blue-200 bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100 hover:text-blue-800"
      onClick={toggleSidebar}
    >
      <Signpost className="h-5 w-5" />
      <span className="sr-only">{t("openMenu")}</span>
    </Button>
  )
}
