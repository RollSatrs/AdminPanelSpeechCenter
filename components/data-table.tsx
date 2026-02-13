"use client"

import * as React from "react"
import { IconFlame, IconLoader } from "@tabler/icons-react"
import Link from "next/link"

import { api } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type LeadUserRow = {
  parentId: number
  parentFullName: string
  childrenCount: number
  createdAt: string
  status: "warm" | "hot"
}

type LeadUsersResponse = {
  items: LeadUserRow[]
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("ru-RU")
}

function StatusBadge({ status }: { status: "warm" | "hot" }) {
  if (status === "hot") {
    return (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        <IconFlame className="text-orange-500 dark:text-orange-400" />
        Горячий
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="text-muted-foreground px-1.5">
      <IconLoader />
      Тёплый
    </Badge>
  )
}

export function DataTable() {
  const [rows, setRows] = React.useState<LeadUserRow[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false

    async function loadRows() {
      try {
        const res = await api.get<LeadUsersResponse>("/user/list", {
          withCredentials: true,
        })
        if (!cancelled) setRows(res.data.items ?? [])
      } catch (error) {
        console.error("Failed to load lead users table", error)
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadRows()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <div className="px-4 lg:px-6 text-sm text-muted-foreground">Загрузка таблицы...</div>
  }

  return (
    <div className="px-4 lg:px-6">
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/82 shadow-sm supports-[backdrop-filter]:bg-card/72 supports-[backdrop-filter]:backdrop-blur-md">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow>
              <TableHead className="h-9 text-xs uppercase tracking-wide text-muted-foreground">ФИО родителя</TableHead>
              <TableHead className="h-9 text-xs uppercase tracking-wide text-muted-foreground">Кол-во детей</TableHead>
              <TableHead className="h-9 text-xs uppercase tracking-wide text-muted-foreground">Дата создания</TableHead>
              <TableHead className="h-9 text-xs uppercase tracking-wide text-muted-foreground">Статус лида</TableHead>
              <TableHead className="h-9 text-right text-xs uppercase tracking-wide text-muted-foreground">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Нет данных
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.parentId}>
                  <TableCell>{row.parentFullName}</TableCell>
                  <TableCell>{row.childrenCount}</TableCell>
                  <TableCell>{formatDate(row.createdAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={row.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/parent/${row.parentId}`}>Открыть</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
