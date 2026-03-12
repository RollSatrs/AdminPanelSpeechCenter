"use client"

import * as React from "react"
import {
  IconHome,
  IconUsers,
  IconFileAnalytics,
  IconChartBar,
  IconBrandWhatsapp,
} from "@tabler/icons-react"


import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Главная",
    url: "/admin",
    icon: IconHome,
  },
  {
    title: "Пользовательские сессии",
    url: "/admin/sessions/users",
    icon: IconUsers,
  },
  {
    title: "Тесты",
    url: "/admin/tests",
    icon: IconFileAnalytics,
  },
  {
    title: "Аналитика",
    url: "/admin/analytics",
    icon: IconChartBar,
  },
  {
    title: "WhatsApp Bot",
    url: "/admin/bot",
    icon: IconBrandWhatsapp,
  },
]

type AppSidebarProps = React.ComponentProps<typeof Sidebar> &{
  admin?: {
    email?: string | null
    name?: string | null
  } | null
}

export function AppSidebar({admin, ...props}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" className="supports-[backdrop-filter]:backdrop-blur-md" {...props}>
      <SidebarHeader>
        <div className="px-2 py-1 text-sm font-semibold tracking-tight">SpeechCenter Admin</div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: admin?.name || "Admin",
            email: admin?.email || "admin@speechcenter.local",
            avatar: "/avatars/admin.jpg",
          }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
