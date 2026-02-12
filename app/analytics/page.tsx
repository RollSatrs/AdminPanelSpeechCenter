"use client"

import * as React from "react"
import { TrendingDown, TrendingUp } from "lucide-react"
import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
} from "recharts"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type AnalyticsResponse = {
  selectedYear: number
  selectedMonth: string
  yearRangeLabel: string
  monthRangeLabel: string
  leadsByMonth: Array<{ month: string; warm: number; hot: number }>
  uniqueParentsByMonth: Array<{ month: string; parents: number }>
  resultsDistribution: Array<{ key: string; label: string; value: number; color: string }>
  parentsByDay: Array<{ day: string; parents: number }>
  leadsByDay: Array<{ day: string; warm: number; hot: number }>
  trends: {
    yearlyLeads: { current: number; previous: number; changePct: number | null; hasEnoughData: boolean }
    yearlyParents: { current: number; previous: number; changePct: number | null; hasEnoughData: boolean }
    yearlyResults: { current: number; previous: number; changePct: number | null; hasEnoughData: boolean }
    monthlyParents: { current: number; previous: number; changePct: number | null; hasEnoughData: boolean }
    monthlyLeads: {
      currentWarm: number
      currentHot: number
      currentTotal: number
      previousWarm: number
      previousHot: number
      previousTotal: number
      changePct: number | null
      hasEnoughData: boolean
    }
  }
}

const leadsConfig = {
  warm: { label: "Тёплые", color: "var(--chart-1)" },
  hot: { label: "Горячие", color: "var(--chart-2)" },
} satisfies ChartConfig

const parentsConfig = {
  parents: { label: "Родители", color: "var(--chart-3)" },
} satisfies ChartConfig

function trendText(changePct: number | null, hasEnoughData: boolean, entity: string) {
  if (!hasEnoughData || changePct === null) {
    return `Недостаточно данных для сравнения ${entity}`
  }
  const abs = Math.abs(changePct).toFixed(1)
  return changePct >= 0
    ? `Рост ${entity} на ${abs}%`
    : `Снижение ${entity} на ${abs}%`
}

function TrendIcon({ value }: { value: number | null }) {
  if (value === null) return null
  return value >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
}

