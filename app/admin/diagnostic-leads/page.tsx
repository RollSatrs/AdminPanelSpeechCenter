"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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

type DiagnosticLeadItem = {
  id: number
  parentId: number
  fullName: string
  phone: string
  status: "pending" | "issued"
  accessLogin: string | null
  accessPassword: string | null
  accessIssuedAt: string | null
  createdAt: string | null
  childId: number | null
  childFullName: string | null
  childBirthDate: string | null
  childLanguage: "ru" | "kz" | "both" | null
  childrenCount: number
  sessionStep: string | null
  sessionStepLabel: string | null
  sessionLastSeenAt: string | null
  hasCabinetAccess: boolean
}

type DiagnosticLeadsResponse = {
  summary: {
    total: number
    pending: number
    issued: number
  }
  items: DiagnosticLeadItem[]
}

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

function formatDate(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ru-RU")
}

function languageLabel(language: DiagnosticLeadItem["childLanguage"]): string {
  if (language === "ru") return "Русский"
  if (language === "kz") return "Казахский"
  if (language === "both") return "Два языка"
  return "—"
}

function statusLabel(status: DiagnosticLeadItem["status"]) {
  return status === "issued" ? "Выдан доступ" : "Ожидает доступ"
}

function statusClassName(status: DiagnosticLeadItem["status"]) {
  return status === "issued"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-amber-200 bg-amber-50 text-amber-700"
}

export default function AdminDiagnosticLeadsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [items, setItems] = useState<DiagnosticLeadItem[]>([])
  const [query, setQuery] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DiagnosticLeadItem | null>(null)
  const [accessLogin, setAccessLogin] = useState("")
  const [accessPassword, setAccessPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [me, diagnosticLeads] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<DiagnosticLeadsResponse>("/diagnostic-leads"),
        ])

        if (cancelled) return

        setAdmin(me.data.admin)
        setItems(diagnosticLeads.data.items ?? [])
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
        statusLabel(item.status).toLowerCase().includes(q) ||
        (item.childFullName ?? "").toLowerCase().includes(q) ||
        (item.sessionStepLabel ?? "").toLowerCase().includes(q)
      )
    })
  }, [items, query])

  const summary = useMemo(() => {
    return {
      total: items.length,
      pending: items.filter((item) => item.status === "pending").length,
      issued: items.filter((item) => item.status === "issued").length,
    }
  }, [items])

  function openDrawer(item: DiagnosticLeadItem) {
    setSelectedItem(item)
    setAccessLogin(item.accessLogin ?? "")
    setAccessPassword(item.accessPassword ?? "")
    setFormError("")
    setDrawerOpen(true)
  }

  function closeDrawer(nextOpen: boolean) {
    setDrawerOpen(nextOpen)
    if (!nextOpen) {
      setSelectedItem(null)
      setAccessLogin("")
      setAccessPassword("")
      setFormError("")
    }
  }

  async function handleSaveAccess() {
    if (!selectedItem || saving) return

    const loginValue = accessLogin.trim()
    const passwordValue = accessPassword.trim()

    if (loginValue.length < 3 || passwordValue.length < 3) {
      setFormError("Укажите логин и пароль не короче 3 символов.")
      return
    }

    setSaving(true)
    setFormError("")

    try {
      await api.patch("/diagnostic-leads", {
        id: selectedItem.id,
        accessLogin: loginValue,
        accessPassword: passwordValue,
      })

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedItem.id
            ? {
                ...item,
                status: "issued",
                accessLogin: loginValue,
                accessPassword: passwordValue,
                accessIssuedAt: new Date().toISOString(),
              }
            : item
        )
      )

      closeDrawer(false)
    } catch (error: unknown) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as { response?: { data?: { message?: string } } }).response?.data?.message === "string"
          ? (error as { response?: { data?: { message?: string } } }).response!.data!.message!
          : "Не удалось сохранить доступ. Попробуйте еще раз."

      setFormError(message)
    } finally {
      setSaving(false)
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
        } as CSSProperties
      }
    >
      <AppSidebar admin={admin} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="space-y-4 p-4 lg:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Запись на диагностику</h1>
              <p className="text-sm text-muted-foreground">
                Заявки родителей на диагностику и ручная выдача доступа.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Всего</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ожидают доступ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.pending}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Выдан доступ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold">{summary.issued}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Поиск</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="ФИО / телефон / ребёнок / шаг"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Родитель</TableHead>
                  <TableHead>Профиль</TableHead>
                  <TableHead>Бот</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создано</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Нет заявок на диагностику
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="min-w-[220px]">
                        <div className="font-medium">{item.fullName}</div>
                        <div className="text-xs text-muted-foreground">{item.phone}</div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        <div className="font-medium">
                          {item.childFullName ?? "Ребёнок ещё не добавлен"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.childBirthDate ? `Дата рождения: ${formatDate(item.childBirthDate)}` : "Дата рождения ещё не указана"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.childLanguage ? `Язык: ${languageLabel(item.childLanguage)}` : "Язык ещё не указан"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.childrenCount > 0
                            ? `Детей в профиле: ${item.childrenCount}`
                            : "Профиль ребёнка ещё не заполнен"}
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[220px]">
                        {item.sessionStepLabel ? (
                          <>
                            <div className="font-medium">{item.sessionStepLabel}</div>
                            <div className="text-xs text-muted-foreground">
                              Активность: {formatDateTime(item.sessionLastSeenAt)}
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            В боте ещё нет активной сессии
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <Badge variant="outline" className={statusClassName(item.status)}>
                            {statusLabel(item.status)}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            {item.hasCabinetAccess ? "Кабинет уже создан" : "Кабинет ещё не создан"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline">
                            <Link href={`/admin/parent/${item.parentId}`}>Профиль</Link>
                          </Button>
                          <Button variant="outline" onClick={() => openDrawer(item)}>
                            Выдать доступ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>

      <Drawer open={drawerOpen} onOpenChange={closeDrawer} direction="right">
        <DrawerContent className="w-full max-w-[520px]">
          <DrawerHeader className="border-b">
            <DrawerTitle>Выдать доступ</DrawerTitle>
            <DrawerDescription>
              {selectedItem
                ? `Родитель: ${selectedItem.fullName}, телефон: ${selectedItem.phone}. ${selectedItem.childFullName ? `Ребёнок: ${selectedItem.childFullName}${selectedItem.childBirthDate ? `, ${formatDate(selectedItem.childBirthDate)}` : ""}${selectedItem.childLanguage ? `, ${languageLabel(selectedItem.childLanguage)}` : ""}. ` : ""}${selectedItem.sessionStepLabel ? `Последний шаг бота: ${selectedItem.sessionStepLabel}. ` : ""}Здесь создаётся вход в кабинет родителя.`
                : "Выберите заявку из списка."}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-5 overflow-y-auto p-4">
            {selectedItem ? (
              <>
                <div className="rounded-2xl border bg-muted/40 p-4">
                  <div className="text-sm text-muted-foreground">Текущий статус</div>
                  <div className="mt-2">
                    <Badge variant="outline" className={statusClassName(selectedItem.status)}>
                      {statusLabel(selectedItem.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-muted-foreground">
                    Выдано: {formatDateTime(selectedItem.accessIssuedAt)}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Логин для кабинета</label>
                  <Input
                    value={accessLogin}
                    onChange={(event) => setAccessLogin(event.target.value)}
                    placeholder="Например: parent_aliya"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Пароль для кабинета</label>
                  <Input
                    value={accessPassword}
                    onChange={(event) => setAccessPassword(event.target.value)}
                    placeholder="Введите пароль"
                  />
                </div>

                {formError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          <DrawerFooter className="border-t">
            <Button onClick={handleSaveAccess} disabled={!selectedItem || saving}>
              {saving ? "Сохранение..." : "Сохранить доступ"}
            </Button>
            <Button variant="outline" onClick={() => closeDrawer(false)} disabled={saving}>
              Отмена
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </SidebarProvider>
  )
}
