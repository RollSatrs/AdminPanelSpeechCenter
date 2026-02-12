"use client"

import * as React from "react"
import {
  IconHome,
  IconUsers,
  IconLayoutDashboard,
  IconUserPlus,
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
    title: "Сессии",
    url: "#",
    icon: IconLayoutDashboard,
    items: [
      {
        title: "Пользовательские сессии",
        url: "/sessions/users",
        icon: IconUsers,
      },
    ],
  },
  {
    title: "Лиды",
    url: "/leads",
    icon: IconUserPlus,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="px-2 py-1 text-sm font-semibold">SpeechCenter Admin</div>
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
