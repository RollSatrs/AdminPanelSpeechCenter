import { asc, eq, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import {
  answersTable,
  questionsTable,
  testResultRulesTable,
  testsTable,
} from "@/db/schema"
import { isAuthorizedAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type QuestionInput = {
  textRu: string
  textKz: string
  answers: Array<{
    textRu: string
    textKz: string
    points: number
  }>
}

type RuleInput = {
  minScore: number
  maxScore: number
  label: string
  textRu: string
  textKz: string
}

type TestPayload = {
  name: string
  ageFrom: number
  ageTo: number
  questions: QuestionInput[]
  rules: RuleInput[]
}

function normalizePayload(raw: unknown): TestPayload {
  const body = raw as Partial<TestPayload> | null
  const questions = Array.isArray(body?.questions) ? body.questions : []
  const rules = Array.isArray(body?.rules) ? body.rules : []

  return {
    name: String(body?.name ?? "").trim(),
    ageFrom: Number(body?.ageFrom),
    ageTo: Number(body?.ageTo),
    questions: questions.map((q) => ({
      textRu: String(q?.textRu ?? "").trim(),
      textKz: String(q?.textKz ?? "").trim(),
      answers: (Array.isArray(q?.answers) ? q.answers : []).map((a) => ({
        textRu: String(a?.textRu ?? "").trim(),
        textKz: String(a?.textKz ?? "").trim(),
        points: Number(a?.points ?? 0),
      })),
    })),
    rules: rules.map((r) => ({
      minScore: Number(r?.minScore),
      maxScore: Number(r?.maxScore),
      label: String(r?.label ?? "").trim(),
      textRu: String(r?.textRu ?? "").trim(),
      textKz: String(r?.textKz ?? "").trim(),
    })),
  }
}

function validatePayload(payload: TestPayload): string | null {
  if (!payload.name) return "Введите название теста."
  if (!Number.isInteger(payload.ageFrom) || !Number.isInteger(payload.ageTo)) {
    return "Возрастной диапазон должен быть целыми числами."
  }
  if (payload.ageFrom < 0 || payload.ageTo < 0 || payload.ageFrom >= payload.ageTo) {
    return "Диапазон возраста должен быть корректным: от меньше чем до."
  }
  if (payload.questions.length === 0) return "Добавьте хотя бы один вопрос."
  if (payload.questions.some((q) => !q.textRu || !q.textKz)) {
    return "У каждого вопроса должны быть тексты на русском и казахском."
  }
  if (payload.questions.some((q) => q.answers.length < 2)) {
    return "У каждого вопроса должно быть минимум 2 варианта ответа."
  }
  if (
    payload.questions.some((q) =>
      q.answers.some((a) => !a.textRu || !a.textKz || !Number.isFinite(a.points))
    )
  ) {
    return "У каждого ответа должны быть 2 языка и валидные баллы."
  }
  if (payload.rules.length === 0) return "Добавьте хотя бы одно правило результата."
  if (
    payload.rules.some(
      (r) =>
        !r.label ||
        !r.textRu ||
        !r.textKz ||
        !Number.isInteger(r.minScore) ||
        !Number.isInteger(r.maxScore) ||
        r.minScore > r.maxScore
    )
  ) {
    return "Проверьте правила результата: границы и тексты должны быть заполнены."
  }
  return null
}

async function findOverlappingTest(ageFrom: number, ageTo: number, excludeId: number) {
  const allTests = await db.select().from(testsTable)
  return allTests.find(
    (test) => test.id !== excludeId && ageFrom < test.ageTo && test.ageFrom < ageTo
  )
}

function parseId(params: { id: string }): number | null {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) return null
  return id
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ok = await isAuthorizedAdmin(req)
    if (!ok) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const resolvedParams = await params
    const testId = parseId(resolvedParams)
    if (!testId) return NextResponse.json({ message: "Invalid test id" }, { status: 400 })

    const tests = await db.select().from(testsTable).where(eq(testsTable.id, testId)).limit(1)
    const test = tests[0]
    if (!test) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const questions = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.testId, testId))
      .orderBy(asc(questionsTable.id))

    const questionIds = questions.map((q) => q.id)
    const answers =
      questionIds.length > 0
        ? await db
            .select()
            .from(answersTable)
            .where(inArray(answersTable.questionId, questionIds))
            .orderBy(asc(answersTable.id))
        : []

    const rules = await db
      .select()
      .from(testResultRulesTable)
      .where(eq(testResultRulesTable.testId, testId))
      .orderBy(asc(testResultRulesTable.id))

    const answersByQuestion = new Map<number, typeof answers>()
    for (const answer of answers) {
      const arr = answersByQuestion.get(answer.questionId) ?? []
      arr.push(answer)
      answersByQuestion.set(answer.questionId, arr)
    }

    return NextResponse.json({
      id: test.id,
      name: test.name,
      ageFrom: test.ageFrom,
      ageTo: test.ageTo,
      questions: questions.map((q) => ({
        id: q.id,
        textRu: q.textRu,
        textKz: q.textKz,
        answers: (answersByQuestion.get(q.id) ?? []).map((a) => ({
          id: a.id,
          textRu: a.textRu,
          textKz: a.textKz,
          points: a.points,
        })),
      })),
      rules: rules.map((r) => ({
        id: r.id,
        minScore: r.minScore,
        maxScore: r.maxScore,
        label: r.label,
        textRu: r.textRu,
        textKz: r.textKz,
      })),
    })
  } catch (error) {
    console.error("tests/get error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ok = await isAuthorizedAdmin(req)
    if (!ok) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const resolvedParams = await params
    const testId = parseId(resolvedParams)
    if (!testId) return NextResponse.json({ message: "Invalid test id" }, { status: 400 })

    const existing = await db.select().from(testsTable).where(eq(testsTable.id, testId)).limit(1)
    if (existing.length === 0) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const payload = normalizePayload(await req.json())
    const validationError = validatePayload(payload)
    if (validationError) {
      return NextResponse.json({ message: validationError }, { status: 400 })
    }

    const overlap = await findOverlappingTest(payload.ageFrom, payload.ageTo, testId)
    if (overlap) {
      return NextResponse.json(
        {
          code: "AGE_RANGE_OVERLAP",
          message: `Диапазон ${payload.ageFrom}-${payload.ageTo} пересекается с тестом "${overlap.name}" (${overlap.ageFrom}-${overlap.ageTo}).`,
        },
        { status: 409 }
      )
    }

    await db.transaction(async (tx) => {
      await tx
        .update(testsTable)
        .set({
          name: payload.name,
          ageFrom: payload.ageFrom,
          ageTo: payload.ageTo,
          updatedAt: new Date(),
        })
        .where(eq(testsTable.id, testId))

      const existingQuestions = await tx
        .select({ id: questionsTable.id })
        .from(questionsTable)
        .where(eq(questionsTable.testId, testId))

      const existingQuestionIds = existingQuestions.map((q) => q.id)
      if (existingQuestionIds.length > 0) {
        await tx.delete(answersTable).where(inArray(answersTable.questionId, existingQuestionIds))
      }
      await tx.delete(questionsTable).where(eq(questionsTable.testId, testId))
      await tx.delete(testResultRulesTable).where(eq(testResultRulesTable.testId, testId))

      for (const question of payload.questions) {
        const insertedQuestion = await tx
          .insert(questionsTable)
          .values({
            testId,
            textRu: question.textRu,
            textKz: question.textKz,
            textEn: null,
          })
          .returning({ id: questionsTable.id })

        const questionId = insertedQuestion[0]?.id
        if (!questionId) throw new Error("Failed to create question")

        for (const answer of question.answers) {
          await tx.insert(answersTable).values({
            questionId,
            textRu: answer.textRu,
            textKz: answer.textKz,
            textEn: null,
            points: answer.points,
          })
        }
      }

      for (const rule of payload.rules) {
        await tx.insert(testResultRulesTable).values({
          testId,
          minScore: rule.minScore,
          maxScore: rule.maxScore,
          label: rule.label,
          textRu: rule.textRu,
          textKz: rule.textKz,
          updatedAt: new Date(),
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("tests/update error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
