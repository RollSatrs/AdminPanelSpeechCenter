"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { Layers3, Trash2 } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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

type ExerciseAssignmentsResponse = {
  parent: {
    id: number
    fullName: string
    phone: string
  }
  children: Array<{
    id: number
    fullName: string
    birthDate: string
    language: "ru" | "kz" | "both"
  }>
  exercises: Array<{
    id: number
    slug: string
    title: string
    description: string | null
    language: "ru" | "kz" | "both"
    isActive: boolean
    itemCount: number
    previewWord: string | null
    previewSoundGroup: string | null
    previewImageEmoji: string | null
    previewAccentColor: string | null
  }>
  assignments: Array<{
    id: number
    childId: number
    childFullName: string
    exerciseId: number
    exerciseTitle: string
    exerciseDescription: string | null
    itemCount: number
    status: "assigned" | "in_progress" | "submitted" | "reviewed"
    assignedAt: string
    updatedAt: string
    submittedAt: string | null
    reviewedAt: string | null
  }>
}

function languageLabel(value: "ru" | "kz" | "both") {
  if (value === "ru") return "Русский"
  if (value === "kz") return "Казахский"
  return "Оба языка"
}

function statusLabel(status: ExerciseAssignmentsResponse["assignments"][number]["status"]) {
  if (status === "reviewed") return "Проверено"
  if (status === "submitted") return "Отправлено"
  if (status === "in_progress") return "В процессе"
  return "Назначено"
}

