"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { api } from "@/lib/api"
import {
  inferDiagnosticCardLanguage,
  resolveSoundGroupOptions,
} from "@/lib/diagnostic-card-config"

type MeResponse = {
  admin: {
    email: string
    name?: string | null
  }
}

type DiagnosticItem = {
  id: number
  slug: string
  soundGroup: string
  targetSound: string
  word: string
  prompt: string | null
  helperText: string | null
  imageUrl: string | null
  imageAlt: string | null
  imageEmoji: string | null
  accentColor: string | null
  createdAt: string
  updatedAt: string
}

type DiagnosticItemsResponse = {
  ok: boolean
  items: DiagnosticItem[]
}

type FormState = {
  slug: string
  soundGroup: string
  targetSound: string
  word: string
  prompt: string
  helperText: string
  imageUrl: string
  imageAlt: string
  imageEmoji: string
  accentColor: string
}

const emptyForm: FormState = {
  slug: "",
  soundGroup: "",
  targetSound: "",
  word: "",
  prompt: "",
  helperText: "",
  imageUrl: "",
  imageAlt: "",
  imageEmoji: "",
  accentColor: "#111111",
}

function languageLabel(value: "ru" | "kz") {
  return value === "kz" ? "Казахский" : "Русский"
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("ru-RU")
}

