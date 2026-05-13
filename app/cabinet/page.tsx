"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Layers3, Sparkles } from "lucide-react"
import { api } from "@/lib/api"
import { ParentCabinetFrame } from "@/components/parent-cabinet-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type CabinetExercisesResponse = {
  ok: boolean
  parent: {
    id: number
    fullName: string
    phone: string
    login: string
  }
  children: Array<{
    id: number
    fullName: string
    birthDate: string
    language: "ru" | "kz" | "both"
    diagnostics: Array<{
      assignmentId: number
      status: "assigned" | "in_progress" | "submitted" | "reviewed"
      assignedAt: string
      diagnostic: {
        id: number
        title: string
        description: string | null
        language: "ru" | "kz" | "both"
        totalItems: number
      }
      session: null | {
        sessionId: number
        status: "not_started" | "in_progress" | "submitted" | "reviewed"
        currentItemOrder: number
        recordedItems: number
        totalItems: number
        startedAt: string | null
        submittedAt: string | null
      }
    }>
  }>
}

function languageLabel(value: "ru" | "kz" | "both"): string {
  if (value === "ru") return "Русский"
  if (value === "kz") return "Казахский"
  return "Русский и казахский"
}

function statusLabel(
  assignment: CabinetExercisesResponse["children"][number]["diagnostics"][number]
): string {
  if (assignment.session?.status === "reviewed" || assignment.status === "reviewed") return "Проверено"
  if (assignment.session?.status === "submitted" || assignment.status === "submitted") return "Отправлено"
  if (assignment.session?.status === "in_progress" || assignment.status === "in_progress") return "В процессе"
  return "Назначено"
}

function statusTone(
  assignment: CabinetExercisesResponse["children"][number]["diagnostics"][number]
): string {
  if (assignment.session?.status === "reviewed" || assignment.status === "reviewed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700"
  }
  if (assignment.session?.status === "submitted" || assignment.status === "submitted") {
    return "border-violet-200 bg-violet-50 text-violet-700"
  }
  if (assignment.session?.status === "in_progress" || assignment.status === "in_progress") {
    return "border-sky-200 bg-sky-50 text-sky-700"
  }
  return "border-[#F0CDBD] bg-[#FFF4EE] text-[#A0614E]"
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ru-RU")
}

