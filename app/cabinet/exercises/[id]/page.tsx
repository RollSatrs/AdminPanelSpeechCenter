"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Mic, PauseCircle, PlayCircle, Square } from "lucide-react"
import { AxiosError } from "axios"
import { LiveAudioWaveform } from "@/components/live-audio-waveform"
import { ParentCabinetFrame } from "@/components/parent-cabinet-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"

type AssignmentDetailResponse = {
  ok: boolean
  assignment: {
    id: number
    child: {
      id: number
      fullName: string
      birthDate: string
      language: "ru" | "kz" | "both"
    }
    status: "assigned" | "in_progress" | "completed"
    notes: string | null
    assignedAt: string
    completedAt: string | null
    exercise: {
      id: number
      slug: string
      title: string
      word: string
      targetSound: string | null
      imageEmoji: string
      accentColor: string
      samplePrompt: string | null
      helperText: string | null
    }
  }
}

function statusLabel(status: AssignmentDetailResponse["assignment"]["status"]) {
  if (status === "completed") return "Завершено"
  if (status === "in_progress") return "В процессе"
  return "Готово к занятию"
}

function statusTone(status: AssignmentDetailResponse["assignment"]["status"]) {
  if (status === "completed") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (status === "in_progress") return "border-sky-200 bg-sky-50 text-sky-700"
  return "border-[#F0CDBD] bg-[#FFF4EE] text-[#A0614E]"
}

