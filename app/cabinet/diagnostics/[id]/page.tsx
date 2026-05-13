"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { AxiosError } from "axios"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  PauseCircle,
  PlayCircle,
  Send,
  Square,
} from "lucide-react"
import { LiveAudioWaveform } from "@/components/live-audio-waveform"
import { ParentCabinetFrame } from "@/components/parent-cabinet-frame"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { resolvePreferredLanguage } from "@/lib/diagnostic-card-config"

type DiagnosticSessionResponse = {
  ok: boolean
  session: {
    id: number
    assignmentId: number | null
    status: "not_started" | "in_progress" | "submitted" | "reviewed"
    currentItemOrder: number
    startedAt: string | null
    submittedAt: string | null
    reviewedAt: string | null
    diagnostic: {
      id: number | null
      title: string
      description: string | null
    }
    progress: {
      recordedItems: number
      totalItems: number
    }
    child: {
      id: number
      fullName: string
      birthDate: string
      language: "ru" | "kz" | "both"
    }
    items: Array<{
      responseId: number
      item: {
        id: number
        slug: string
        language: "ru" | "kz" | "both"
        soundGroup: string
        targetSound: string
        title: string
        word: string
        prompt: string | null
        helperText: string | null
        imageUrl: string | null
        imageAlt: string | null
        imageEmoji: string
        accentColor: string
        sortOrder: number
      }
      status: "pending" | "recorded" | "submitted" | "analyzed"
      audioUrl: string | null
      audioMimeType: string | null
      audioDurationMs: number | null
      transcript: string | null
      aiStatus: "not_requested" | "queued" | "completed" | "failed"
      aiSummary: string | null
      recordedAt: string | null
      analyzedAt: string | null
    }>
  }
}

function statusLabel(status: DiagnosticSessionResponse["session"]["status"]) {
  if (status === "reviewed") return "Проверено"
  if (status === "submitted") return "Отправлено"
  if (status === "in_progress") return "В процессе"
  return "Не начато"
}

function itemStatusLabel(status: DiagnosticSessionResponse["session"]["items"][number]["status"]) {
  if (status === "analyzed") return "Проанализировано"
  if (status === "submitted") return "Отправлено"
  if (status === "recorded") return "Записано"
  return "Ожидает запись"
}

function resolveSpeechLocale(language: "ru" | "kz" | "both") {
  return resolvePreferredLanguage(language) === "kz" ? "kk-KZ" : "ru-RU"
}

function pickBestVoice(voices: SpeechSynthesisVoice[], locale: string) {
  const normalizedLocale = locale.toLowerCase()
  const localePrefix = normalizedLocale.split("-")[0]

  return [...voices]
    .map((voice) => {
      const voiceLang = voice.lang.toLowerCase()
      const voiceName = voice.name.toLowerCase()
      let score = 0

      if (voiceLang === normalizedLocale) score += 120
      else if (voiceLang.startsWith(`${localePrefix}-`) || voiceLang === localePrefix) score += 90

      if (voice.localService) score += 20
      if (voice.default) score += 10
      if (/google|microsoft|apple|yandex|natural|neural|premium|enhanced/.test(voiceName)) score += 25
      if (/compact|eloquence|robot/.test(voiceName)) score -= 10

      return { voice, score }
    })
    .sort((left, right) => right.score - left.score)[0]?.voice
}