function statusTone(status: ExerciseAssignmentsResponse["assignments"][number]["status"]) {
  if (status === "reviewed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "submitted") return "border-violet-200 bg-violet-50 text-violet-700"
  if (status === "in_progress") return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-amber-200 bg-amber-50 text-amber-700"
}

function formatDateTime(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

export default function ParentExercisesAdminPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [data, setData] = useState<ExerciseAssignmentsResponse | null>(null)
  const [selectedChildId, setSelectedChildId] = useState<string>("")
  const [assigningExerciseId, setAssigningExerciseId] = useState<number | null>(null)
  const [removingAssignmentId, setRemovingAssignmentId] = useState<number | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [me, payload] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<ExerciseAssignmentsResponse>(`/exercise-assignments?parentId=${params.id}`),
        ])

        if (cancelled) return

        setAdmin(me.data.admin)
        setData(payload.data)
        setSelectedChildId((prev) => prev || String(payload.data.children[0]?.id ?? ""))
      } catch (err) {
        if (cancelled) return
        if (err instanceof AxiosError && err.response?.status === 401) {
          router.push("/admin/login")
          return
        }
        setError("Не удалось загрузить упражнения и назначения.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [params.id, router])

  const selectedChild = useMemo(() => {
    return data?.children.find((child) => String(child.id) === selectedChildId) ?? null
  }, [data?.children, selectedChildId])

  async function refreshData() {
    const refreshed = await api.get<ExerciseAssignmentsResponse>(`/exercise-assignments?parentId=${params.id}`)
    setData(refreshed.data)
  }

  async function handleAssignExercise(exerciseId: number) {
    if (!selectedChildId || assigningExerciseId) return

    try {
      setAssigningExerciseId(exerciseId)
      setError("")

      await api.post("/exercise-assignments", {
        childId: Number(selectedChildId),
        exerciseId,
      })

      await refreshData()
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось назначить упражнение.")
          : "Не удалось назначить упражнение."
      setError(message)
    } finally {
      setAssigningExerciseId(null)
    }
  }

  async function handleRemoveAssignment(assignmentId: number, exerciseTitle: string, childFullName: string) {
    if (removingAssignmentId) return

    const confirmed = window.confirm(
      `Снять упражнение «${exerciseTitle}» у ребенка «${childFullName}»?`
    )
    if (!confirmed) return

    try {
      setRemovingAssignmentId(assignmentId)
      setError("")
      await api.delete(`/admin/diagnostic-assignments/${assignmentId}`)
      await refreshData()
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось снять упражнение.")
          : "Не удалось снять упражнение."
      setError(message)
    } finally {
      setRemovingAssignmentId(null)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка упражнений...</div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">{error || "Данные недоступны."}</div>
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
        <main className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
          <section className="rounded-[32px] border border-[#E7DDD6] bg-[linear-gradient(135deg,#fff8f3_0%,#ffffff_45%,#fff4ef_100%)] px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.04)] md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#A0614E]">
                  Назначение упражнений
                </p>
                <h1 className="mt-2 text-3xl font-semibold text-[#251815]">{data.parent.fullName}</h1>
                <p className="mt-2 text-sm text-black/65">
                  Телефон: {data.parent.phone}. Здесь администратор назначает контейнерные упражнения конкретному ребёнку.
                </p>
              </div>
              <Button asChild variant="outline">
                <Link href={`/admin/parent/${data.parent.id}`}>Назад к карточке родителя</Link>
              </Button>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <Card className="rounded-[28px] border-[#E8DFD9] bg-white shadow-none">
              <CardHeader>
                <CardTitle>Кому назначаем</CardTitle>
                <CardDescription>
                  Выберите ребёнка. После назначения он увидит упражнение в кабинете как отдельную сущность со своими карточками.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ребёнок</label>
                  <Select value={selectedChildId} onValueChange={setSelectedChildId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите ребёнка" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.children.map((child) => (
                        <SelectItem key={child.id} value={String(child.id)}>
                          {child.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-2xl border border-[#E8DFD9] bg-[#FAF7F4] p-4">
                  <div className="text-sm text-black/60">Выбранный профиль</div>
                  <div className="mt-2 text-lg font-semibold text-[#251815]">
                    {selectedChild?.fullName ?? "—"}
                  </div>
                  <div className="mt-1 text-sm text-black/65">
                    Дата рождения: {selectedChild?.birthDate ?? "—"}
                  </div>
                  <div className="mt-1 text-sm text-black/65">
                    Язык: {selectedChild ? languageLabel(selectedChild.language) : "—"}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E8DFD9] bg-[#FAF7F4] p-4 text-sm leading-6 text-black/65">
                  Одно упражнение может содержать несколько карточек. Ребёнку назначается всё упражнение целиком, а не отдельные слова по одной.
                </div>

                {error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-5">
              <Card className="rounded-[28px] border-[#E8DFD9] bg-white shadow-none">
                <CardHeader>
                  <CardTitle>Библиотека упражнений</CardTitle>
                  <CardDescription>
                    Нажмите на карточку, чтобы назначить упражнение выбранному ребёнку.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {data.exercises.map((exercise) => (
                    <div
                      key={exercise.id}
                      className="group rounded-[26px] border border-[#E8DFD9] bg-white p-4 shadow-[0_16px_30px_rgba(0,0,0,0.03)] transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div
                        className="flex min-h-[120px] items-center justify-center rounded-[22px] text-6xl"
                        style={{
                          background: `linear-gradient(135deg, ${exercise.previewAccentColor ?? "#FF8B6A"}22 0%, #fff7f2 100%)`,
                        }}
                      >
                        <span>{exercise.previewImageEmoji ?? "🧩"}</span>
                      </div>

                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-lg font-semibold text-[#251815]">
                            {exercise.title}
                          </div>
                          <div className="truncate text-sm text-black/60">
                            {exercise.itemCount} карточек · {languageLabel(exercise.language)}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="max-w-full shrink-0 border-[#F0CDBD] bg-[#FFF4EE] text-[#A0614E]"
                        >
                          {exercise.previewSoundGroup ?? "Карточки"}
                        </Badge>
                      </div>

                      <p className="mt-3 min-h-[64px] text-sm leading-6 text-black/68">
                        {exercise.description ??
                          (exercise.previewWord
                            ? `Первая опорная карточка: ${exercise.previewWord}.`
                            : "Контейнерное упражнение с набором карточек в заданном порядке.")}
                      </p>

                      <Button
                        className="mt-4 w-full bg-[#FF7857] text-white hover:bg-[#ff6b46]"
                        onClick={() => handleAssignExercise(exercise.id)}
                        disabled={!selectedChildId || assigningExerciseId !== null}
                      >
                        {assigningExerciseId === exercise.id ? "Назначение..." : "Назначить упражнение"}
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-[#E8DFD9] bg-white shadow-none">
                <CardHeader>
                  <CardTitle>Уже назначено</CardTitle>
                  <CardDescription>История назначений для всех детей этого родителя.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-hidden rounded-2xl border border-[#E8DFD9] p-0">
                  <Table>
                    <TableHeader className="bg-[#FAF7F4]">
                      <TableRow>
                        <TableHead>Ребёнок</TableHead>
                        <TableHead>Упражнение</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead>Назначено</TableHead>
                        <TableHead className="text-right">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.assignments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Назначений пока нет
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.assignments.map((assignment) => (
                          <TableRow key={assignment.id}>
                            <TableCell>{assignment.childFullName}</TableCell>
                            <TableCell>
                              <div className="font-medium">{assignment.exerciseTitle}</div>
                              <div className="text-sm text-black/55">
                                {assignment.itemCount} карточек
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusTone(assignment.status)}>
                                {statusLabel(assignment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(assignment.assignedAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={removingAssignmentId === assignment.id}
                                onClick={() =>
                                  handleRemoveAssignment(
                                    assignment.id,
                                    assignment.exerciseTitle,
                                    assignment.childFullName
                                  )
                                }
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-[#E8DFD9] bg-white shadow-none">
                <CardHeader>
                  <CardTitle>Как это видит родитель</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm leading-6 text-black/62">
                  <div className="flex items-start gap-2">
                    <Layers3 className="mt-0.5 size-4 shrink-0" />
                    В кабинете родителя сначала отображается назначенное упражнение.
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers3 className="mt-0.5 size-4 shrink-0" />
                    После открытия упражнения внутри идут карточки по тому порядку, который собрал администратор.
                  </div>
                  <div className="flex items-start gap-2">
                    <Layers3 className="mt-0.5 size-4 shrink-0" />
                    Ребёнок проходит карточки как один цельный сценарий.
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
