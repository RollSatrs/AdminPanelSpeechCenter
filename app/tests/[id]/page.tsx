"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TestsEditorForm } from "@/components/tests-editor-form"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type TestDetailResponse = {
  id: number
  name: string
  ageFrom: number
  ageTo: number
  questions: Array<{
    id: number
    textRu: string
    textKz: string
    answers: Array<{
      id: number
      textRu: string
      textKz: string
      points: number
    }>
  }>
  rules: Array<{
    id: number
    minScore: number
    maxScore: number
    label: string
    textRu: string
    textKz: string
  }>
}

type TestDraft = {
  name: string
  ageFrom: number
  ageTo: number
  questions: Array<{
    textRu: string
    textKz: string
    answers: Array<{
      textRu: string
      textKz: string
      points: number
    }>
  }>
  rules: Array<{
    minScore: number
    maxScore: number
    label: string
    textRu: string
    textKz: string
  }>
}

export default function EditTestPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState<TestDraft | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const me = await api.get<MeResponse>("/auth/me")
        const res = await api.get<TestDetailResponse>(`/tests/${params.id}`)
        if (cancelled) return
        setAdmin(me.data.admin)
        setDraft({
          name: res.data.name,
          ageFrom: res.data.ageFrom,
          ageTo: res.data.ageTo,
          questions: res.data.questions.map((q) => ({
            textRu: q.textRu,
            textKz: q.textKz,
            answers: q.answers.map((a) => ({
              textRu: a.textRu,
              textKz: a.textKz,
              points: a.points,
            })),
          })),
          rules: res.data.rules.map((r) => ({
            minScore: r.minScore,
            maxScore: r.maxScore,
            label: r.label,
            textRu: r.textRu,
            textKz: r.textKz,
          })),
        })
      } catch (err) {
        if (cancelled) return
        if (err instanceof AxiosError && err.response?.status === 401) {
          router.push("/login")
          return
        }
        setError("Не удалось загрузить тест.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [params.id, router])

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
          <h1 className="text-xl font-semibold">Редактирование теста</h1>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          {draft ? <TestsEditorForm mode="edit" testId={Number(params.id)} initial={draft} /> : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