export default function DiagnosticSessionPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DiagnosticSessionResponse | null>(null)
  const [error, setError] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recorderError, setRecorderError] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
  const [speechVoices, setSpeechVoices] = useState<SpeechSynthesisVoice[]>([])
  const [aiAnalysis, setAiAnalysis] = useState<{ transcript: string; summary: string; ok: boolean | null } | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingStartedAtRef = useRef<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null)
  const liveTranscriptRef = useRef<string>("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await api.get<DiagnosticSessionResponse>(`/cabinet/diagnostics/${params.id}`)
        if (cancelled) return

        setData(response.data)
        const firstPendingIndex = response.data.session.items.findIndex((item) => item.status === "pending")
        setCurrentIndex(firstPendingIndex >= 0 ? firstPendingIndex : 0)
      } catch (err) {
        if (cancelled) return
        if (err instanceof AxiosError && err.response?.status === 401) {
          router.push("/cabinet/login")
          return
        }
        setError("Не удалось загрузить упражнение.")
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
      window.speechSynthesis?.cancel()
    }
  }, [params.id, router])

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const syncVoices = () => {
      setSpeechVoices(window.speechSynthesis.getVoices())
    }

    syncVoices()
    window.speechSynthesis.addEventListener("voiceschanged", syncVoices)

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", syncVoices)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
      }
    }
  }, [localPreviewUrl])

  const currentItem = useMemo(() => {
    return data?.session.items[currentIndex] ?? null
  }, [currentIndex, data])

  const allRecorded = useMemo(() => {
    return data?.session.items.every((item) => item.status !== "pending") ?? false
  }, [data])

  function selectIndex(nextIndex: number) {
    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
      setLocalPreviewUrl(null)
    }
    setCurrentIndex(nextIndex)
    setAiAnalysis(null)
  }

  function analyzeSpeech(transcript: string, word: string, targetSound: string, helperText: string | null) {
    const t = transcript.toLowerCase().trim()
    const w = word.toLowerCase().trim()
    const ts = targetSound.toLowerCase().trim()

    if (!t) {
      return { transcript, summary: "Речь не была распознана. Попробуйте записать ещё раз в тихом месте.", ok: false as const }
    }

    const tWords = t.split(/\s+/)
    const wordMatch = tWords.some(
      (tw) => tw === w || (tw.length >= 2 && w.includes(tw)) || (tw.length >= 2 && tw.includes(w))
    )
    const soundHeard = t.includes(ts)
    const soundExpected = w.includes(ts)

    if (wordMatch) {
      return { transcript, summary: `Слово «${word}» произнесено верно. Звук «${targetSound}» слышен чётко.`, ok: true as const }
    }

    if (soundExpected && !soundHeard) {
      const extra = helperText ? ` ${helperText}` : ""
      return {
        transcript,
        summary: `Ошибка: звук «${targetSound}» не был услышан. Ожидалось слово «${word}», распознано: «${transcript}».${extra}`,
        ok: false as const,
      }
    }

    if (soundExpected && soundHeard && !wordMatch) {
      return {
        transcript,
        summary: `Звук «${targetSound}» присутствует, но слово произнесено иначе. Ожидалось: «${word}», распознано: «${transcript}».`,
        ok: null,
      }
    }

    return {
      transcript,
      summary: `Слово произнесено иначе, чем ожидалось. Ожидалось: «${word}», распознано: «${transcript}».`,
      ok: null,
    }
  }

  async function handleSpeak() {
    if (!currentItem || !data) return
    if (!("speechSynthesis" in window)) {
      setRecorderError("В этом браузере не поддерживается озвучивание слова.")
      return
    }

    setRecorderError("")
    window.speechSynthesis.cancel()
    const locale = resolveSpeechLocale(data.session.child.language)
    const utterance = new SpeechSynthesisUtterance(currentItem.item.word)
    utterance.lang = locale
    utterance.voice = pickBestVoice(
      speechVoices.length > 0 ? speechVoices : window.speechSynthesis.getVoices(),
      locale
    ) ?? null
    utterance.rate = locale === "kk-KZ" ? 0.76 : 0.8
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
      setAiAnalysis(null)
      liveTranscriptRef.current = ""

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recordingStartedAtRef.current = Date.now()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognitionCtor = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
      if (SpeechRecognitionCtor && data && currentItem) {
        const recognition = new SpeechRecognitionCtor()
        recognition.lang = resolveSpeechLocale(data.session.child.language)
        recognition.continuous = true
        recognition.interimResults = true
        recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
          let final = ""
          for (let i = 0; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              final += event.results[i][0].transcript
            }
          }
          if (final) liveTranscriptRef.current = final
        }
        try {
          recognition.start()
          recognitionRef.current = recognition
        } catch {
          recognitionRef.current = null
        }
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" })
        stream.getTracks().forEach((track) => track.stop())

        if (recognitionRef.current) {
          try { recognitionRef.current.stop() } catch { /* ignore */ }
          recognitionRef.current = null
        }

        setIsRecording(false)
        await uploadRecording(blob, recorder.mimeType || "audio/webm", liveTranscriptRef.current)
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

  async function uploadRecording(blob: Blob, mimeType: string, transcript = "") {
    if (!currentItem || !data) return

    if (localPreviewUrl) {
      URL.revokeObjectURL(localPreviewUrl)
    }
    const previewUrl = URL.createObjectURL(blob)
    setLocalPreviewUrl(previewUrl)
    setUploading(true)

    try {
      const formData = new FormData()
      const extension = mimeType.includes("wav") ? "wav" : "webm"
      formData.append("audio", new File([blob], `diagnostic-${currentItem.item.slug}.${extension}`, { type: mimeType }))

      const startedAt = recordingStartedAtRef.current
      const durationMs = startedAt ? Date.now() - startedAt : 0
      formData.append("durationMs", String(durationMs))

      const analysis = analyzeSpeech(
        transcript,
        currentItem.item.word,
        currentItem.item.targetSound,
        currentItem.item.helperText
      )
      formData.append("transcript", analysis.transcript)
      formData.append("aiSummary", analysis.summary)

      const response = await api.post<{ ok: boolean; audioUrl: string }>(
        `/cabinet/diagnostics/${data.session.id}/items/${currentItem.item.id}/recording`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )

      setData((prev) =>
        prev
          ? {
              ...prev,
              session: {
                ...prev.session,
                status: "in_progress",
                progress: {
                  recordedItems: prev.session.items.filter((item) => item.status !== "pending").length + (currentItem.status === "pending" ? 1 : 0),
                  totalItems: prev.session.progress.totalItems,
                },
                items: prev.session.items.map((item) =>
                  item.item.id === currentItem.item.id
                    ? {
                        ...item,
                        status: "recorded",
                        audioUrl: response.data.audioUrl,
                        audioMimeType: mimeType,
                        audioDurationMs: durationMs,
                        recordedAt: new Date().toISOString(),
                      }
                    : item
                ),
              },
            }
          : prev
      )
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setLocalPreviewUrl(null)
      if (analysis.transcript) {
        setAiAnalysis(analysis)
      }
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось сохранить запись")
          : "Не удалось сохранить запись"
      setRecorderError(message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit() {
    if (!data || !allRecorded || submitting) return

    try {
      setSubmitting(true)
      await api.patch(`/cabinet/diagnostics/${data.session.id}`, { action: "submit" })
      setData((prev) =>
        prev
          ? {
              ...prev,
              session: {
                ...prev.session,
                status: "submitted",
                submittedAt: new Date().toISOString(),
                items: prev.session.items.map((item) =>
                  item.status === "recorded" || item.status === "analyzed"
                    ? { ...item, status: "submitted" }
                    : item
                ),
              },
            }
          : prev
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ParentCabinetFrame title="Упражнение" description="Загружаем карточки и записи ребёнка.">
        <div className="rounded-[28px] border border-black/10 bg-white px-5 py-8 text-sm text-black/55">
          Загружаем упражнение...
        </div>
      </ParentCabinetFrame>
    )
  }

  if (!data || !currentItem) {
    return (
      <ParentCabinetFrame title="Упражнение" description="Не удалось открыть упражнение.">
        <div className="rounded-[28px] border border-red-200 bg-red-50 px-5 py-8 text-sm text-red-700">
          {error || "Упражнение недоступно."}
        </div>
      </ParentCabinetFrame>
    )
  }

  const session = data.session
  const currentAudioUrl = localPreviewUrl ?? currentItem.audioUrl

  return (
    <ParentCabinetFrame
      title={`${session.diagnostic.title}: ${session.child.fullName}`}
      description={
        session.diagnostic.description ||
        "Проходите карточки последовательно: слово, визуальная опора, запись голоса. Каждая запись сохраняется отдельно."
      }
      actions={
        <Badge variant="outline" className="border-black/10 bg-white text-black/70">
          {statusLabel(session.status)}
        </Badge>
      }
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full border-black/10 bg-white">
            <Link href="/cabinet/diagnostics">
              <ArrowLeft className="size-4" />
              Назад к упражнениям
            </Link>
          </Button>

          <div className="text-sm text-black/58">
            Карточка {currentIndex + 1} из {session.items.length}
          </div>
        </div>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="rounded-[34px] border-black/10 bg-white shadow-none">
            <CardContent className="grid gap-6 px-5 py-5 md:grid-cols-[280px_minmax(0,1fr)] md:px-8 md:py-8">
              <div
                className="flex min-h-[280px] items-center justify-center overflow-hidden rounded-[30px] border border-black/10"
                style={{
                  background: `linear-gradient(135deg, ${currentItem.item.accentColor}24 0%, #f7f7f4 100%)`,
                }}
              >
                {currentItem.item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentItem.item.imageUrl}
                    alt={currentItem.item.imageAlt ?? currentItem.item.word}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[110px]">{currentItem.item.imageEmoji}</span>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/70">
                    {currentItem.item.soundGroup}
                  </Badge>
                  <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/70">
                    Целевой звук: {currentItem.item.targetSound}
                  </Badge>
                </div>

                <div className="mt-5 text-sm font-medium uppercase tracking-[0.18em] text-black/45">
                  Произнесите слово
                </div>
                <h2 className="mt-2 text-4xl font-semibold tracking-tight text-black md:text-5xl">
                  {currentItem.item.word}
                </h2>
                <p className="mt-4 text-sm leading-6 text-black/66 md:text-base">
                  {currentItem.item.prompt ?? "Покажите карточку ребёнку и попросите спокойно произнести слово."}
                </p>
                {currentItem.item.helperText ? (
                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3 text-sm leading-6 text-black/62">
                    Упор: {currentItem.item.helperText}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
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
                        Слушать слово
                      </>
                    )}
                  </Button>

                  {!isRecording ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-black/10 bg-white"
                      onClick={startRecording}
                      disabled={uploading || session.status === "submitted" || session.status === "reviewed"}
                    >
                      <Mic className="size-4" />
                      {currentItem.status === "pending" ? "Записать голос" : "Записать заново"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-black/10 bg-white"
                      onClick={stopRecording}
                    >
                      <Square className="size-4" />
                      Остановить запись
                    </Button>
                  )}
                </div>

                {recorderError ? (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {recorderError}
                  </div>
                ) : null}

                <div className="mt-5">
                  {currentAudioUrl ? (
                    <LiveAudioWaveform title="Последняя запись" src={currentAudioUrl} />
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-black/10 bg-[#FAFAF8] px-5 py-8 text-sm text-black/55">
                      После записи здесь появится сохранённое аудио для этой карточки.
                    </div>
                  )}
                </div>

                {aiAnalysis ? (
                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      aiAnalysis.ok === true
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : aiAnalysis.ok === false
                          ? "border-red-200 bg-red-50 text-red-800"
                          : "border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    <div className="font-medium">
                      {aiAnalysis.ok === true ? "Произношение верное" : aiAnalysis.ok === false ? "Обнаружена ошибка" : "Требует внимания"}
                    </div>
                    <div className="mt-1">{aiAnalysis.summary}</div>
                    {aiAnalysis.transcript ? (
                      <div className="mt-2 text-xs opacity-70">Распознано: «{aiAnalysis.transcript}»</div>
                    ) : null}
                  </div>
                ) : currentItem.aiStatus === "completed" && currentItem.aiSummary ? (
                  <div className="mt-4 rounded-2xl border border-black/10 bg-[#F8F8F5] px-4 py-3 text-sm leading-6 text-black/70">
                    <div className="font-medium">Результат анализа</div>
                    <div className="mt-1">{currentItem.aiSummary}</div>
                    {currentItem.transcript ? (
                      <div className="mt-2 text-xs opacity-60">Распознано: «{currentItem.transcript}»</div>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline" className="border-black/10 bg-[#F6F6F3] text-black/68">
                    {uploading ? "Сохраняем..." : itemStatusLabel(currentItem.status)}
                  </Badge>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-black/10 bg-white"
                      onClick={() => selectIndex(Math.max(0, currentIndex - 1))}
                      disabled={currentIndex === 0}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-black/10 bg-white"
                      onClick={() => selectIndex(Math.min(session.items.length - 1, currentIndex + 1))}
                      disabled={currentIndex === session.items.length - 1}
                    >
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Прогресс</CardTitle>
                <CardDescription>
                  {session.progress.recordedItems} из {session.progress.totalItems} карточек уже записаны.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-2 overflow-hidden rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{
                      width:
                        session.progress.totalItems > 0
                          ? `${(session.progress.recordedItems / session.progress.totalItems) * 100}%`
                          : "0%",
                    }}
                  />
                </div>

                <Button
                  type="button"
                  className="mt-5 w-full rounded-full bg-black text-white hover:bg-black/90"
                  onClick={handleSubmit}
                  disabled={!allRecorded || submitting || session.status === "submitted" || session.status === "reviewed"}
                >
                  {submitting
                    ? "Отправляем..."
                    : session.status === "submitted" || session.status === "reviewed"
                      ? "Упражнение отправлено"
                      : "Завершить и отправить"}
                  <Send className="size-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[30px] border-black/10 bg-white shadow-none">
              <CardHeader>
                <CardTitle>Карточки</CardTitle>
                <CardDescription>Можно быстро переключаться между словами и следить за записью.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {session.items.map((item, index) => {
                  const isActive = index === currentIndex
                  return (
                    <button
                      key={item.responseId}
                      type="button"
                      onClick={() => selectIndex(index)}
                      className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${
                        isActive
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-[#F8F8F5] text-black"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{item.item.word}</div>
                          <div className={`mt-1 text-xs ${isActive ? "text-white/72" : "text-black/55"}`}>
                            {item.item.targetSound} · {item.item.soundGroup}
                          </div>
                        </div>
                        {item.status !== "pending" ? <Check className="size-4 shrink-0" /> : null}
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </ParentCabinetFrame>
  )
}
