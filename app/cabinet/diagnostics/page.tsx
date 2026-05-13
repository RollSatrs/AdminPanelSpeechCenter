"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { ArrowRight, Play, RotateCw, Stethoscope } from "lucide-react"
import { api } from "@/lib/api"
import { ParentCabinetFrame } from "@/components/parent-cabinet-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type DiagnosticsOverviewResponse = {
  ok: boolean
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

type AssignedDiagnostic = DiagnosticsOverviewResponse["children"][number]["diagnostics"][number]

function languageLabel(value: "ru" | "kz" | "both") {
  if (value === "ru") return "Русский"
  if (value === "kz") return "Казахский"
  return "Русский и казахский"
}

function assignmentStatusLabel(status: AssignedDiagnostic["status"]) {
  if (status === "reviewed") return "Проверено"
  if (status === "submitted") return "Отправлено"
  if (status === "in_progress") return "В процессе"
  return "Назначено"
}

function sessionStatusLabel(status: NonNullable<AssignedDiagnostic["session"]>["status"]) {
  if (status === "reviewed") return "Проверено"
  if (status === "submitted") return "Отправлено"
  if (status === "in_progress") return "В процессе"
  return "Не начато"
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ru-RU")
}

export default function CabinetDiagnosticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [data, setData] = useState<DiagnosticsOverviewResponse | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await api.get<DiagnosticsOverviewResponse>("/cabinet/diagnostics")
        if (!cancelled) {
          setData(response.data)
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof AxiosError && err.response?.status === 401) {
          router.push("/cabinet/login")
          return
        }
        setError("Не удалось загрузить упражнения.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  async function handleStart(assignmentId: number) {
    if (startingId) return
    setStartingId(assignmentId)

    try {
      const response = await api.post<{ ok: boolean; sessionId: number }>("/cabinet/diagnostics", { assignmentId })
      router.push(`/cabinet/diagnostics/${response.data.sessionId}`)
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось открыть упражнение")
          : "Не удалось открыть упражнение"
      setError(message)
    } finally {
      setStartingId(null)
    }
  }

  return (
    <ParentCabinetFrame
      title="Упражнения"
      description="Здесь отображаются только те упражнения, которые администратор прикрепил конкретному ребенку. Внутри уже открываются карточки и запись голоса."
    >
      {loading ? (
        <div className="rounded-[28px] border border-black/10 bg-white px-5 py-8 text-sm text-black/55">
          Загружаем упражнения...
        </div>
      ) : error && !data ? (
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-8 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm font-medium text-black/62">
                  <Stethoscope className="size-4" />
                  Как устроен процесс
                </div>
                <CardTitle className="text-black">Слово, изображение, запись голоса</CardTitle>
                <CardDescription>
                  Сначала ребенку назначают упражнение, а уже внутри него идут карточки по словам и звукам. Каждая запись сохраняется отдельно по конкретному слову.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm leading-6 text-black/65">
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  1. Откройте одно из назначенных упражнений.
                </div>
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  2. Внутри упражнения ребёнок видит карточки в порядке, который собрал администратор.
                </div>
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  3. После записи система сохраняет голос по конкретному слову и готовит основу для дальнейшего анализа.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Что уже заложено</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6 text-black/62">
                <div>Упражнения назначаются адресно ребенку.</div>
                <div>Карточки внутри упражнения идут в отдельном порядке.</div>
                <div>У карточки есть место под изображение и подпись.</div>
                <div>После этого можно подключать ИИ-анализ по слову и звуку.</div>
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            {data?.children.map((child) => {
              return (
                <Card key={child.id} className="rounded-[30px] border-black/10 bg-white shadow-none">
                  <CardHeader className="border-b border-black/8">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-black">{child.fullName}</CardTitle>
                        <CardDescription>
                          {formatDate(child.birthDate)} · {languageLabel(child.language)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/68">
                        {child.diagnostics.length > 0 ? `${child.diagnostics.length} шт.` : "Нет назначений"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-5">
                    {child.diagnostics.length === 0 ? (
                      <div className="rounded-[22px] border border-dashed border-black/10 bg-[#FAFAF8] p-4 text-sm leading-6 text-black/58">
                        Для этого ребенка пока нет прикрепленных упражнений. После назначения они появятся здесь отдельным списком.
                      </div>
                    ) : (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {child.diagnostics.map((diagnostic) => {
                          const session = diagnostic.session
                          const canOpenSession = Boolean(session?.sessionId)
                          const progress = session ? `${session.recordedItems} / ${session.totalItems}` : `0 / ${diagnostic.diagnostic.totalItems}`

                          return (
                            <div
                              key={diagnostic.assignmentId}
                              className="rounded-[24px] border border-black/10 bg-[#F8F8F5] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="font-medium text-black">{diagnostic.diagnostic.title}</div>
                                  <div className="text-sm text-black/58">
                                    {languageLabel(diagnostic.diagnostic.language)} · {diagnostic.diagnostic.totalItems} карточек
                                  </div>
                                </div>
                                <Badge variant="outline" className="border-black/10 bg-white text-black/68">
                                  {session ? sessionStatusLabel(session.status) : assignmentStatusLabel(diagnostic.status)}
                                </Badge>
                              </div>

                              <div className="mt-4 rounded-[18px] border border-black/10 bg-white p-4">
                                <div className="flex items-center justify-between text-sm text-black/62">
                                  <span>Прогресс</span>
                                  <span>{progress}</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/8">
                                  <div
                                    className="h-full rounded-full bg-black transition-all"
                                    style={{
                                      width:
                                        (session?.totalItems ?? diagnostic.diagnostic.totalItems) > 0
                                          ? `${(((session?.recordedItems ?? 0) / (session?.totalItems ?? diagnostic.diagnostic.totalItems)) * 100).toFixed(1)}%`
                                          : "0%",
                                    }}
                                  />
                                </div>
                                <div className="mt-3 text-sm text-black/58">
                                    {diagnostic.diagnostic.description || "Откройте упражнение, чтобы пройти карточки по порядку."}
                                </div>
                              </div>

                              <div className="mt-4 flex gap-3">
                                {canOpenSession ? (
                                  <>
                                    <Button asChild className="flex-1 rounded-full bg-black text-white hover:bg-black/90">
                                      <Link href={`/cabinet/diagnostics/${session?.sessionId}`}>
                                        {session?.status === "in_progress" ? "Продолжить" : "Открыть"}
                                        {session?.status === "in_progress" ? <RotateCw className="size-4" /> : <ArrowRight className="size-4" />}
                                      </Link>
                                    </Button>
                                    <Button asChild variant="outline" className="rounded-full border-black/10 bg-white">
                                      <Link href={`/cabinet/diagnostics/${session?.sessionId}`}>
                                        <ArrowRight className="size-4" />
                                      </Link>
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    type="button"
                                    className="flex-1 rounded-full bg-black text-white hover:bg-black/90"
                                    onClick={() => handleStart(diagnostic.assignmentId)}
                                    disabled={startingId === diagnostic.assignmentId}
                                  >
                                    {startingId === diagnostic.assignmentId ? "Открываем..." : "Начать"}
                                    <Play className="size-4" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </section>

          {error ? (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>
      )}
    </ParentCabinetFrame>
  )
}
