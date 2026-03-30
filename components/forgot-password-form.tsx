"use client"

import Link from "next/link"
import { AxiosError } from "axios"
import { CircleCheckIcon, MailIcon, TriangleAlertIcon } from "lucide-react"
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

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setSuccessMessage("")
    setErrorMessage("")

    try {
      const response = await api.post<{ message?: string }>("/auth/forgot-password", { email })
      setSuccessMessage(
        response.data.message ??
          "Если такой email зарегистрирован, мы отправим на него ссылку для сброса пароля."
      )
      setEmail("")
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? String(err.response?.data?.message ?? "Не удалось отправить запрос")
          : "Не удалось отправить запрос"
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Сброс пароля</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Введите email администратора, и мы отправим ссылку для восстановления доступа.
          </p>
        </div>

        <Field>
          <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
          <Input
            id="forgot-email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldDescription>
            Если адрес существует в системе, письмо придёт именно на него.
          </FieldDescription>
        </Field>

        {successMessage ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <CircleCheckIcon className="size-4 text-emerald-600" />
            <AlertTitle>Письмо отправлено</AlertTitle>
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
            {loading ? "Отправка..." : "Отправить ссылку"}
            {loading ? <Spinner className="size-6" /> : <MailIcon className="size-4" />}
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
