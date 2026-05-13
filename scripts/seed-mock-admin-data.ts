import bcrypt from "bcryptjs"
import fs from "node:fs"
import { inArray, sql, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import {
  adminsTable,
  answersTable,
  childrenTable,
  leadsTable,
  parentsTable,
  questionsTable,
  sessionAnswerTable,
  testResultRulesTable,
  testSessionTable,
  testsTable,
  userSessionTable,
} from "../db/schema"
import {
  getMockAdmin,
  mockChildren,
  mockLandingLeads,
  mockLeads,
  mockParents,
  mockTestRules,
  mockTests,
  mockTestSessions,
  mockUserSessions,
} from "../lib/mock-admin-data"

function loadEnvFiles() {
  if (fs.existsSync(".env.local")) {
    process.loadEnvFile(".env.local")
  }
  if (fs.existsSync(".env")) {
    process.loadEnvFile(".env")
  }
}

async function ensureCoreTables(db: ReturnType<typeof drizzle>) {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "child_language" AS ENUM ('ru', 'kz', 'both');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "test_session_status" AS ENUM ('incomplete', 'complete');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "user_session_status" AS ENUM ('registered', 'testing', 'done');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "lead" AS ENUM ('warm', 'hot');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admins" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "email" varchar(255) NOT NULL UNIQUE,
      "password_hash" varchar(255) NOT NULL,
      "last_login_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admin_sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "admin_id" integer NOT NULL REFERENCES "admins"("id") ON DELETE cascade,
      "token_hash" varchar(255) NOT NULL UNIQUE,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "parents" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "fullname" varchar(255) NOT NULL,
      "phone" varchar(32) NOT NULL UNIQUE,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "children" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "fullname" varchar(255) NOT NULL,
      "birth_date" date NOT NULL,
      "language" "child_language" NOT NULL,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "tests" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "name" varchar(255) NOT NULL,
      "age_from" integer NOT NULL,
      "age_to" integer NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "questions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "text_id" integer NOT NULL REFERENCES "tests"("id") ON DELETE cascade,
      "text_ru" varchar(255) NOT NULL,
      "text_kz" varchar(255) NOT NULL,
      "text_en" varchar(255)
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "answers" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "question_id" integer NOT NULL REFERENCES "questions"("id") ON DELETE cascade,
      "text_ru" varchar(255) NOT NULL,
      "text_kz" varchar(255) NOT NULL,
      "text_en" varchar(255),
      "points" integer NOT NULL DEFAULT 0
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "test_result_rules" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "test_id" integer NOT NULL REFERENCES "tests"("id") ON DELETE cascade,
      "min_score" integer NOT NULL,
      "max_score" integer NOT NULL,
      "label" varchar(100) NOT NULL,
      "text_ru" varchar(1000) NOT NULL,
      "text_kz" varchar(1000) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "test_id" integer NOT NULL REFERENCES "tests"("id") ON DELETE cascade,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "children_id" integer NOT NULL REFERENCES "children"("id") ON DELETE cascade,
      "chat_id" varchar(255),
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "completed_at" timestamp with time zone,
      "status" "test_session_status" DEFAULT 'incomplete' NOT NULL,
      "score" integer DEFAULT 0 NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "user_sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "children_id" integer REFERENCES "children"("id") ON DELETE cascade,
      "status" "user_session_status" DEFAULT 'registered' NOT NULL,
      "step" varchar(64) NOT NULL,
      "ui_language" varchar(16),
      "started_at" timestamp with time zone DEFAULT now() NOT NULL,
      "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "leads" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "children_id" integer REFERENCES "children"("id") ON DELETE cascade,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "leads" "lead" NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "sesson_answer" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "session_id" integer NOT NULL REFERENCES "sessions"("id") ON DELETE cascade,
      "question_id" integer NOT NULL REFERENCES "questions"("id") ON DELETE cascade,
      "answer_id" integer NOT NULL REFERENCES "answers"("id") ON DELETE cascade,
      "answer_text" varchar(255) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "landing_leads" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "fullname" varchar(255) NOT NULL,
      "phone" varchar(32) NOT NULL,
      "question" text NOT NULL,
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `)
}

async function main() {
  loadEnvFiles()

  const connectionString = process.env.DATABASE_URL?.trim()
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to frontend/.env or frontend/.env.local")
  }

  const pool = new Pool({ connectionString })
  const db = drizzle(pool)
  const demoAdmin = getMockAdmin()
  const demoAdminPassword = "DemoAdmin123!"

  try {
    await ensureCoreTables(db)

    const demoPhones = mockParents.map((parent) => parent.phone)
    const demoLandingPhones = mockLandingLeads.map((lead) => lead.phone)
    const demoTestNames = mockTests.map((test) => test.name)

    await db.delete(parentsTable).where(inArray(parentsTable.phone, demoPhones))
    await db.delete(testsTable).where(inArray(testsTable.name, demoTestNames))
    await db.delete(adminsTable).where(eq(adminsTable.email, demoAdmin.email))

    if (demoLandingPhones.length > 0) {
      const phoneList = sql.join(demoLandingPhones.map((phone) => sql`${phone}`), sql`, `)
      await db.execute(sql`
        DELETE FROM "landing_leads"
        WHERE "phone" IN (${phoneList});
      `)
    }

    const passwordHash = await bcrypt.hash(demoAdminPassword, 10)
    await db.insert(adminsTable).values({
      email: demoAdmin.email,
      passwordHash,
    })

    const parentIdMap = new Map<number, number>()
    for (const parent of mockParents) {
      const [row] = await db
        .insert(parentsTable)
        .values({
          fullname: parent.fullname,
          phone: parent.phone,
          createdAt: new Date(parent.createdAt),
        })
        .returning({ id: parentsTable.id })

      parentIdMap.set(parent.id, row.id)
    }

    const childIdMap = new Map<number, number>()
    for (const child of mockChildren) {
      const [row] = await db
        .insert(childrenTable)
        .values({
          fullname: child.fullname,
          birthDate: child.birthDate,
          language: child.language,
          parentId: parentIdMap.get(child.parentId) ?? 0,
          createdAt: new Date(child.createdAt),
        })
        .returning({ id: childrenTable.id })

      childIdMap.set(child.id, row.id)
    }

    const testIdMap = new Map<number, number>()
    for (const test of mockTests) {
      const [row] = await db
        .insert(testsTable)
        .values({
          name: test.name,
          ageFrom: test.ageFrom,
          ageTo: test.ageTo,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: testsTable.id })

      testIdMap.set(test.id, row.id)
    }

    const questionIdsByTest = new Map<number, number[]>()
    const answerIdsByQuestion = new Map<number, Array<{ id: number; text: string }>>()

    for (const test of mockTests) {
      const mappedTestId = testIdMap.get(test.id)
      if (!mappedTestId) continue

      const questionIds: number[] = []
      for (let index = 1; index <= 4; index += 1) {
        const [questionRow] = await db
          .insert(questionsTable)
          .values({
            testId: mappedTestId,
            textRu: `Вопрос ${index} для теста "${test.name}"`,
            textKz: `"${test.name}" тестіне арналған ${index}-сұрақ`,
            textEn: null,
          })
          .returning({ id: questionsTable.id })

        questionIds.push(questionRow.id)

        const answers = [
          { textRu: "Редко", textKz: "Сирек", points: 1 },
          { textRu: "Иногда", textKz: "Кейде", points: 2 },
          { textRu: "Часто", textKz: "Жиі", points: 3 },
        ]

        const answerRows = await db
          .insert(answersTable)
          .values(
            answers.map((answer) => ({
              questionId: questionRow.id,
              textRu: answer.textRu,
              textKz: answer.textKz,
              textEn: null,
              points: answer.points,
            }))
          )
          .returning({ id: answersTable.id, textRu: answersTable.textRu })

        answerIdsByQuestion.set(
          questionRow.id,
          answerRows.map((answer) => ({ id: answer.id, text: answer.textRu }))
        )
      }

      questionIdsByTest.set(test.id, questionIds)
    }

    await db.insert(testResultRulesTable).values(
      mockTestRules
        .map((rule) => {
          const mappedTestId = testIdMap.get(rule.testId)
          if (!mappedTestId) return null

          return {
            testId: mappedTestId,
            minScore: rule.minScore,
            maxScore: rule.maxScore,
            label: rule.label,
            textRu: `Автоматически добавленное правило: ${rule.label}`,
            textKz: `Автоматты қосылған ереже: ${rule.label}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        })
        .filter((value): value is NonNullable<typeof value> => value !== null)
    )

    for (const lead of mockLeads) {
      await db.insert(leadsTable).values({
        parentId: parentIdMap.get(lead.parentId) ?? 0,
        childrenId: lead.childrenId ? (childIdMap.get(lead.childrenId) ?? null) : null,
        createdAt: new Date(lead.createdAt),
        status: lead.status,
      })
    }

    for (const session of mockUserSessions) {
      await db.insert(userSessionTable).values({
        parentId: parentIdMap.get(session.parentId) ?? 0,
        childrenId: session.childrenId ? (childIdMap.get(session.childrenId) ?? null) : null,
        status: session.status,
        step: session.step,
        uiLanguage: session.uiLanguage,
        startedAt: new Date(session.startedAt),
        lastSeenAt: new Date(session.lastSeenAt),
      })
    }

    const testSessionIdMap = new Map<number, number>()
    for (const session of mockTestSessions) {
      const [row] = await db
        .insert(testSessionTable)
        .values({
          testId: testIdMap.get(session.testId) ?? 0,
          parentId: parentIdMap.get(session.parentId) ?? 0,
          childrenId: childIdMap.get(session.childrenId) ?? 0,
          chatId: `demo-${session.id}`,
          createdAt: new Date(session.createdAt),
          completedAt: session.completedAt ? new Date(session.completedAt) : null,
          status: session.status,
          score: session.score,
        })
        .returning({ id: testSessionTable.id })

      testSessionIdMap.set(session.id, row.id)
    }

    for (const session of mockTestSessions) {
      const mappedSessionId = testSessionIdMap.get(session.id)
      const questionIds = questionIdsByTest.get(session.testId) ?? []
      if (!mappedSessionId || questionIds.length === 0 || session.answersCount <= 0) continue

      const answerRows = Array.from({ length: session.answersCount }, (_, index) => {
        const questionId = questionIds[index % questionIds.length]
        const answerOptions = answerIdsByQuestion.get(questionId) ?? []
        const answer = answerOptions[index % answerOptions.length]

        return {
          sessonId: mappedSessionId,
          questionId,
          answerId: answer.id,
          answerText: answer.text,
          createdAt: new Date(session.createdAt),
        }
      })

      await db.insert(sessionAnswerTable).values(answerRows)
    }

    for (const lead of mockLandingLeads) {
      await db.execute(sql`
        INSERT INTO "landing_leads" ("fullname", "phone", "question", "created_at")
        VALUES (${lead.fullName}, ${lead.phone}, ${lead.question}, ${new Date(lead.createdAt)});
      `)
    }

    console.log("Mock admin data seeded successfully.")
    console.log(`Admin login: ${demoAdmin.email}`)
    console.log(`Admin password: ${demoAdminPassword}`)
    console.log(`Parents: ${mockParents.length}`)
    console.log(`Children: ${mockChildren.length}`)
    console.log(`Leads: ${mockLeads.length}`)
    console.log(`User sessions: ${mockUserSessions.length}`)
    console.log(`Test sessions: ${mockTestSessions.length}`)
    console.log(`Landing leads: ${mockLandingLeads.length}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error("Failed to seed mock admin data")
  console.error(error)
  process.exit(1)
})
