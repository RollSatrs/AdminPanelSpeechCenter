"use client"

import { useEffect, useState } from "react"
import { IconFlame, IconTrendingUp, IconUserPlus, IconUsers } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { api } from "@/lib/api"

type DashboardSummaryResponse = {
  totalUsers: number
  newUsers30d: number
  warmLeads: number
  hotLeads: number
}

const initialSummary: DashboardSummaryResponse = {
  totalUsers: 0,
  newUsers30d: 0,
  warmLeads: 0,
  hotLeads: 0,
}

export function SectionCards() {
  const [summary, setSummary] = useState<DashboardSummaryResponse>(initialSummary)

  useEffect(() => {
    let cancelled = false

    async function loadSummary() {
      try {
        const res = await api.get<DashboardSummaryResponse>("/user/all", {
          withCredentials: true,
        })
        if (!cancelled) setSummary(res.data)
      } catch (error) {
        console.error("Failed to load dashboard summary", error)
        if (!cancelled) setSummary(initialSummary)
      }
    }

    loadSummary()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Всего пользователей</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.totalUsers.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers />
              Родители
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Активная база родителей</div>
          <div className="text-muted-foreground">Уникальные профили родителей в системе</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Новые за 30 дней</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.newUsers30d.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUserPlus />
              +30 дней <IconTrendingUp className="size-5" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Прирост базы пользователей 
          </div>
          <div className="text-muted-foreground">Родители, зарегистрированные за последний месяц</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Тёплые лиды</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.warmLeads.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Warm</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Потенциальный интерес к работе</div>
          <div className="text-muted-foreground">Требуют дальнейшего контакта и сопровождения</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Горячие лиды</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {summary.hotLeads.toLocaleString("ru-RU")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconFlame />
              Hot
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">Высокая готовность к следующему шагу</div>
          <div className="text-muted-foreground">Пользователи после завершения теста</div>
        </CardFooter>
      </Card>
    </div>
  )
}
