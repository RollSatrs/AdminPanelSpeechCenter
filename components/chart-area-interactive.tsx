"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { api } from "@/lib/api"

type TimelinePoint = {
  date: string
  parents: number
  children: number
}

type TimelineResponse = {
  totalParents: number
  totalChildren: number
  timeline: TimelinePoint[]
}

const chartConfig = {
  parents: {
    label: "Родители",
    color: "var(--primary)",
  },
  children: {
    label: "Дети",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")
  const [data, setData] = React.useState<TimelinePoint[]>([])
  const [totalParents, setTotalParents] = React.useState(0)
  const [totalChildren, setTotalChildren] = React.useState(0)

  React.useEffect(() => {
    if (isMobile) setTimeRange("7d")
  }, [isMobile])

  React.useEffect(() => {
    let cancelled = false

    async function loadTimeline() {
      try {
        const res = await api.get<TimelineResponse>("/user/timeline", {
          withCredentials: true,
        })
        if (!cancelled) {
          setData(res.data.timeline ?? [])
          setTotalParents(res.data.totalParents ?? 0)
          setTotalChildren(res.data.totalChildren ?? 0)
        }
      } catch (error) {
        console.error("Failed to load timeline", error)
        if (!cancelled) {
          setData([])
          setTotalParents(0)
          setTotalChildren(0)
        }
      }
    }

    loadTimeline()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredData = React.useMemo(() => {
    if (data.length === 0) return []
    const referenceDate = new Date(data[data.length - 1].date)
    let daysToSubtract = 90
    if (timeRange === "30d") daysToSubtract = 30
    if (timeRange === "7d") daysToSubtract = 7

    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return data.filter((item) => new Date(item.date) >= startDate)
  }, [data, timeRange])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Родители и дети по дням</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Родителей: {totalParents.toLocaleString("ru-RU")} | Детей:{" "}
            {totalChildren.toLocaleString("ru-RU")}
          </span>
          <span className="@[540px]/card:hidden">
            Род: {totalParents.toLocaleString("ru-RU")} / Дет:{" "}
            {totalChildren.toLocaleString("ru-RU")}
          </span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(v) => v && setTimeRange(v)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Последние 90 дней</ToggleGroupItem>
            <ToggleGroupItem value="30d">Последние 30 дней</ToggleGroupItem>
            <ToggleGroupItem value="7d">Последние 7 дней</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-44 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select range"
            >
              <SelectValue placeholder="Последние 90 дней" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Последние 90 дней
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Последние 30 дней
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Последние 7 дней
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillParents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-parents)" stopOpacity={0.6} />
                <stop offset="95%" stopColor="var(--color-parents)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillChildren" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-children)" stopOpacity={0.5} />
                <stop offset="95%" stopColor="var(--color-children)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("ru-RU", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString("ru-RU", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="parents"
              type="monotone"
              fill="url(#fillParents)"
              stroke="var(--color-parents)"
              strokeWidth={2}
            />
            <Area
              dataKey="children"
              type="monotone"
              fill="url(#fillChildren)"
              stroke="var(--color-children)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
