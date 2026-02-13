import { and, eq, gte, inArray, lt } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import {
  leadsTable,
  parentsTable,
  testResultRulesTable,
  testSessionTable,
} from "@/db/schema"
import { isAuthorizedAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

function monthShortRu(date: Date): string {
  return date.toLocaleDateString("ru-RU", { month: "short" })
}

function dayLabel(date: Date): string {
  return String(date.getDate()).padStart(2, "0")
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function parseYear(raw: string | null, fallback: number): number {
  const y = Number(raw)
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return fallback
  return y
}

function parseMonth(raw: string | null, fallback: string): string {
  if (!raw) return fallback
  if (!/^\d{4}-\d{2}$/.test(raw)) return fallback
  const [year, month] = raw.split("-").map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return fallback
  }
  return raw
}

function buildMonthBuckets(year: number) {
  return Array.from({ length: 12 }, (_, i) => new Date(year, i, 1))
}

function startEndOfYear(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { start, end }
}

function startEndOfMonth(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

function previousMonth(monthValue: string): string {
  const { start } = startEndOfMonth(monthValue)
  const prev = new Date(start.getFullYear(), start.getMonth() - 1, 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const search = req.nextUrl.searchParams
    const currentYear = parseYear(search.get("year"), now.getFullYear())
    const monthDefault = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const currentMonth = parseMonth(search.get("month"), monthDefault)

    const yearCurrent = startEndOfYear(currentYear)
    const yearPrev = startEndOfYear(currentYear - 1)
    const monthCurrent = startEndOfMonth(currentMonth)
    const monthPrev = startEndOfMonth(previousMonth(currentMonth))

    const leadRows = await db
      .select({ status: leadsTable.status, createdAt: leadsTable.createdAt })
      .from(leadsTable)
      .where(and(gte(leadsTable.createdAt, yearPrev.start), lt(leadsTable.createdAt, yearCurrent.end)))

    const monthBuckets = buildMonthBuckets(currentYear)
    const leadsByMonthMap = new Map<string, { warm: number; hot: number }>()
    const parentsByMonthMap = new Map<string, number>()
    for (const m of monthBuckets) {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`
      leadsByMonthMap.set(key, { warm: 0, hot: 0 })
      parentsByMonthMap.set(key, 0)
    }

    let leadsCurrentYear = 0
    let leadsPrevYear = 0
    for (const lead of leadRows) {
      const d = new Date(lead.createdAt)
      if (d >= yearCurrent.start && d < yearCurrent.end) {
        leadsCurrentYear++
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        const row = leadsByMonthMap.get(key)
        if (row) {
          if (lead.status === "hot") row.hot += 1
          else row.warm += 1
        }
      } else if (d >= yearPrev.start && d < yearPrev.end) {
        leadsPrevYear++
      }
    }

    const parentsRows = await db
      .select({ createdAt: parentsTable.createdAt })
      .from(parentsTable)
      .where(and(gte(parentsTable.createdAt, yearPrev.start), lt(parentsTable.createdAt, yearCurrent.end)))

    let parentsCurrentYear = 0
    let parentsPrevYear = 0
    for (const parent of parentsRows) {
      const d = new Date(parent.createdAt)
      if (d >= yearCurrent.start && d < yearCurrent.end) {
        parentsCurrentYear++
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        parentsByMonthMap.set(key, (parentsByMonthMap.get(key) ?? 0) + 1)
      } else if (d >= yearPrev.start && d < yearPrev.end) {
        parentsPrevYear++
      }
    }

    const sessions = await db
      .select({
        testId: testSessionTable.testId,
        score: testSessionTable.score,
        completedAt: testSessionTable.completedAt,
      })
      .from(testSessionTable)
      .where(
        and(
          eq(testSessionTable.status, "complete"),
          gte(testSessionTable.completedAt, yearPrev.start),
          lt(testSessionTable.completedAt, yearCurrent.end)
        )
      )

    const testIds = Array.from(new Set(sessions.map((s) => s.testId)))
    const rules = testIds.length
      ? await db.select().from(testResultRulesTable).where(inArray(testResultRulesTable.testId, testIds))
      : []
    const rulesByTest = new Map<number, typeof rules>()
    for (const rule of rules) {
      const list = rulesByTest.get(rule.testId) ?? []
      list.push(rule)
      rulesByTest.set(rule.testId, list)
    }

    const resultsCurrentMap = new Map<string, number>()
    let resultsCurrentYear = 0
    let resultsPrevYear = 0

    for (const session of sessions) {
      if (!session.completedAt) continue
      const d = new Date(session.completedAt)
      const label =
        (rulesByTest.get(session.testId) ?? []).find(
          (r) => session.score >= r.minScore && session.score <= r.maxScore
        )?.label ?? "Без категории"

      if (d >= yearCurrent.start && d < yearCurrent.end) {
        resultsCurrentYear++
        resultsCurrentMap.set(label, (resultsCurrentMap.get(label) ?? 0) + 1)
      } else if (d >= yearPrev.start && d < yearPrev.end) {
        resultsPrevYear++
      }
    }

    const palette = [
      "var(--chart-1)",
      "var(--chart-2)",
      "var(--chart-3)",
      "var(--chart-4)",
      "var(--chart-5)",
      "var(--chart-1)",
    ]
    const resultsDistribution = Array.from(resultsCurrentMap.entries()).map(([label, value], idx) => ({
      key: `result_${idx + 1}`,
      label,
      value,
      color: palette[idx % palette.length],
    }))

    const monthlyParentsRows = await db
      .select({ createdAt: parentsTable.createdAt })
      .from(parentsTable)
      .where(and(gte(parentsTable.createdAt, monthPrev.start), lt(parentsTable.createdAt, monthCurrent.end)))

    const monthlyLeadsRows = await db
      .select({ status: leadsTable.status, createdAt: leadsTable.createdAt })
      .from(leadsTable)
      .where(and(gte(leadsTable.createdAt, monthPrev.start), lt(leadsTable.createdAt, monthCurrent.end)))

    const dayBuckets: Date[] = []
    for (
      let d = new Date(monthCurrent.start);
      d < monthCurrent.end;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    ) {
      dayBuckets.push(new Date(d))
    }

    const parentsByDayMap = new Map<string, number>()
    const leadsByDayMap = new Map<string, { warm: number; hot: number }>()
    for (const day of dayBuckets) {
      const key = dayLabel(day)
      parentsByDayMap.set(key, 0)
      leadsByDayMap.set(key, { warm: 0, hot: 0 })
    }

    let parentsCurrentMonth = 0
    let parentsPreviousMonth = 0
    for (const row of monthlyParentsRows) {
      const d = new Date(row.createdAt)
      if (d >= monthCurrent.start && d < monthCurrent.end) {
        parentsCurrentMonth++
        const key = dayLabel(d)
        parentsByDayMap.set(key, (parentsByDayMap.get(key) ?? 0) + 1)
      } else if (d >= monthPrev.start && d < monthPrev.end) {
        parentsPreviousMonth++
      }
    }

    let warmCurrentMonth = 0
    let hotCurrentMonth = 0
    let warmPreviousMonth = 0
    let hotPreviousMonth = 0
    for (const row of monthlyLeadsRows) {
      const d = new Date(row.createdAt)
      if (d >= monthCurrent.start && d < monthCurrent.end) {
        const key = dayLabel(d)
        const day = leadsByDayMap.get(key)
        if (day) {
          if (row.status === "hot") {
            day.hot += 1
            hotCurrentMonth++
          } else {
            day.warm += 1
            warmCurrentMonth++
          }
        }
      } else if (d >= monthPrev.start && d < monthPrev.end) {
        if (row.status === "hot") hotPreviousMonth++
        else warmPreviousMonth++
      }
    }

    const leadsByMonth = monthBuckets.map((m) => {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`
      const v = leadsByMonthMap.get(key) ?? { warm: 0, hot: 0 }
      return {
        month: monthShortRu(m),
        warm: v.warm,
        hot: v.hot,
      }
    })

    const uniqueParentsByMonth = monthBuckets.map((m) => {
      const key = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`
      return {
        month: monthShortRu(m),
        parents: parentsByMonthMap.get(key) ?? 0,
      }
    })

    const parentsByDay = dayBuckets.map((d) => ({
      day: dayLabel(d),
      parents: parentsByDayMap.get(dayLabel(d)) ?? 0,
    }))
    const leadsByDay = dayBuckets.map((d) => ({
      day: dayLabel(d),
      warm: leadsByDayMap.get(dayLabel(d))?.warm ?? 0,
      hot: leadsByDayMap.get(dayLabel(d))?.hot ?? 0,
    }))

    return NextResponse.json({
      selectedYear: currentYear,
      selectedMonth: currentMonth,
      yearRangeLabel: `01.01.${currentYear} - 31.12.${currentYear}`,
      monthRangeLabel: `${monthCurrent.start.toLocaleDateString("ru-RU", {
        month: "long",
      })} ${monthCurrent.start.getFullYear()}`,
      leadsByMonth,
      uniqueParentsByMonth,
      resultsDistribution,
      parentsByDay,
      leadsByDay,
      trends: {
        yearlyLeads: {
          current: leadsCurrentYear,
          previous: leadsPrevYear,
          changePct: percentChange(leadsCurrentYear, leadsPrevYear),
          hasEnoughData: leadsPrevYear > 0,
        },
        yearlyParents: {
          current: parentsCurrentYear,
          previous: parentsPrevYear,
          changePct: percentChange(parentsCurrentYear, parentsPrevYear),
          hasEnoughData: parentsPrevYear > 0,
        },
        yearlyResults: {
          current: resultsCurrentYear,
          previous: resultsPrevYear,
          changePct: percentChange(resultsCurrentYear, resultsPrevYear),
          hasEnoughData: resultsPrevYear > 0,
        },
        monthlyParents: {
          current: parentsCurrentMonth,
          previous: parentsPreviousMonth,
          changePct: percentChange(parentsCurrentMonth, parentsPreviousMonth),
          hasEnoughData: parentsPreviousMonth > 0,
        },
        monthlyLeads: {
          currentWarm: warmCurrentMonth,
          currentHot: hotCurrentMonth,
          currentTotal: warmCurrentMonth + hotCurrentMonth,
          previousWarm: warmPreviousMonth,
          previousHot: hotPreviousMonth,
          previousTotal: warmPreviousMonth + hotPreviousMonth,
          changePct: percentChange(
            warmCurrentMonth + hotCurrentMonth,
            warmPreviousMonth + hotPreviousMonth
          ),
          hasEnoughData: warmPreviousMonth + hotPreviousMonth > 0,
        },
      },
    })
  } catch (error) {
    console.error("analytics/overview error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
