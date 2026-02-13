"use client"

import * as React from "react"
import {
  IconHome,
  IconUsers,
  IconFileAnalytics,
  IconChartBar,
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
    url: "/",
    icon: IconHome,
  },
  {
    title: "Пользовательские сессии",
    url: "/sessions/users",
    icon: IconUsers,
  },
  {
    title: "Тесты",
    url: "/tests",
    icon: IconFileAnalytics,
  },
  {
    title: "Аналитика",
    url: "/analytics",
    icon: IconChartBar,
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
