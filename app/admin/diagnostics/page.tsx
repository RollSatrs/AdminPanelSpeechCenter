"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { api } from "@/lib/api"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type LibraryItem = {
  id: number
  slug: string
  language: "ru" | "kz" | "both"
  soundGroup: string
  targetSound: string
  title: string
  word: string
  imageUrl: string | null
  imageEmoji: string | null
  accentColor: string | null
  sortOrder: number
}

type DiagnosticTemplate = {
  id: number
  slug: string
  title: string
  description: string | null
  language: "ru" | "kz" | "both"
  isActive: boolean
  itemCount: number
  assignmentCount: number
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    itemId: number
    sortOrder: number
    item: LibraryItem
  }>
}

type ChildOption = {
  id: number
  fullName: string
  birthDate: string
  language: "ru" | "kz" | "both"
  parentId: number
  parentFullName: string
  parentPhone: string
}

type Assignment = {
  id: number
  childId: number
  childFullName: string
  childLanguage: "ru" | "kz" | "both"
  parentFullName: string
  parentPhone: string
  diagnosticTemplateId: number
  diagnosticTitle: string
  status: "assigned" | "in_progress" | "submitted" | "reviewed"
  assignedAt: string
  updatedAt: string
}

type DiagnosticsResponse = {
  ok: boolean
  diagnostics: DiagnosticTemplate[]
  items: LibraryItem[]
  children: ChildOption[]
  assignments: Assignment[]
}

type FormState = {
  slug: string
  title: string
  description: string
  language: "ru" | "kz" | "both"
  isActive: boolean
  orderedItemIds: number[]
}

const emptyForm: FormState = {
  slug: "",
  title: "",
  description: "",
  language: "kz",
  isActive: true,
  orderedItemIds: [],
}

function languageLabel(value: "ru" | "kz" | "both") {
  if (value === "ru") return "Русский"
  if (value === "kz") return "Казахский"
  return "Оба языка"
}