export default function ParentCabinetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [data, setData] = useState<CabinetExercisesResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await api.get<CabinetExercisesResponse>("/cabinet/diagnostics")
        if (!cancelled) {
          setData(response.data)
        }
      } catch {
        if (!cancelled) router.push("/cabinet/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  const allExercises = useMemo(() => {
    return (
      data?.children.flatMap((child) =>
        child.diagnostics.map((assignment) => ({
          child,
          assignment,
        }))
      ) ?? []
    )
  }, [data])

  const stats = useMemo(() => {
    return {
      totalChildren: data?.children.length ?? 0,
      totalAssignments: allExercises.length,
      inProgress: allExercises.filter(
        ({ assignment }) =>
          assignment.session?.status === "in_progress" || assignment.status === "in_progress"
      ).length,
      reviewed: allExercises.filter(
        ({ assignment }) =>
          assignment.session?.status === "reviewed" || assignment.status === "reviewed"
      ).length,
    }
  }, [allExercises, data?.children.length])

  const nextExercise = useMemo(() => {
    return (
      allExercises.find(({ assignment }) => assignment.session?.status === "in_progress") ??
      allExercises.find(({ assignment }) => assignment.status !== "reviewed")
    )
  }, [allExercises])

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)

    try {
      await api.post("/parent-auth/logout")
      router.push("/cabinet/login")
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка кабинета...</div>
  }

  if (!data) {
    return null
  }

  const actions = (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button asChild className="min-w-44 rounded-full bg-black text-white hover:bg-black/90">
        <Link href={nextExercise?.assignment.session?.sessionId ? `/cabinet/diagnostics/${nextExercise.assignment.session.sessionId}` : "/cabinet/diagnostics"}>
          {nextExercise?.assignment.session?.sessionId ? "Продолжить упражнение" : "Открыть упражнения"}
        </Link>
      </Button>
      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={loggingOut}
        className="rounded-full border-black/15 bg-white"
      >
        {loggingOut ? "Выход..." : "Выйти"}
      </Button>
    </div>
  )

  return (
    <ParentCabinetFrame
      title="Личный кабинет"
      description="Здесь собраны назначенные упражнения с карточками. Работайте спокойно, по одному слову и одной записи за раз."
      actions={actions}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[32px] border border-black/10 bg-white px-5 py-6 shadow-sm md:px-8 md:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F6F6F3] px-4 py-2 text-sm font-medium text-black/70">
                <Sparkles className="size-4" />
                Пространство домашних занятий
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-black md:text-4xl">
                {data.parent.fullName}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-black/68 md:text-base">
                Администратор назначает ребенку целые упражнения, а внутри уже открываются карточки по словам и звукам. Каждая запись сохраняется отдельно.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-black/56">
                <span>Телефон: {data.parent.phone}</span>
                <span>·</span>
                <span>Логин: {data.parent.login}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-medium text-black/62">
                <Layers3 className="size-4" />
                Упражнения по карточкам
              </div>
              <CardTitle className="text-black">Контейнер с собственным порядком карточек</CardTitle>
              <CardDescription>
                Сначала открывается назначенное упражнение, а внутри ребёнок проходит все карточки в порядке, который собрал администратор.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <p className="max-w-2xl text-sm leading-6 text-black/62">
                В каждом упражнении могут быть свои слова, изображения и целевые звуки. Родитель видит только те упражнения, которые уже прикреплены ребенку.
              </p>
              <Button asChild className="rounded-full bg-black text-white hover:bg-black/90">
                <Link href="/cabinet/diagnostics">Открыть упражнения</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>Быстрый статус</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-black/62">
              <div>Детей в кабинете: {stats.totalChildren}</div>
              <div>Назначено упражнений: {stats.totalAssignments}</div>
              <div>Сейчас в работе: {stats.inProgress}</div>
              <div>Проверено: {stats.reviewed}</div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>Дети</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-black">{stats.totalChildren}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>Всего упражнений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-black">{stats.totalAssignments}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>В процессе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-black">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card className="rounded-[28px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>Проверено</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-black">{stats.reviewed}</div>
            </CardContent>
          </Card>
        </section>

        <section id="exercises" className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
            <CardHeader>
              <CardTitle>Профили детей</CardTitle>
              <CardDescription>Упражнения назначаются отдельно для каждого ребёнка.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.children.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-black/10 px-4 py-5 text-sm text-muted-foreground">
                  Пока нет добавленных детей.
                </div>
              ) : (
                data.children.map((child) => (
                  <div
                    key={child.id}
                    className="rounded-[24px] border border-black/10 bg-[#F8F8F5] p-4"
                  >
                    <div className="text-lg font-semibold text-black">{child.fullName}</div>
                    <div className="mt-1 text-sm text-black/62">Дата рождения: {formatDate(child.birthDate)}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge variant="outline">{languageLabel(child.language)}</Badge>
                      <span className="text-sm text-black/55">{child.diagnostics.length} упражнений</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="space-y-5">
            {data.children.map((child) => (
              <Card key={child.id} className="rounded-[30px] border-black/10 bg-white shadow-none">
                <CardHeader className="border-b border-black/8">
                  <CardTitle>{child.fullName}</CardTitle>
                  <CardDescription>
                    Назначенные упражнения для домашней практики.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-5">
                  {child.diagnostics.length === 0 ? (
                    <div className="rounded-[24px] border border-dashed border-black/10 bg-[#FAFAF8] px-5 py-8 text-sm text-black/55">
                      Для этого ребёнка пока нет назначенных упражнений.
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {child.diagnostics.map((assignment) => {
                        const progress = assignment.session
                          ? `${assignment.session.recordedItems} / ${assignment.session.totalItems}`
                          : `0 / ${assignment.diagnostic.totalItems}`

                        return (
                          <div
                            key={assignment.assignmentId}
                            className="rounded-[28px] border border-black/10 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xl font-semibold text-black">
                                  {assignment.diagnostic.title}
                                </div>
                                <div className="mt-1 text-sm text-black/62">
                                  {languageLabel(assignment.diagnostic.language)}
                                </div>
                              </div>
                              <Badge variant="outline" className={statusTone(assignment)}>
                                {statusLabel(assignment)}
                              </Badge>
                            </div>

                            <p className="mt-3 min-h-[72px] text-sm leading-6 text-black/68">
                              {assignment.diagnostic.description ??
                                "Карточки внутри упражнения открываются по порядку и сохраняются отдельно."}
                            </p>

                            <div className="mt-4 rounded-[20px] border border-black/10 bg-[#F8F8F5] p-4">
                              <div className="flex items-center justify-between text-sm text-black/62">
                                <span>Прогресс</span>
                                <span>{progress}</span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
                                <div
                                  className="h-full rounded-full bg-black transition-all"
                                  style={{
                                    width:
                                      (assignment.session?.totalItems ?? assignment.diagnostic.totalItems) > 0
                                        ? `${(((assignment.session?.recordedItems ?? 0) / (assignment.session?.totalItems ?? assignment.diagnostic.totalItems)) * 100).toFixed(1)}%`
                                        : "0%",
                                  }}
                                />
                              </div>
                            </div>

                            <Button asChild className="mt-4 w-full rounded-full bg-black text-white hover:bg-black/90">
                              <Link href={assignment.session?.sessionId ? `/cabinet/diagnostics/${assignment.session.sessionId}` : "/cabinet/diagnostics"}>
                                {assignment.session?.sessionId ? "Открыть упражнение" : "К списку упражнений"}
                              </Link>
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </ParentCabinetFrame>
  )
}