const monthOptions = [
  { value: "01", label: "Январь" },
  { value: "02", label: "Февраль" },
  { value: "03", label: "Март" },
  { value: "04", label: "Апрель" },
  { value: "05", label: "Май" },
  { value: "06", label: "Июнь" },
  { value: "07", label: "Июль" },
  { value: "08", label: "Август" },
  { value: "09", label: "Сентябрь" },
  { value: "10", label: "Октябрь" },
  { value: "11", label: "Ноябрь" },
  { value: "12", label: "Декабрь" },
]

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [admin, setAdmin] = React.useState<MeResponse["admin"] | null>(null)
  const [data, setData] = React.useState<AnalyticsResponse | null>(null)
  const [year, setYear] = React.useState(new Date().getFullYear())
  const [month, setMonth] = React.useState(String(new Date().getMonth() + 1).padStart(2, "0"))

  const yearOptions = React.useMemo(() => {
    const current = new Date().getFullYear()
    return Array.from({ length: 6 }, (_, i) => current - i)
  }, [])

  const load = React.useCallback(
    async (targetYear: number, targetMonth: string) => {
      const params = new URLSearchParams({
        year: String(targetYear),
        month: `${targetYear}-${targetMonth}`,
      })
      const me = await api.get<MeResponse>("/auth/me")
      const analytics = await api.get<AnalyticsResponse>(`/analytics/overview?${params.toString()}`)
      setAdmin(me.data.admin)
      setData(analytics.data)
    },
    []
  )

  React.useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        await load(year, month)
      } catch {
        if (!cancelled) router.push("/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [load, month, router, year])

  const pieConfig = React.useMemo(() => {
    const cfg: ChartConfig = { value: { label: "Кол-во" } }
    for (const item of data?.resultsDistribution ?? []) {
      cfg[item.key] = { label: item.label, color: item.color }
    }
    return cfg
  }, [data?.resultsDistribution])

  const pieData = React.useMemo(() => {
    return (data?.resultsDistribution ?? []).map((item) => ({
      segment: item.key,
      label: item.label,
      value: item.value,
      fill: `var(--color-${item.key})`,
    }))
  }, [data?.resultsDistribution])

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка аналитики...</div>
  }

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Не удалось загрузить аналитику.</div>
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
          <h1 className="text-xl font-semibold">Аналитика</h1>

          <Card>
            <CardHeader>
              <CardTitle>Выбор периода</CardTitle>
              <CardDescription>Год для годовых графиков и месяц для помесячных</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3">
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Месяц" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => load(year, month)}>Обновить</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader className="items-center pb-4">
                <CardTitle>Радар лидов по месяцам</CardTitle>
                <CardDescription>{data.yearRangeLabel}</CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                <ChartContainer config={leadsConfig} className="mx-auto aspect-square max-h-[280px]">
                  <RadarChart data={data.leadsByMonth}>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <PolarAngleAxis dataKey="month" />
                    <PolarGrid radialLines={false} />
                    <Radar dataKey="warm" fill="var(--color-warm)" fillOpacity={0} stroke="var(--color-warm)" strokeWidth={2} />
                    <Radar dataKey="hot" fill="var(--color-hot)" fillOpacity={0} stroke="var(--color-hot)" strokeWidth={2} />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {trendText(data.trends.yearlyLeads.changePct, data.trends.yearlyLeads.hasEnoughData, "лидов к прошлому году")}
                  <TrendIcon value={data.trends.yearlyLeads.changePct} />
                </div>
                <div className="text-muted-foreground leading-none">
                  Текущий год: {data.trends.yearlyLeads.current}, прошлый: {data.trends.yearlyLeads.previous}
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="items-center">
                <CardTitle>Радар уникальных родителей</CardTitle>
                <CardDescription>{data.yearRangeLabel}</CardDescription>
              </CardHeader>
              <CardContent className="pb-0">
                <ChartContainer config={parentsConfig} className="mx-auto aspect-square max-h-[280px]">
                  <RadarChart data={data.uniqueParentsByMonth}>
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <PolarAngleAxis dataKey="month" />
                    <PolarGrid />
                    <Radar
                      dataKey="parents"
                      fill="var(--color-parents)"
                      fillOpacity={0.6}
                      stroke="var(--color-parents)"
                      dot={{ r: 4, fillOpacity: 1 }}
                    />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {trendText(data.trends.yearlyParents.changePct, data.trends.yearlyParents.hasEnoughData, "родителей к прошлому году")}
                  <TrendIcon value={data.trends.yearlyParents.changePct} />
                </div>
                <div className="text-muted-foreground leading-none">
                  Текущий год: {data.trends.yearlyParents.current}, прошлый: {data.trends.yearlyParents.previous}
                </div>
              </CardFooter>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader className="items-center pb-0">
                <CardTitle>Результаты прохождения тестов (Pie)</CardTitle>
                <CardDescription>{data.yearRangeLabel}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-0">
                {pieData.length === 0 ? (
                  <div className="text-muted-foreground flex h-[250px] items-center justify-center text-sm">
                    Недостаточно данных по результатам тестов за выбранный год.
                  </div>
                ) : (
                  <ChartContainer
                    config={pieConfig}
                    className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px]"
                  >
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent nameKey="value" hideLabel />} />
                      <Pie data={pieData} dataKey="value">
                        <LabelList
                          dataKey="segment"
                          className="fill-background"
                          stroke="none"
                          fontSize={12}
                          formatter={(value: string) => pieConfig[value]?.label}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                )}
              </CardContent>
              <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                  {trendText(data.trends.yearlyResults.changePct, data.trends.yearlyResults.hasEnoughData, "результатов к прошлому году")}
                  <TrendIcon value={data.trends.yearlyResults.changePct} />
                </div>
                <div className="text-muted-foreground leading-none">
                  Текущий год: {data.trends.yearlyResults.current}, прошлый: {data.trends.yearlyResults.previous}
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Родители по дням месяца</CardTitle>
                <CardDescription>{data.monthRangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={parentsConfig}>
                  <LineChart data={data.parentsByDay} margin={{ top: 20, left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Line
                      dataKey="parents"
                      type="natural"
                      stroke="var(--color-parents)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-parents)" }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList position="top" offset={12} className="fill-foreground" fontSize={12} />
                    </Line>
                  </LineChart>
                </ChartContainer>
              </CardContent>
              <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                  {trendText(data.trends.monthlyParents.changePct, data.trends.monthlyParents.hasEnoughData, "родителей к прошлому месяцу")}
                  <TrendIcon value={data.trends.monthlyParents.changePct} />
                </div>
                <div className="text-muted-foreground leading-none">
                  Текущий месяц: {data.trends.monthlyParents.current}, прошлый: {data.trends.monthlyParents.previous}
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Лиды по дням месяца</CardTitle>
                <CardDescription>{data.monthRangeLabel}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={leadsConfig}>
                  <LineChart data={data.leadsByDay} margin={{ left: 12, right: 12 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Line dataKey="warm" type="monotone" stroke="var(--color-warm)" strokeWidth={2} dot={false} />
                    <Line dataKey="hot" type="monotone" stroke="var(--color-hot)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              </CardContent>
              <CardFooter>
                <div className="flex w-full items-start gap-2 text-sm">
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2 leading-none font-medium">
                      {trendText(data.trends.monthlyLeads.changePct, data.trends.monthlyLeads.hasEnoughData, "лидов к прошлому месяцу")}
                      <TrendIcon value={data.trends.monthlyLeads.changePct} />
                    </div>
                    <div className="text-muted-foreground leading-none">
                      Текущий месяц: {data.trends.monthlyLeads.currentTotal} (тёплые {data.trends.monthlyLeads.currentWarm}, горячие {data.trends.monthlyLeads.currentHot})
                    </div>
                    <div className="text-muted-foreground leading-none">
                      Прошлый месяц: {data.trends.monthlyLeads.previousTotal} (тёплые {data.trends.monthlyLeads.previousWarm}, горячие {data.trends.monthlyLeads.previousHot})
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