function assignmentStatusLabel(value: Assignment["status"]) {
  if (value === "reviewed") return "Проверено"
  if (value === "submitted") return "Отправлено"
  if (value === "in_progress") return "В процессе"
  return "Назначено"
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9қңғүұөһі_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function AdminDiagnosticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticTemplate[]>([])
  const [items, setItems] = useState<LibraryItem[]>([])
  const [children, setChildren] = useState<ChildOption[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingDiagnostic, setEditingDiagnostic] = useState<DiagnosticTemplate | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [formError, setFormError] = useState("")
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [assigning, setAssigning] = useState(false)
  const [assignmentError, setAssignmentError] = useState("")
  const [assignmentDiagnosticId, setAssignmentDiagnosticId] = useState<string>("")
  const [assignmentChildId, setAssignmentChildId] = useState<string>("")
  const [removingAssignmentId, setRemovingAssignmentId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [me, diagnosticsResponse] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<DiagnosticsResponse>("/admin/diagnostics"),
        ])

        if (cancelled) return

        setAdmin(me.data.admin)
        setDiagnostics(diagnosticsResponse.data.diagnostics ?? [])
        setItems(diagnosticsResponse.data.items ?? [])
        setChildren(diagnosticsResponse.data.children ?? [])
        setAssignments(diagnosticsResponse.data.assignments ?? [])
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

  const itemById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])

  const summary = useMemo(() => {
    return {
      totalDiagnostics: diagnostics.length,
      activeDiagnostics: diagnostics.filter((diagnostic) => diagnostic.isActive).length,
      totalAssignments: assignments.length,
      libraryCards: items.length,
    }
  }, [assignments.length, diagnostics, items.length])

  const selectedItems = useMemo(
    () => form.orderedItemIds.map((itemId) => itemById.get(itemId)).filter((item): item is LibraryItem => Boolean(item)),
    [form.orderedItemIds, itemById]
  )

  const availableItems = useMemo(
    () => items.filter((item) => !form.orderedItemIds.includes(item.id)),
    [form.orderedItemIds, items]
  )

  async function loadDiagnosticsData() {
    const response = await api.get<DiagnosticsResponse>("/admin/diagnostics")
    setDiagnostics(response.data.diagnostics ?? [])
    setItems(response.data.items ?? [])
    setChildren(response.data.children ?? [])
    setAssignments(response.data.assignments ?? [])
  }

  function resetDrawerState() {
    setEditingDiagnostic(null)
    setForm(emptyForm)
    setFormError("")
  }

  function closeDrawer(nextOpen: boolean) {
    setDrawerOpen(nextOpen)
    if (!nextOpen) {
      resetDrawerState()
    }
  }

  function openCreateDrawer() {
    resetDrawerState()
    setDrawerOpen(true)
  }

  function openEditDrawer(diagnostic: DiagnosticTemplate) {
    setEditingDiagnostic(diagnostic)
    setForm({
      slug: diagnostic.slug,
      title: diagnostic.title,
      description: diagnostic.description ?? "",
      language: diagnostic.language,
      isActive: diagnostic.isActive,
      orderedItemIds: [...diagnostic.items]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.itemId),
    })
    setFormError("")
    setDrawerOpen(true)
  }

  function setFormValue<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleTitleBlur() {
    if (editingDiagnostic || form.slug.trim()) return
    const nextSlug = normalizeSlug(form.title)
    if (nextSlug) {
      setFormValue("slug", nextSlug)
    }
  }

  function addItem(itemId: number) {
    setForm((prev) => {
      if (prev.orderedItemIds.includes(itemId)) return prev
      return {
        ...prev,
        orderedItemIds: [...prev.orderedItemIds, itemId],
      }
    })
  }

  function removeItem(itemId: number) {
    setForm((prev) => ({
      ...prev,
      orderedItemIds: prev.orderedItemIds.filter((id) => id !== itemId),
    }))
  }

  function moveItem(itemId: number, direction: "up" | "down") {
    setForm((prev) => {
      const index = prev.orderedItemIds.indexOf(itemId)
      if (index === -1) return prev

      const nextIndex = direction === "up" ? index - 1 : index + 1
      if (nextIndex < 0 || nextIndex >= prev.orderedItemIds.length) return prev

      const nextIds = [...prev.orderedItemIds]
      const [moved] = nextIds.splice(index, 1)
      nextIds.splice(nextIndex, 0, moved)

      return {
        ...prev,
        orderedItemIds: nextIds,
      }
    })
  }

  async function handleSave() {
    if (saving) return

    setSaving(true)
    setFormError("")

    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        language: form.language,
        isActive: form.isActive,
        orderedItemIds: form.orderedItemIds,
      }

      if (editingDiagnostic) {
        await api.patch(`/admin/diagnostics/${editingDiagnostic.id}`, payload)
      } else {
        await api.post("/admin/diagnostics", payload)
      }

      await loadDiagnosticsData()
      closeDrawer(false)
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось сохранить упражнение")
          : "Не удалось сохранить упражнение"
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(diagnostic: DiagnosticTemplate) {
    if (deletingId) return
    const confirmed = window.confirm(`Удалить упражнение «${diagnostic.title}»?`)
    if (!confirmed) return

    setDeletingId(diagnostic.id)
    setFormError("")

    try {
      await api.delete(`/admin/diagnostics/${diagnostic.id}`)
      setDiagnostics((prev) => prev.filter((item) => item.id !== diagnostic.id))
      setAssignments((prev) => prev.filter((assignment) => assignment.diagnosticTemplateId !== diagnostic.id))
      if (editingDiagnostic?.id === diagnostic.id) {
        closeDrawer(false)
      }
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось удалить упражнение")
          : "Не удалось удалить упражнение"
      setFormError(message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleAssign() {
    if (assigning) return

    setAssigning(true)
    setAssignmentError("")

    try {
      const payload = {
        childId: Number(assignmentChildId),
        diagnosticTemplateId: Number(assignmentDiagnosticId),
      }

      await api.post("/admin/diagnostic-assignments", payload)
      await loadDiagnosticsData()
      setAssignmentChildId("")
      setAssignmentDiagnosticId("")
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось назначить упражнение")
          : "Не удалось назначить упражнение"
      setAssignmentError(message)
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemoveAssignment(assignment: Assignment) {
    if (removingAssignmentId) return
    const confirmed = window.confirm(
      `Снять упражнение «${assignment.diagnosticTitle}» у ребенка «${assignment.childFullName}»?`
    )
    if (!confirmed) return

    setRemovingAssignmentId(assignment.id)
    setAssignmentError("")

    try {
      await api.delete(`/admin/diagnostic-assignments/${assignment.id}`)
      await loadDiagnosticsData()
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось снять упражнение")
          : "Не удалось снять упражнение"
      setAssignmentError(message)
    } finally {
      setRemovingAssignmentId(null)
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
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Упражнения</h1>
              <p className="text-sm text-muted-foreground">
                Сначала собирайте упражнение как отдельный сценарий, потом прикрепляйте его ребенку. Карточки остаются библиотекой внутри упражнения.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/diagnostic-items">Библиотека карточек</Link>
              </Button>
              <Button onClick={openCreateDrawer}>
                <Plus className="size-4" />
                Новое упражнение
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Упражнений</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.totalDiagnostics}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Активных</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.activeDiagnostics}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Назначений</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.totalAssignments}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Карточек в библиотеке</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.libraryCards}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Список упражнений</CardTitle>
              <CardDescription>
                Здесь хранится контейнер упражнения: название, язык и точный порядок карточек.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Упражнение</TableHead>
                      <TableHead>Язык</TableHead>
                      <TableHead>Карточки</TableHead>
                      <TableHead>Назначения</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Обновлено</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diagnostics.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                          Упражнения пока не созданы.
                        </TableCell>
                      </TableRow>
                    ) : (
                      diagnostics.map((diagnostic) => (
                        <TableRow key={diagnostic.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{diagnostic.title}</div>
                              <div className="text-xs text-muted-foreground">{diagnostic.slug}</div>
                              {diagnostic.description ? (
                                <div className="mt-1 text-xs text-muted-foreground">{diagnostic.description}</div>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>{languageLabel(diagnostic.language)}</TableCell>
                          <TableCell>{diagnostic.itemCount}</TableCell>
                          <TableCell>{diagnostic.assignmentCount}</TableCell>
                          <TableCell>
                            <Badge variant={diagnostic.isActive ? "default" : "outline"}>
                              {diagnostic.isActive ? "Активна" : "Скрыта"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(diagnostic.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDrawer(diagnostic)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === diagnostic.id}
                                onClick={() => handleDelete(diagnostic)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
            <Card>
              <CardHeader>
                <CardTitle>Назначить ребенку</CardTitle>
                <CardDescription>
                  Ребенок увидит в кабинете только те упражнения, которые вы прикрепили здесь.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FieldGroup className="grid gap-4 md:grid-cols-2">
                  <Field>
                    <FieldLabel>Упражнение</FieldLabel>
                    <Select value={assignmentDiagnosticId} onValueChange={setAssignmentDiagnosticId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите упражнение" />
                      </SelectTrigger>
                      <SelectContent>
                        {diagnostics.filter((diagnostic) => diagnostic.isActive).map((diagnostic) => (
                          <SelectItem key={diagnostic.id} value={String(diagnostic.id)}>
                            {diagnostic.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>Назначаются только активные упражнения.</FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel>Ребенок</FieldLabel>
                    <Select value={assignmentChildId} onValueChange={setAssignmentChildId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ребенка" />
                      </SelectTrigger>
                      <SelectContent>
                        {children.map((child) => (
                          <SelectItem key={child.id} value={String(child.id)}>
                            {child.fullName} · {child.parentFullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>В списке все дети, уже созданные в системе.</FieldDescription>
                  </Field>
                </FieldGroup>

                {assignmentError ? <FieldError>{assignmentError}</FieldError> : null}

                <Button
                  onClick={handleAssign}
                  disabled={assigning || !assignmentDiagnosticId || !assignmentChildId}
                >
                  {assigning ? "Назначаем..." : "Прикрепить упражнение"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Текущие назначения</CardTitle>
                <CardDescription>
                  Именно этот список будет определять, какие упражнения родитель увидит в кабинете.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ребенок</TableHead>
                        <TableHead>Упражнение</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Назначено</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                            Назначений пока нет.
                          </TableCell>
                        </TableRow>
                      ) : (
                        assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{assignment.childFullName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {assignment.parentFullName} · {assignment.parentPhone}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{assignment.diagnosticTitle}</div>
                                <div className="text-xs text-muted-foreground">
                                  {languageLabel(assignment.childLanguage)}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{assignmentStatusLabel(assignment.status)}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(assignment.assignedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={removingAssignmentId === assignment.id}
                                onClick={() => handleRemoveAssignment(assignment)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        <Dialog open={drawerOpen} onOpenChange={closeDrawer}>
          <DialogContent className="flex max-h-[94vh] w-[min(96vw,1720px)] max-w-none flex-col overflow-hidden p-0 sm:max-w-[min(96vw,1720px)]" showCloseButton={false}>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>{editingDiagnostic ? "Редактировать упражнение" : "Новое упражнение"}</DialogTitle>
              <DialogDescription>
                Соберите само упражнение: задайте язык, название и точный порядок карточек. Родитель увидит в кабинете уже эту сущность, а не отдельные карточки.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="grid gap-6 px-6 py-5 xl:grid-cols-[420px_minmax(0,1fr)] 2xl:grid-cols-[460px_minmax(0,1fr)]">
                <div className="space-y-4">
                  <FieldGroup>
                    <Field>
                      <FieldLabel>Название</FieldLabel>
                      <Input
                        value={form.title}
                        onChange={(event) => setFormValue("title", event.target.value)}
                        onBlur={handleTitleBlur}
                        placeholder="Например: Упражнение 5-6 лет"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Slug</FieldLabel>
                      <Input
                        value={form.slug}
                        onChange={(event) => setFormValue("slug", event.target.value)}
                        placeholder="diagnostic-5-6"
                      />
                    </Field>
                    <Field>
                      <FieldLabel>Язык</FieldLabel>
                      <Select value={form.language} onValueChange={(value) => setFormValue("language", value as FormState["language"])}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kz">Казахский</SelectItem>
                          <SelectItem value="ru">Русский</SelectItem>
                          <SelectItem value="both">Оба языка</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Статус</FieldLabel>
                      <Select value={form.isActive ? "active" : "inactive"} onValueChange={(value) => setFormValue("isActive", value === "active")}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Активна</SelectItem>
                          <SelectItem value="inactive">Скрыта</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field>
                      <FieldLabel>Описание</FieldLabel>
                      <textarea
                        value={form.description}
                        onChange={(event) => setFormValue("description", event.target.value)}
                        placeholder="Коротко опишите, для кого и как используется это упражнение."
                        className="min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <FieldDescription>Описание видно администратору и помогает не путать сценарии.</FieldDescription>
                    </Field>
                  </FieldGroup>

                  <Card>
                    <CardHeader>
                      <CardTitle>Итог</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                      <div>Карточек в упражнении: {selectedItems.length}</div>
                      <div>Язык: {languageLabel(form.language)}</div>
                      <div>Статус: {form.isActive ? "Активна" : "Скрыта"}</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Библиотека карточек</CardTitle>
                      <CardDescription>
                        Добавляйте карточки в упражнение. Сами карточки отдельно редактируются в библиотеке.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {availableItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
                          Все доступные карточки уже добавлены.
                        </div>
                      ) : (
                        availableItems.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl border p-3"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl border text-lg"
                                style={
                                  item.imageUrl
                                    ? undefined
                                    : {
                                        background: `linear-gradient(135deg, ${item.accentColor ?? "#111111"}22 0%, #f7f7f4 100%)`,
                                      }
                                }
                              >
                                {item.imageUrl ? (
                                  <div
                                    className="h-full w-full rounded-[11px] bg-cover bg-center"
                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                  />
                                ) : (
                                  <span>{item.imageEmoji ?? "🖼️"}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{item.word}</div>
                                <div className="text-xs text-muted-foreground">
                                  {item.soundGroup} · целевой звук {item.targetSound}
                                </div>
                              </div>
                            </div>

                            <Button variant="outline" size="sm" onClick={() => addItem(item.id)}>
                              <Plus className="size-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Порядок внутри упражнения</CardTitle>
                      <CardDescription>
                        Этот порядок увидит ребенок в кабинете после открытия назначенного упражнения.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedItems.length === 0 ? (
                        <div className="rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
                          Добавьте хотя бы одну карточку.
                        </div>
                      ) : (
                        selectedItems.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl border p-3"
                          >
                            <div className="min-w-0">
                              <div className="font-medium">
                                {index + 1}. {item.word}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.soundGroup} · {item.targetSound} · {item.slug}
                              </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={index === 0}
                                onClick={() => moveItem(item.id, "up")}
                              >
                                <ArrowUp className="size-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={index === selectedItems.length - 1}
                                onClick={() => moveItem(item.id, "down")}
                              >
                                <ArrowDown className="size-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => removeItem(item.id)}>
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              {formError ? <FieldError>{formError}</FieldError> : null}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => closeDrawer(false)}>
                  Отмена
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Сохраняем..." : editingDiagnostic ? "Сохранить изменения" : "Создать упражнение"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
