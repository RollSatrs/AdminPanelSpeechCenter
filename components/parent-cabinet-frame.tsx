"use client"

import * as React from "react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ParentCabinetSidebar } from "@/components/parent-cabinet-sidebar"

type ParentCabinetFrameProps = {
  title: string
  description?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function ParentCabinetFrame({
  title,
  description,
  actions,
  children,
}: ParentCabinetFrameProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "18rem",
          "--sidebar-width-icon": "3.25rem",
        } as React.CSSProperties
      }
    >
      <ParentCabinetSidebar variant="inset" />
      <SidebarInset className="bg-[#F4F4F1]">
        <div className="flex min-h-svh flex-col">
          <header className="sticky top-0 z-20 border-b border-black/8 bg-[#F4F4F1]/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6">
              <div className="flex items-start gap-3">
                <SidebarTrigger className="mt-0.5 border border-black/10 bg-white hover:bg-white" />
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-black md:text-2xl">{title}</h1>
                  {description ? (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-black/58">{description}</p>
                  ) : null}
                </div>
              </div>
              {actions ? <div className="shrink-0">{actions}</div> : null}
            </div>
          </header>

          <div className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
