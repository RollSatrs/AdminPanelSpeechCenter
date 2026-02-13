"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { IconBolt, IconCircleCheck, IconLoader2, IconQrcode, IconWifiOff } from "@tabler/icons-react"
import Image from "next/image"
import { api } from "@/lib/api"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type BotStatusResponse = {
  status:
    | "offline"
    | "stopped"
    | "starting"
    | "waiting_qr"
    | "connected"
    | "disconnected"
    | "auth_failed"
    | string
  qrDataUrl: string | null
  lastError: string | null
  heartbeatAt?: string | null
  updatedAt: string | null
  process?: {
    manager: "pm2"
    available: boolean
    state: "online" | "stopped" | "missing" | "unknown"
    message?: string
  }
}

function statusLabel(status: BotStatusResponse["status"]) {
  if (status === "offline") return "Выключен"
  if (status === "stopped") return "Остановлен"
  if (status === "connected") return "Подключён"
  if (status === "waiting_qr") return "Ожидает QR"
  if (status === "auth_failed") return "Ошибка авторизации"
  if (status === "disconnected") return "Отключён"
  return "Запуск"
}

function statusTone(status: BotStatusResponse["status"]) {
  if (status === "offline") return "text-zinc-600 dark:text-zinc-400"
  if (status === "stopped") return "text-zinc-600 dark:text-zinc-400"
  if (status === "connected") return "text-emerald-600 dark:text-emerald-400"
  if (status === "waiting_qr") return "text-sky-600 dark:text-sky-400"
  if (status === "auth_failed") return "text-red-600 dark:text-red-400"
  if (status === "disconnected") return "text-amber-600 dark:text-amber-400"
  return "text-muted-foreground"
}

export default function BotPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(true)
  const [admin, setAdmin] = React.useState<MeResponse["admin"] | null>(null)
  const [bot, setBot] = React.useState<BotStatusResponse | null>(null)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [stopLoading, setStopLoading] = React.useState(false)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    const [me, status] = await Promise.all([
      api.get<MeResponse>("/auth/me"),
      api.get<BotStatusResponse>("/bot/status"),
    ])
    setAdmin(me.data.admin)
    setBot(status.data)
  }, [])

  React.useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await load()
      } catch {
        if (!cancelled) router.push("/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()

    const timer = setInterval(async () => {
      try {
        await load()
      } catch {
        // silent polling error
      }
    }, 3000)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [load, router])

  if (loading || !bot) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка статуса бота...</div>
  }

  const isConnected = bot.status === "connected"
  const isWaitingQr = bot.status === "waiting_qr" && !!bot.qrDataUrl
  const isProcessOnline = bot.process?.available && bot.process.state === "online"
  const canConnect =
    bot.status === "offline" ||
    bot.status === "stopped" ||
    bot.status === "disconnected" ||
    bot.status === "auth_failed"
  const isConnecting = actionLoading && canConnect

  async function handleAction() {
    try {
      setActionLoading(true)
      setActionError(null)
      await api.post(canConnect ? "/bot/connect" : "/bot/reconnect")
      await load()
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Не удалось выполнить действие"
      setActionError(message)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleStop() {
    try {
      setStopLoading(true)
      setActionError(null)
      await api.post("/bot/stop")
      await load()
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Не удалось остановить бота"
      setActionError(message)
    } finally {
      setStopLoading(false)
    }
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
          <Card className="border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <IconBolt className="size-5" />
                WhatsApp Bot
              </CardTitle>
              <CardDescription>Подключение и QR-авторизация в реальном времени</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={statusTone(bot.status)}>
                  {statusLabel(bot.status)}
                </Badge>
                {bot.updatedAt ? (
                  <span className="text-muted-foreground text-xs">
                    Обновлено: {new Date(bot.updatedAt).toLocaleString("ru-RU")}
                  </span>
                ) : null}
                {bot.process ? (
                  <span className="text-muted-foreground text-xs">
                    PM2: {bot.process.available ? bot.process.state : "недоступен"}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleAction}
                  disabled={actionLoading || stopLoading}
                  className="min-w-44"
                >
                  {actionLoading ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" />
                      {canConnect ? "Подключение..." : "Переподключение..."}
                    </>
                  ) : (
                    (canConnect ? "Подключить бот" : "Переподключить бот")
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleStop}
                  disabled={!isProcessOnline || actionLoading || stopLoading}
                  className="min-w-40 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-900/70 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  {stopLoading ? (
                    <>
                      <IconLoader2 className="size-4 animate-spin" />
                      Остановка...
                    </>
                  ) : (
                    "Остановить бот"
                  )}
                </Button>
              </div>
              {bot.lastError ? <p className="text-xs text-red-500">{bot.lastError}</p> : null}
              {actionError ? <p className="text-xs text-red-500">{actionError}</p> : null}
              {bot.process?.message && !bot.process.available ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  PM2 недоступен: {bot.process.message}
                </p>
              ) : null}
            </CardContent>
          </Card>

          {isWaitingQr ? (
            <div className="mx-auto w-full max-w-md rounded-3xl border border-border/70 bg-card/80 p-6 text-center shadow-sm supports-[backdrop-filter]:bg-card/70 supports-[backdrop-filter]:backdrop-blur-xl animate-qr-float">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs">
                <IconQrcode className="size-4" />
                Отсканируйте QR в WhatsApp
              </div>
              <div className="relative mx-auto w-fit">
                <div className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20 blur-xl animate-qr-glow" />
                <Image
                  src={bot.qrDataUrl as string}
                  alt="WhatsApp QR"
                  width={288}
                  height={288}
                  unoptimized
                  className="relative z-10 h-72 w-72 rounded-[2rem] border border-border/80 bg-white p-3 shadow-lg"
                />
              </div>
            </div>
          ) : null}

          {isConnected ? (
            <div className="mx-auto w-full max-w-md rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center animate-appear-up">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/20 animate-pulse">
                <IconCircleCheck className="size-7 text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold">Бот подключён</h2>
              <p className="text-muted-foreground text-sm">Можно работать: новые QR сейчас не требуются.</p>
            </div>
          ) : null}

          {isConnecting ? (
            <div className="mx-auto w-full max-w-md rounded-3xl border border-sky-300/40 bg-gradient-to-br from-sky-500/10 via-background to-emerald-500/10 p-8 text-center shadow-sm supports-[backdrop-filter]:backdrop-blur-xl animate-appear-up">
              <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-spin rounded-full border-2 border-sky-400/60 border-t-transparent" />
                <span className="absolute inset-2 animate-pulse rounded-full border border-emerald-400/60" />
                <IconLoader2 className="size-6 animate-spin text-sky-500" />
              </div>
              <h2 className="text-lg font-semibold">Подключаем бота...</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Запускаем процесс и готовим QR-код для авторизации.
              </p>
            </div>
          ) : null}

          {!isConnected && !isWaitingQr && !isConnecting ? (
            <div className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-2xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
              {bot.status === "starting" ? <IconLoader2 className="size-4 animate-spin" /> : <IconWifiOff className="size-4" />}
              {bot.status === "starting"
                ? "Бот запускается..."
                : bot.status === "offline"
                  ? "Бот выключен. Нажмите «Подключить бот»."
                  : "Ожидаем подключение или новый QR"}
            </div>
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
