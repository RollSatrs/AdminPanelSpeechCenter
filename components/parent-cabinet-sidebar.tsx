"use client"

import * as React from "react"
import {
  IconClipboardText,
  IconHome,
} from "@tabler/icons-react"
import { NavMain } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Обзор",
    url: "/cabinet",
    icon: IconHome,
  },
  {
    title: "Упражнения",
    url: "/cabinet/diagnostics",
    icon: IconClipboardText,
  },
]

export function ParentCabinetSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" className="supports-[backdrop-filter]:backdrop-blur-md" {...props}>
      <SidebarHeader>
        <div className="rounded-lg border border-black/10 bg-white px-3 py-3">
          <div className="text-xs uppercase tracking-[0.28em] text-black/45">SpeechCenter</div>
          <div className="mt-1 text-sm font-semibold text-black">Кабинет родителя</div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <div className="rounded-lg border border-black/10 bg-white px-3 py-3 text-xs leading-5 text-black/55">
          Сначала назначенные упражнения, затем результаты и следующие шаги.
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
