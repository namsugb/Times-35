"use client"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Signpost } from "lucide-react"

export function CustomSidebarTrigger() {
    const { toggleSidebar } = useSidebar()

    return (
        <Button
            variant="outline"
            size="sm"
            className="bg-blue-50 hover:bg-blue-100 border-blue-200 shadow-sm text-blue-700 hover:text-blue-800"
            onClick={toggleSidebar}
        >
            <Signpost className="h-5 w-5" />
            <span className="sr-only">메뉴 열기</span>
        </Button>
    )
}
