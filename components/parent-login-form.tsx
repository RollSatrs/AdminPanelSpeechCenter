"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

export function ParentLoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(""), 3000)
    return () => clearTimeout(timer)
  }, [error])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      await api.post("/parent-auth/login", {
        login,
        password,
      })
      router.push("/cabinet")
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Ошибка входа")
          : "Ошибка входа"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Личный кабинет родителя</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Введите логин и пароль, которые вам выдал администратор.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="login">Логин</FieldLabel>
          <Input
            id="login"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="Введите логин"
            autoComplete="username"
            required
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Пароль</FieldLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="Введите пароль"
            required
          />
        </Field>

        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            error ? "mt-1 max-h-16 opacity-100" : "mt-0 max-h-0 opacity-0"
          )}
        >
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
            <span className="leading-none">⚠️</span>
            <span className="leading-tight">{error}</span>
          </div>
        </div>

        <Field>
          <Button type="submit" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
            {loading ? <Spinner className="size-6" /> : null}
          </Button>
        </Field>

        <Field>
          <FieldDescription className="text-center">
            Если у вас ещё нет доступа, дождитесь логина и пароля от администратора.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
