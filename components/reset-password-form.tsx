"use client"

import Link from "next/link"
import { AxiosError } from "axios"
import { CircleCheckIcon, KeyRoundIcon, TriangleAlertIcon } from "lucide-react"
import { useState } from "react"

import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "./ui/spinner"

export function ResetPasswordForm({
  className,
  token = "",
  ...props
}: React.ComponentProps<"form"> & { token?: string }) {

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSuccessMessage("")
    setErrorMessage("")

    if (!token) {
      setErrorMessage("Ссылка недействительна или неполная.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage("Пароли не совпадают.")
      return
    }

    if (password.length < 8) {
      setErrorMessage("Пароль должен содержать не менее 8 символов.")
      return
    }

    setLoading(true)
    try {
      const response = await api.post<{ message?: string }>("/auth/reset-password", {
        token,
        password,
      })
      setSuccessMessage(response.data.message ?? "Пароль успешно обновлён.")
      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось обновить пароль")
          : "Не удалось обновить пароль"
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Новый пароль</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Установите новый пароль для входа в административную панель.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="new-password">Новый пароль</FieldLabel>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FieldDescription>Минимум 8 символов.</FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="confirm-password">Подтвердите пароль</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Field>

        {successMessage ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CircleCheckIcon className="size-4 text-emerald-600" />
            <AlertTitle>Пароль обновлён</AlertTitle>
            <AlertDescription className="text-emerald-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        ) : null}

        {errorMessage ? (
          <Alert variant="destructive">
            <TriangleAlertIcon className="size-4" />
            <AlertTitle>Ошибка</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <Field className="gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Сохранение..." : "Сохранить новый пароль"}
            {loading ? <Spinner className="size-6" /> : <KeyRoundIcon className="size-4" />}
          </Button>
          <FieldDescription className="text-center">
            <Link href="/admin/login" className="underline underline-offset-4 hover:text-foreground">
              Вернуться ко входу
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
