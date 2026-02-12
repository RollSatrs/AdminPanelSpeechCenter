"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { AxiosError } from "axios"
import { api } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AnswerDraft = {
  textRu: string
  textKz: string
  points: number
}

type QuestionDraft = {
  textRu: string
  textKz: string
  answers: AnswerDraft[]
}

type RuleDraft = {
  minScore: number
  maxScore: number
  label: string
  textRu: string
  textKz: string
}

type TestDraft = {
  name: string
  ageFrom: number
  ageTo: number
  questions: QuestionDraft[]
  rules: RuleDraft[]
}

type TestsEditorFormProps = {
  mode: "create" | "edit"
  testId?: number
  initial?: TestDraft
}

const defaultDraft: TestDraft = {
  name: "",
  ageFrom: 2,
  ageTo: 3,
  questions: [
    {
      textRu: "",
      textKz: "",
      answers: [
        { textRu: "", textKz: "", points: 2 },
        { textRu: "", textKz: "", points: 1 },
      ],
    },
  ],
  rules: [
    {
      minScore: 0,
      maxScore: 2,
      label: "",
      textRu: "",
      textKz: "",
    },
  ],
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    return String(error.response?.data?.message ?? "Не удалось сохранить тест.")
  }
  return "Не удалось сохранить тест."
}