export default function CabinetExercisePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [savingStatus, setSavingStatus] = useState(false)
  const [data, setData] = useState<AssignmentDetailResponse | null>(null)
  const [error, setError] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recorderError, setRecorderError] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await api.get<AssignmentDetailResponse>(`/cabinet/assignments/${params.id}`)
        if (cancelled) return

        setData(response.data)
        if (response.data.assignment.status === "assigned") {
          await api.patch(`/cabinet/assignments/${params.id}`, { status: "in_progress" })
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  assignment: {
                    ...prev.assignment,
                    status: "in_progress",
                  },
                }
              : prev
          )
        }
      } catch (err) {
        if (cancelled) return
        if (err instanceof AxiosError && err.response?.status === 401) {
          router.push("/cabinet/login")
          return
        }
        setError("Не удалось загрузить упражнение.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      window.speechSynthesis?.cancel()
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl)
      }
    }
  }, [params.id, router, recordedUrl])

  async function handleSpeak() {
    if (!data) return
    if (!("speechSynthesis" in window)) {
      setRecorderError("В этом браузере не поддерживается озвучивание слова.")
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(data.assignment.exercise.word)
    utterance.lang = "ru-RU"
    utterance.rate = 0.82
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => {
      setIsSpeaking(false)
      setRecorderError("Не удалось озвучить слово.")
    }
    window.speechSynthesis.speak(utterance)
  }

  async function startRecording() {
    try {
      setRecorderError("")

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl)
        }
        setRecordedUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach((track) => track.stop())
        setIsRecording(false)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setRecorderError("Не удалось получить доступ к микрофону.")
      setIsRecording(false)
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  async function handleComplete() {
    if (!data || savingStatus) return
    try {
      setSavingStatus(true)
      await api.patch(`/cabinet/assignments/${params.id}`, { status: "completed" })
      setData((prev) =>
        prev
          ? {
              ...prev,
              assignment: {
                ...prev.assignment,
                status: "completed",
                completedAt: new Date().toISOString(),
              },
            }
          : prev
      )
    } finally {
      setSavingStatus(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка упражнения...</div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">{error || "Упражнение недоступно."}</div>
  }

  const assignment = data.assignment

  return (
    <ParentCabinetFrame
      title={assignment.exercise.word}
      description="Домашняя практика строится по карточкам: слово, опорный образец и запись голоса ребёнка."
      actions={
        <Badge variant="outline" className={statusTone(assignment.status)}>
          {statusLabel(assignment.status)}
        </Badge>
      }
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex items-center justify-between">
          <Button asChild variant="outline" className="rounded-full border-black/10 bg-white">
            <Link href="/cabinet">
              <ArrowLeft className="size-4" />
              Назад в кабинет
            </Link>
          </Button>
        </div>

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[34px] border-black/10 bg-white shadow-none">
            <CardContent className="px-5 py-5 md:px-8 md:py-8">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/72">
                  {assignment.child.fullName}
                </Badge>
                {assignment.exercise.targetSound ? (
                  <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/72">
                    Тренируем звук {assignment.exercise.targetSound}
                  </Badge>
                ) : null}
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-[240px_minmax(0,1fr)] md:items-center">
                <div
                  className="flex min-h-[240px] items-center justify-center rounded-[30px] text-[110px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  style={{
                    background: `linear-gradient(135deg, ${assignment.exercise.accentColor}28 0%, #f7f7f4 100%)`,
                  }}
                >
                  <span>{assignment.exercise.imageEmoji}</span>
                </div>

                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.18em] text-black/48">
                    Практика слова
                  </p>
                  <h2 className="mt-3 text-4xl font-semibold text-black md:text-5xl">{assignment.exercise.word}</h2>
                  <p className="mt-4 text-sm leading-6 text-black/68 md:text-base">
                    {assignment.exercise.samplePrompt ??
                      "Сначала включите образец, затем повторите слово вместе с ребёнком и запишите ответ."}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-black/68">
                    {assignment.exercise.helperText}
                  </p>
                  {assignment.notes ? (
                    <div className="mt-4 rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3 text-sm text-black/70">
                      <span className="font-medium text-black">Заметка администратора:</span> {assignment.notes}
                    </div>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Как проводить упражнение</CardTitle>
                <CardDescription>Короткая последовательность для родителя рядом с ребёнком.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm leading-6 text-black/68">
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  1. Сначала послушайте слово вместе с ребёнком и проговорите его медленно.
                </div>
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  2. Записывайте голос только в тихом месте, чтобы речь звучала чётко и без шума.
                </div>
                <div className="rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3">
                  3. После записи прослушайте результат и при необходимости повторите ещё раз.
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Управление занятием</CardTitle>
                <CardDescription>Включите образец и запишите ответ ребёнка.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    className="rounded-full bg-black text-white hover:bg-black/90"
                    onClick={handleSpeak}
                    disabled={isSpeaking}
                  >
                    {isSpeaking ? (
                      <>
                        <PauseCircle className="size-4" />
                        Проигрывается...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="size-4" />
                        Слушать образец
                      </>
                    )}
                  </Button>

                  {!isRecording ? (
                    <Button type="button" variant="outline" className="rounded-full border-black/10 bg-white" onClick={startRecording}>
                      <Mic className="size-4" />
                      Записать голос
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" className="rounded-full border-black/10 bg-white" onClick={stopRecording}>
                      <Square className="size-4" />
                      Остановить запись
                    </Button>
                  )}
                </div>

                {recorderError ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {recorderError}
                  </div>
                ) : null}

                {recordedUrl ? (
                  <LiveAudioWaveform title="Ваша запись" src={recordedUrl} />
                ) : (
                  <div className="rounded-[24px] border border-dashed border-black/10 bg-[#FAFAF8] px-5 py-8 text-sm text-black/58">
                    После записи здесь появится аудио ребёнка, которое можно сразу прослушать.
                  </div>
                )}

                <div className="rounded-[24px] border border-black/10 bg-[#F8F8F5] px-4 py-4">
                  <div className="text-sm font-medium text-black">Следующий этап</div>
                  <p className="mt-2 text-sm leading-6 text-black/66">
                    На следующем этапе сюда подключим распознавание речи и автоматическую голосовую
                    подсказку по произношению.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full border-black/10 bg-white"
                  onClick={handleComplete}
                  disabled={savingStatus || assignment.status === "completed"}
                >
                  {savingStatus
                    ? "Сохраняем..."
                    : assignment.status === "completed"
                      ? "Упражнение завершено"
                      : "Отметить как выполненное"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ParentCabinetFrame>
  )
}
