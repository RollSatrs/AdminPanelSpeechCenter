"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TestsEditorForm } from "@/components/tests-editor-form"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

export default function NewTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const me = await api.get<MeResponse>("/auth/me")
        if (cancelled) return
        setAdmin(me.data.admin)
      } catch {
        if (!cancelled) router.push("/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    checkAuth()
    return () => {
      cancelled = true
    }
  }, [router])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка...</div>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar admin={admin} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="space-y-4 p-4 lg:p-6">
          <h1 className="text-xl font-semibold">Создание теста</h1>
          <TestsEditorForm mode="create" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