function normalizeSlugFromWord(word: string) {
  return word
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9қңғүұөһі_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

export default function AdminDiagnosticItemsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [admin, setAdmin] = useState<MeResponse["admin"] | null>(null)
  const [items, setItems] = useState<DiagnosticItem[]>([])
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DiagnosticItem | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formError, setFormError] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [me, response] = await Promise.all([
          api.get<MeResponse>("/auth/me"),
          api.get<DiagnosticItemsResponse>("/admin/diagnostic-items"),
        ])

        if (cancelled) return

        setAdmin(me.data.admin)
        setItems(response.data.items ?? [])
      } catch {
        if (!cancelled) router.push("/admin/login")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items

    return items.filter((item) =>
      [item.word, item.soundGroup, item.targetSound, item.slug]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [items, query])

  const summary = useMemo(() => {
    return {
      total: items.length,
      kz: items.filter((item) => inferDiagnosticCardLanguage(item) === "kz").length,
      ru: items.filter((item) => inferDiagnosticCardLanguage(item) === "ru").length,
      soundGroups: new Set(items.map((item) => item.soundGroup.trim()).filter(Boolean)).size,
    }
  }, [items])

  const inferredCardLanguage = useMemo(
    () => inferDiagnosticCardLanguage(form),
    [form]
  )

  const soundGroupOptions = useMemo(() => {
    const values = new Set<string>(resolveSoundGroupOptions(inferredCardLanguage))
    if (form.soundGroup.trim()) {
      values.add(form.soundGroup.trim())
    }
    return Array.from(values)
  }, [form.soundGroup, inferredCardLanguage])

  function resetDialogState() {
    setEditingItem(null)
    setForm(emptyForm)
    setSelectedFile(null)
    setRemoveImage(false)
    setFormError("")
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  function closeDialog(nextOpen: boolean) {
    setDialogOpen(nextOpen)
    if (!nextOpen) {
      resetDialogState()
    }
  }

  function openCreateDialog() {
    resetDialogState()
    setDialogOpen(true)
  }

  function openEditDialog(item: DiagnosticItem) {
    resetDialogState()
    setEditingItem(item)
    setForm({
      slug: item.slug,
      soundGroup: item.soundGroup,
      targetSound: item.targetSound,
      word: item.word,
      prompt: item.prompt ?? "",
      helperText: item.helperText ?? "",
      imageUrl: item.imageUrl ?? "",
      imageAlt: item.imageAlt ?? "",
      imageEmoji: item.imageEmoji ?? "",
      accentColor: item.accentColor ?? "#111111",
    })
    setDialogOpen(true)
  }

  function handleFormChange<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleWordBlur() {
    if (editingItem || form.slug.trim()) return
    const nextSlug = normalizeSlugFromWord(form.word)
    if (nextSlug) {
      handleFormChange("slug", nextSlug)
    }
  }

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    setRemoveImage(false)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  function buildFormData() {
    const formData = new FormData()
    formData.append("slug", form.slug.trim())
    formData.append("soundGroup", form.soundGroup.trim())
    formData.append("targetSound", form.targetSound.trim())
    formData.append("word", form.word.trim())
    formData.append("prompt", form.prompt.trim())
    formData.append("helperText", form.helperText.trim())
    formData.append("imageUrl", form.imageUrl.trim())
    formData.append("imageAlt", form.imageAlt.trim())
    formData.append("imageEmoji", form.imageEmoji.trim())
    formData.append("accentColor", form.accentColor.trim())
    formData.append("removeImage", String(removeImage))

    if (selectedFile) {
      formData.append("image", selectedFile)
    }

    return formData
  }

  async function reloadItems() {
    const response = await api.get<DiagnosticItemsResponse>("/admin/diagnostic-items")
    setItems(response.data.items ?? [])
  }

  async function handleSave() {
    if (saving) return
    setSaving(true)
    setFormError("")
    const isEditing = Boolean(editingItem)

    try {
      const formData = buildFormData()
      if (editingItem) {
        await api.patch(`/admin/diagnostic-items/${editingItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      } else {
        await api.post("/admin/diagnostic-items", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
      }

      await reloadItems()
      closeDialog(false)
      toast.success(isEditing ? "Карточка успешно обновлена" : "Карточка успешно сохранена")
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось сохранить карточку")
          : "Не удалось сохранить карточку"
      setFormError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item: DiagnosticItem) {
    if (deletingId) return
    const confirmed = window.confirm(`Удалить карточку «${item.word}»?`)
    if (!confirmed) return

    setDeletingId(item.id)
    try {
      await api.delete(`/admin/diagnostic-items/${item.id}`)
      setItems((prev) => prev.filter((current) => current.id !== item.id))
      if (editingItem?.id === item.id) {
        closeDialog(false)
      }
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? String(error.response?.data?.message ?? "Не удалось удалить карточку")
          : "Не удалось удалить карточку"
      setFormError(message)
    } finally {
      setDeletingId(null)
    }
  }

  const resolvedPreviewUrl = !removeImage ? previewUrl || form.imageUrl || null : null

  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Загрузка...</div>
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar admin={admin} variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <main className="space-y-4 p-4 lg:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold">Карточки упражнения</h1>
              <p className="text-sm text-muted-foreground">
                Администратор собирает библиотеку слов, звуков и изображений для упражнений. Порядок задаётся уже внутри самого упражнения.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/admin/diagnostics">К упражнениям</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/diagnostic-leads">К заявкам диагностики</Link>
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="size-4" />
                Новая карточка
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Всего</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.total}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Казахский</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.kz}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Русский</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.ru}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Групп звуков</CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{summary.soundGroups}</CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Список карточек</CardTitle>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по слову, звуку или slug"
                className="w-full md:max-w-sm"
              />
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Карточка</TableHead>
                      <TableHead>Группа</TableHead>
                      <TableHead>Звук</TableHead>
                      <TableHead>Обновлено</TableHead>
                      <TableHead className="text-right">Действия</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                          Карточки не найдены.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-muted text-2xl"
                                style={
                                  item.imageUrl
                                    ? undefined
                                    : {
                                        background: `linear-gradient(135deg, ${item.accentColor ?? "#111111"}22 0%, #f7f7f4 100%)`,
                                      }
                                }
                              >
                                {item.imageUrl ? (
                                  <div
                                    className="h-full w-full rounded-[15px] bg-cover bg-center"
                                    style={{ backgroundImage: `url(${item.imageUrl})` }}
                                  />
                                ) : (
                                  <span>{item.imageEmoji ?? "🖼️"}</span>
                                )}
                              </div>
                              <div>
                                <div className="font-medium">{item.word}</div>
                                <div className="text-xs text-muted-foreground">
                                  Произнести слово и выделить звук {item.targetSound}
                                </div>
                                <div className="text-xs text-muted-foreground">{item.slug}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.soundGroup}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.targetSound}</Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(item.updatedAt)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" onClick={() => openEditDialog(item)}>
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === item.id}
                                onClick={() => handleDelete(item)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        <Dialog open={dialogOpen} onOpenChange={closeDialog}>
          <DialogContent className="flex max-h-[94vh] w-[min(96vw,1720px)] max-w-none flex-col overflow-hidden p-0 sm:max-w-[min(96vw,1720px)]" showCloseButton={false}>
            <DialogHeader className="border-b px-6 pt-6 pb-4">
              <DialogTitle>{editingItem ? "Редактировать карточку" : "Новая карточка"}</DialogTitle>
              <DialogDescription>
                Настройте слово, целевой звук, подсказку и изображение для карточки упражнения. Порядок задается только внутри упражнения.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <FieldGroup>
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="soundGroup">Группа звуков</FieldLabel>
                    <Select value={form.soundGroup} onValueChange={(value) => handleFormChange("soundGroup", value)}>
                      <SelectTrigger id="soundGroup" className="w-full">
                        <SelectValue placeholder="Выберите группу звуков" />
                      </SelectTrigger>
                      <SelectContent>
                        {soundGroupOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Список подстраивается автоматически. Сейчас используется: {languageLabel(inferredCardLanguage)}.
                    </FieldDescription>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="targetSound">Целевой звук</FieldLabel>
                    <Input
                      id="targetSound"
                      value={form.targetSound}
                      onChange={(event) => handleFormChange("targetSound", event.target.value)}
                      placeholder="Например, С"
                    />
                  </Field>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="word">Слово</FieldLabel>
                    <Input
                      id="word"
                      value={form.word}
                      onChange={(event) => handleFormChange("word", event.target.value)}
                      onBlur={handleWordBlur}
                      placeholder="Например, Сабын"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="slug">Slug</FieldLabel>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(event) => handleFormChange("slug", event.target.value)}
                    placeholder="kz-s-sabyn"
                  />
                  <FieldDescription>
                    Используется как стабильный идентификатор карточки. Можно сгенерировать от слова.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="prompt">Что должен сделать родитель</FieldLabel>
                  <textarea
                    id="prompt"
                    value={form.prompt}
                    onChange={(event) => handleFormChange("prompt", event.target.value)}
                    className="min-h-20 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    placeholder="Например: покажите картинку и попросите ребёнка спокойно произнести слово"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="helperText">На что сделать упор</FieldLabel>
                  <textarea
                    id="helperText"
                    value={form.helperText}
                    onChange={(event) => handleFormChange("helperText", event.target.value)}
                    className="min-h-24 rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring"
                    placeholder="Например: слушаем, насколько чисто слышится звук в начале слова"
                  />
                </Field>

                <div className="grid gap-4 lg:grid-cols-3">
                  <Field>
                    <FieldLabel htmlFor="imageEmoji">Emoji-фолбэк</FieldLabel>
                    <Input
                      id="imageEmoji"
                      value={form.imageEmoji}
                      onChange={(event) => handleFormChange("imageEmoji", event.target.value)}
                      placeholder="🧼"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="accentColor">Цвет карточки</FieldLabel>
                    <Input
                      id="accentColor"
                      value={form.accentColor}
                      onChange={(event) => handleFormChange("accentColor", event.target.value)}
                      placeholder="#111111"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="imageAlt">Alt изображения</FieldLabel>
                    <Input
                      id="imageAlt"
                      value={form.imageAlt}
                      onChange={(event) => handleFormChange("imageAlt", event.target.value)}
                      placeholder="Например, кусок мыла"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="imageUrl">URL изображения</FieldLabel>
                  <Input
                    id="imageUrl"
                    value={form.imageUrl}
                    onChange={(event) => handleFormChange("imageUrl", event.target.value)}
                    placeholder="/uploads/diagnostic-items/example.png"
                  />
                  <FieldDescription>
                    Можно либо указать готовый путь, либо загрузить файл ниже.
                  </FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="imageFile">Файл изображения</FieldLabel>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                  />
                  <FieldDescription>
                    Загруженный файл будет сохранён в `public/uploads/diagnostic-items`.
                  </FieldDescription>
                </Field>

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <div className="mb-3 text-sm font-medium">Превью карточки</div>
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-36 w-36 items-center justify-center rounded-[28px] border bg-white text-6xl"
                      style={
                        resolvedPreviewUrl
                          ? {
                              backgroundImage: `url(${resolvedPreviewUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                            }
                          : {
                              background: `linear-gradient(135deg, ${form.accentColor || "#111111"}22 0%, #f7f7f4 100%)`,
                            }
                      }
                    >
                      {resolvedPreviewUrl ? null : <span>{form.imageEmoji || "🖼️"}</span>}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="text-lg font-semibold">{form.word || "Слово карточки"}</div>
                      <div className="text-sm text-muted-foreground">
                        Ребёнок должен произнести это слово целиком.
                      </div>
                      <Badge variant="outline">{form.targetSound || "Целевой звук"}</Badge>
                      <div className="text-sm text-muted-foreground">{form.soundGroup || "Группа звуков"}</div>
                      {form.helperText ? (
                        <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm text-black/65">
                          Упор: {form.helperText}
                        </div>
                      ) : null}
                      {(resolvedPreviewUrl || selectedFile || form.imageUrl) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            handleFileChange(null)
                            handleFormChange("imageUrl", "")
                            setRemoveImage(true)
                          }}
                        >
                          <Trash2 className="size-4" />
                          Убрать изображение
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <FieldError>{formError}</FieldError>
              </FieldGroup>
            </div>

            <DialogFooter className="border-t px-6 py-4">
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                  {editingItem ? (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deletingId === editingItem.id}
                      onClick={() => handleDelete(editingItem)}
                    >
                      <Trash2 className="size-4" />
                      Удалить
                    </Button>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => closeDialog(false)}>
                    Отмена
                  </Button>
                  <Button type="button" onClick={handleSave} disabled={saving}>
                    {saving ? "Сохраняем..." : editingItem ? "Сохранить" : "Создать карточку"}
                    <ImagePlus className="size-4" />
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
