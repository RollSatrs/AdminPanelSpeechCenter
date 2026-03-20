"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type LeadsResponse = {
  summary: {
    total: number
  }
  items: Array<{
    id: number
    fullName: string
    phone: string
    question: string
    createdAt: string
  }>
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

export default function AdminLeadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [items, setItems] = useState<LeadsResponse["items"]>([])
  const [query, setQuery] = useState("")
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [me, leads] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<LeadsResponse>("/leads"),
        ])
        if (cancelled) return
        setAdmin(me.data.admin)
        setItems(leads.data.items ?? [])
      } catch {
        if (!cancelled) router.push("/admin/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      return (
        item.fullName.toLowerCase().includes(q) ||
        item.phone.toLowerCase().includes(q) ||
        item.question.toLowerCase().includes(q)
      )
    })
  }, [items, query])

  const filteredIds = filteredItems.map((item) => item.id)
  const selectedFilteredCount = filteredIds.filter((id) => selectedIds.includes(id)).length
  const allFilteredSelected = filteredIds.length > 0 && selectedFilteredCount === filteredIds.length

  function toggleRow(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return prev.includes(id) ? prev : [...prev, id]
      return prev.filter((value) => value !== id)
    })
  }

  function toggleAllFiltered(checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, ...filteredIds]))
      }
      return prev.filter((id) => !filteredIds.includes(id))
    })
  }

  async function handleDeleteSelected() {
    if (selectedIds.length === 0 || deleting) return

    const confirmed = window.confirm(`Удалить выбранные заявки: ${selectedIds.length} шт.?`)
    if (!confirmed) return

    setDeleting(true)
    try {
      await api.delete("/leads", { data: { ids: selectedIds } })
      setItems((prev) => prev.filter((item) => !selectedIds.includes(item.id)))
      setSelectedIds([])
    } finally {
      setDeleting(false)
    }
  }

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
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="text-xl font-semibold">Заявки</h1>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || deleting}
            >
              {deleting ? "Удаление..." : `Удалить выбранные (${selectedIds.length})`}
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-[240px_minmax(0,1fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Всего заявок</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{items.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Поиск</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Поиск: ФИО / телефон / вопрос"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFilteredSelected}
                      onCheckedChange={(checked) => toggleAllFiltered(Boolean(checked))}
                      aria-label="Выбрать все заявки"
                    />
                  </TableHead>
                  <TableHead>ФИО</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Вопрос</TableHead>
                  <TableHead>Создано</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Нет заявок
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(item.id)}
                          onCheckedChange={(checked) => toggleRow(item.id, Boolean(checked))}
                          aria-label={`Выбрать заявку ${item.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.fullName}</TableCell>
                      <TableCell>{item.phone}</TableCell>
                      <TableCell className="max-w-[480px] whitespace-pre-wrap break-words">
                        {item.question}
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
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