export function TestsEditorForm({ mode, testId, initial }: TestsEditorFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [draft, setDraft] = useState<TestDraft>(initial ?? defaultDraft)

  const maxPossibleScore = useMemo(() => {
    return draft.questions.reduce((sum, question) => {
      const max = question.answers.reduce((m, answer) => Math.max(m, Number(answer.points) || 0), 0)
      return sum + max
    }, 0)
  }, [draft.questions])

  const isBaseStepValid =
    draft.name.trim().length > 0 &&
    Number.isInteger(draft.ageFrom) &&
    Number.isInteger(draft.ageTo) &&
    draft.ageFrom >= 0 &&
    draft.ageTo >= 0 &&
    draft.ageFrom < draft.ageTo

  const isQuestionsStepValid =
    draft.questions.length > 0 &&
    draft.questions.every(
      (q) =>
        q.textRu.trim().length > 0 &&
        q.textKz.trim().length > 0 &&
        q.answers.length >= 2 &&
        q.answers.every(
          (a) => a.textRu.trim().length > 0 && a.textKz.trim().length > 0 && Number.isFinite(a.points)
        )
    )

  const isRulesStepValid =
    draft.rules.length > 0 &&
    draft.rules.every(
      (r) =>
        Number.isInteger(r.minScore) &&
        Number.isInteger(r.maxScore) &&
        r.minScore <= r.maxScore &&
        r.label.trim().length > 0 &&
        r.textRu.trim().length > 0 &&
        r.textKz.trim().length > 0
    )

  function validateBeforeStep(targetStep: 1 | 2 | 3): boolean {
    if (targetStep >= 2 && !isBaseStepValid) {
      setError("Сначала заполните название теста и корректный возрастной диапазон.")
      return false
    }
    if (targetStep >= 3 && !isQuestionsStepValid) {
      setError("Сначала заполните все вопросы и ответы на двух языках и баллы.")
      return false
    }
    return true
  }

  function goToStep(targetStep: 1 | 2 | 3) {
    if (!validateBeforeStep(targetStep)) return
    setError("")
    setStep(targetStep)
  }

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setDraft((prev) => {
      const questions = [...prev.questions]
      questions[index] = { ...questions[index], ...patch }
      return { ...prev, questions }
    })
  }

  function updateAnswer(questionIndex: number, answerIndex: number, patch: Partial<AnswerDraft>) {
    setDraft((prev) => {
      const questions = [...prev.questions]
      const answers = [...questions[questionIndex].answers]
      answers[answerIndex] = { ...answers[answerIndex], ...patch }
      questions[questionIndex] = { ...questions[questionIndex], answers }
      return { ...prev, questions }
    })
  }

  function addQuestion() {
    setDraft((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          textRu: "",
          textKz: "",
          answers: [
            { textRu: "", textKz: "", points: 2 },
            { textRu: "", textKz: "", points: 1 },
          ],
        },
      ],
    }))
  }

  function removeQuestion(index: number) {
    setDraft((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  function addAnswer(questionIndex: number) {
    setDraft((prev) => {
      const questions = [...prev.questions]
      const answers = [...questions[questionIndex].answers, { textRu: "", textKz: "", points: 0 }]
      questions[questionIndex] = { ...questions[questionIndex], answers }
      return { ...prev, questions }
    })
  }

  function removeAnswer(questionIndex: number, answerIndex: number) {
    setDraft((prev) => {
      const questions = [...prev.questions]
      const answers = questions[questionIndex].answers.filter((_, i) => i !== answerIndex)
      questions[questionIndex] = { ...questions[questionIndex], answers }
      return { ...prev, questions }
    })
  }

  function updateRule(index: number, patch: Partial<RuleDraft>) {
    setDraft((prev) => {
      const rules = [...prev.rules]
      rules[index] = { ...rules[index], ...patch }
      return { ...prev, rules }
    })
  }

  function addRule() {
    setDraft((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        { minScore: 0, maxScore: 0, label: "", textRu: "", textKz: "" },
      ],
    }))
  }

  function removeRule(index: number) {
    setDraft((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }))
  }

  async function handleSubmit() {
    if (!validateBeforeStep(3) || !isRulesStepValid) {
      setError("Заполните правила результата перед сохранением.")
      return
    }
    setSaving(true)
    setError("")
    try {
      if (mode === "create") {
        await api.post("/tests", draft)
      } else {
        await api.put(`/tests/${testId}`, draft)
      }
      router.push("/tests")
      router.refresh()
    } catch (err) {
      setError(normalizeErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={step === 1 ? "default" : "outline"} onClick={() => goToStep(1)}>
          1. База
        </Button>
        <Button variant={step === 2 ? "default" : "outline"} onClick={() => goToStep(2)}>
          2. Вопросы
        </Button>
        <Button variant={step === 3 ? "default" : "outline"} onClick={() => goToStep(3)}>
          3. Результаты
        </Button>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Ошибка сохранения</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {step === 1 ? (
        <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Название теста</label>
            <Input
              value={draft.name}
              onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Например: 3-4 | Phrase Speech Screening"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Возраст от</label>
            <Input
              type="number"
              value={draft.ageFrom}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, ageFrom: Number(e.target.value || 0) }))
              }
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Возраст до</label>
            <Input
              type="number"
              value={draft.ageTo}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, ageTo: Number(e.target.value || 0) }))
              }
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-4">
          {draft.questions.map((question, qIndex) => (
            <div key={qIndex} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Вопрос #{qIndex + 1}</h3>
                <Button
                  variant="outline"
                  onClick={() => removeQuestion(qIndex)}
                  disabled={draft.questions.length <= 1}
                >
                  Удалить вопрос
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm">Текст вопроса (RU)</label>
                  <Input
                    value={question.textRu}
                    onChange={(e) => updateQuestion(qIndex, { textRu: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm">Текст вопроса (KZ)</label>
                  <Input
                    value={question.textKz}
                    onChange={(e) => updateQuestion(qIndex, { textKz: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {question.answers.map((answer, aIndex) => (
                  <div key={aIndex} className="grid gap-2 rounded-md border p-3 md:grid-cols-12">
                    <Input
                      className="md:col-span-4"
                      placeholder="Ответ RU"
                      value={answer.textRu}
                      onChange={(e) => updateAnswer(qIndex, aIndex, { textRu: e.target.value })}
                    />
                    <Input
                      className="md:col-span-4"
                      placeholder="Жауап KZ"
                      value={answer.textKz}
                      onChange={(e) => updateAnswer(qIndex, aIndex, { textKz: e.target.value })}
                    />
                    <Input
                      className="md:col-span-2"
                      type="number"
                      placeholder="Баллы"
                      value={answer.points}
                      onChange={(e) =>
                        updateAnswer(qIndex, aIndex, { points: Number(e.target.value || 0) })
                      }
                    />
                    <Button
                      className="md:col-span-2"
                      variant="outline"
                      onClick={() => removeAnswer(qIndex, aIndex)}
                      disabled={question.answers.length <= 2}
                    >
                      Удалить
                    </Button>
                  </div>
                ))}
              </div>
              <Button variant="outline" onClick={() => addAnswer(qIndex)}>
                Добавить ответ
              </Button>
            </div>
          ))}

          <Button onClick={addQuestion} variant="outline">
            Добавить вопрос
          </Button>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="rounded-lg border p-4 text-sm">
            Максимальный возможный балл по текущим вопросам:{" "}
            <span className="font-semibold">{maxPossibleScore}</span>
          </div>

          {draft.rules.map((rule, index) => (
            <div key={index} className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Правило #{index + 1}</h3>
                <Button
                  variant="outline"
                  onClick={() => removeRule(index)}
                  disabled={draft.rules.length <= 1}
                >
                  Удалить правило
                </Button>
              </div>
              <div className="grid gap-2 md:grid-cols-4">
                <Input
                  placeholder="Min score"
                  type="number"
                  value={rule.minScore}
                  onChange={(e) => updateRule(index, { minScore: Number(e.target.value || 0) })}
                />
                <Input
                  placeholder="Max score"
                  type="number"
                  value={rule.maxScore}
                  onChange={(e) => updateRule(index, { maxScore: Number(e.target.value || 0) })}
                />
                <Input
                  className="md:col-span-2"
                  placeholder="Label (например: Норма)"
                  value={rule.label}
                  onChange={(e) => updateRule(index, { label: e.target.value })}
                />
              </div>
              <Input
                placeholder="Текст результата RU"
                value={rule.textRu}
                onChange={(e) => updateRule(index, { textRu: e.target.value })}
              />
              <Input
                placeholder="Нәтиже мәтіні KZ"
                value={rule.textKz}
                onChange={(e) => updateRule(index, { textKz: e.target.value })}
              />
            </div>
          ))}
          <Button variant="outline" onClick={addRule}>
            Добавить правило результата
          </Button>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push("/tests")}>
          Отмена
        </Button>
        <div className="flex gap-2">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>
              Назад
            </Button>
          ) : null}
          {step < 3 ? (
            <Button onClick={() => goToStep((step + 1) as 1 | 2 | 3)}>Далее</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Сохранение..." : mode === "create" ? "Создать тест" : "Сохранить изменения"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
