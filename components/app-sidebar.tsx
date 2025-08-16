"use client"

import { BookOpen, Mailbox, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
    {
        title: "홈",
        url: "/",
        icon: Home,
    },
    {
        title: "만날래말래 설명서",
        url: "/guide",
        icon: BookOpen,
    },
    {
        title: "건의함",
        url: "/feedback",
        icon: Mailbox,
    },
]

export function AppSidebar() {
    const pathname = usePathname()
    const { setOpenMobile, isMobile } = useSidebar()

    const handleMenuClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <Sidebar variant="sidebar" className="border-r bg-sidebar">
            <SidebarHeader className="bg-sidebar">
                <div className="flex items-center gap-2 px-2 py-2">
                    <div className="text-lg font-bold text-sidebar-foreground">
                        만날래말래
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-sidebar">
                <SidebarGroup>
                    <SidebarGroupLabel>메뉴</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === item.url}
                                    >
                                        <Link href={item.url} onClick={handleMenuClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
