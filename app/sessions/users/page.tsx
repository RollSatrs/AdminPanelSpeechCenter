"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type SessionsResponse = {
  items: Array<{
    sessionId: number
    parentId: number
    parentFullName: string
    parentPhone: string
    childId: number | null
    childFullName: string | null
    status: "registered" | "testing" | "done"
    step: string
    stepLabel: string
    startedAt: string
    lastSeenAt: string
  }>
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

export default function UserSessionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [items, setItems] = useState<SessionsResponse["items"]>([])
  const [query, setQuery] = useState("")
  const [stepFilter, setStepFilter] = useState<string>("all")

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const me = await api.get<MeResponse>("/auth/me")
        const sessions = await api.get<SessionsResponse>("/sessions/users")
        if (cancelled) return
        setAdmin(me.data.admin)
        setItems(sessions.data.items ?? [])
      } catch {
        if (!cancelled) router.push("/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const stepOptions = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.step))).map((step) => {
      const first = items.find((item) => item.step === step)
      return { value: step, label: first?.stepLabel ?? step }
    })
  }, [items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) => {
      if (stepFilter !== "all" && item.step !== stepFilter) return false
      if (!q) return true
      return (
        item.parentFullName.toLowerCase().includes(q) ||
        item.parentPhone.toLowerCase().includes(q) ||
        (item.childFullName ?? "").toLowerCase().includes(q)
      )
    })
  }, [items, query, stepFilter])

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
          <h1 className="text-xl font-semibold">Пользовательские сессии</h1>

          <Card>
            <CardHeader>
              <CardTitle>Фильтры</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Поиск: ФИО/телефон/ребёнок"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              <Select value={stepFilter} onValueChange={setStepFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Шаг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все шаги</SelectItem>
                  {stepOptions.map((step) => (
                    <SelectItem key={step.value} value={step.value}>
                      {step.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Родитель</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Ребёнок</TableHead>
                  <TableHead>Шаг</TableHead>
                  <TableHead>Последняя активность</TableHead>
                  <TableHead>Старт</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Нет данных
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.parentId}>
                      <TableCell>{item.parentFullName}</TableCell>
                      <TableCell>{item.parentPhone}</TableCell>
                      <TableCell>{item.childFullName ?? "—"}</TableCell>
                      <TableCell>{item.stepLabel}</TableCell>
                      <TableCell>{formatDateTime(item.lastSeenAt)}</TableCell>
                      <TableCell>{formatDateTime(item.startedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/parent/${item.parentId}`}>Открыть</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
