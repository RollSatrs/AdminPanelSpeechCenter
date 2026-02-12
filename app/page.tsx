"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { User, BookOpen, LogOut } from "lucide-react"
import { api, apiGet } from "@/lib/api"


export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      try {
        await api.get("/auth/me", {withCredentials: true}) // ⬅ проверка JWT
        setLoading(false)
      } catch {
        router.push("/login") // ❌ нет токена → логин
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Проверка сессии...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-2xl font-semibold">Temple Dashboard</h1>

        <Button variant="ghost" className="text-white">
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard
          icon={<User />}
          title="Профиль"
          description="Личные данные и роль"
        />

        <DashboardCard
          icon={<BookOpen />}
          title="Обучение"
          description="Курсы и задания"
        />

        <DashboardCard
          icon={<BookOpen />}
          title="Прогресс"
          description="Результаты и баллы"
        />
      </div>
    </main>
  )
}

function DashboardCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className="bg-white/5 border-white/10 text-white">
      <CardHeader>
        <div className="mb-2 text-white/70">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-white/60">
        {description}
      </CardContent>
    </Card>
  )
}
