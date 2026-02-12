"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
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

type TestListItem = {
  id: number
  name: string
  ageFrom: number
  ageTo: number
  questionsCount: number
  rulesCount: number
}

type TestListResponse = {
  items: TestListItem[]
}

export default function TestsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [tests, setTests] = useState<TestListItem[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const me = await api.get<MeResponse>("/auth/me")
        const res = await api.get<TestListResponse>("/tests")
        if (cancelled) return
        setAdmin(me.data.admin)
        setTests(res.data.items ?? [])
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
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Тесты</h1>
            <Button asChild>
              <Link href="/tests/new">Добавить тест</Link>
            </Button>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Вопросы</TableHead>
                  <TableHead>Правила</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      Тестов пока нет.
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>{test.name}</TableCell>
                      <TableCell>
                        {test.ageFrom} - {test.ageTo}
                      </TableCell>
                      <TableCell>{test.questionsCount}</TableCell>
                      <TableCell>{test.rulesCount}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/tests/${test.id}`}>Редактировать</Link>
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
