import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedAdmin } from "@/lib/admin-auth"
import {
  childrenTable,
  diagnosticLeadsTable,
  parentAccountsTable,
  parentsTable,
  userSessionTable,
} from "@/db/schema"
import { db } from "@/lib/db"
import { ensureDiagnosticLeadsTable, findBestParentByPhone } from "@/lib/diagnostic-leads"
import { hashPassword } from "@/lib/parent-auth"
import { ensureParentAuthTables } from "@/lib/parent-auth-db"
import { isSupportedPhone, normalizePhone } from "@/lib/phone"

type DiagnosticLeadRow = {
  id: number
  parent_id: number
  child_id: number | null
  fullname: string
  phone: string
  status: "pending" | "issued"
  access_login: string | null
  access_password: string | null
  access_issued_at: Date | string | null
  created_at: Date | string
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return String(value)
}

function normalizeFullName(value: string): string {
  return String(value ?? "").replace(/\s+/g, " ").trim()
}

function isChildLanguage(value: string): value is "ru" | "kz" | "both" {
  return value === "ru" || value === "kz" || value === "both"
}

function isIsoBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return false
  if (date.toISOString().slice(0, 10) !== value) return false

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  return date <= today
}

function stepLabel(step: string): string {
  const labels: Record<string, string> = {
    idle: "Старт",
    chooseUiLanguage: "Выбор языка",
    parentPhone: "Телефон родителя",
    parentFullName: "ФИО родителя",
    confirmParentFullName: "Подтверждение ФИО",
    childFullName: "ФИО ребёнка",
    childLanguage: "Язык ребёнка",
    childAge: "Возраст ребёнка",
    confirmData: "Подтверждение данных",
    mainMenu: "Главное меню",
    chooseChild: "Выбор ребёнка",
    testQuestion: "Прохождение теста",
  }

  return labels[step] ?? step
}

export async function POST(req: NextRequest) {
  try {
    await ensureDiagnosticLeadsTable()

    const body = await req.json().catch(() => null)
    const fullName = String(body?.fullname ?? "").trim()
    const phone = String(body?.phone ?? "").trim()
    const normalizedPhone = normalizePhone(phone)
    const childFullName = normalizeFullName(body?.childFullName ?? "")
    const childBirthDate = String(body?.childBirthDate ?? "").trim()
    const childLanguage = String(body?.childLanguage ?? "").trim()

    if (!isSupportedPhone(phone)) {
      return NextResponse.json(
        { message: "Номер телефона должен начинаться с 8. Например: 87071234567" },
        { status: 400 }
      )
    }

    if (
      fullName.length < 2 ||
      childFullName.length < 2 ||
      !isIsoBirthDate(childBirthDate) ||
      !isChildLanguage(childLanguage)
    ) {
      return NextResponse.json({ message: "Некорректные данные заявки" }, { status: 400 })
    }

    const existingParent = await findBestParentByPhone(phone)

    let parentId = existingParent?.id ?? null

    if (!parentId) {
      const insertedParent = await db
        .insert(parentsTable)
        .values({ fullname: fullName, phone: normalizedPhone })
        .returning({ id: parentsTable.id })
      parentId = insertedParent[0]?.id ?? null
    } else {
      await db
        .update(parentsTable)
        .set({ fullname: fullName })
        .where(eq(parentsTable.id, parentId))
    }

    if (!parentId || Number.isNaN(parentId)) {
      return NextResponse.json({ message: "Не удалось сохранить заявку" }, { status: 500 })
    }

    const existingChild = await db
      .select({ id: childrenTable.id })
      .from(childrenTable)
      .where(
        and(
          eq(childrenTable.parentId, parentId),
          eq(childrenTable.birthDate, childBirthDate),
          sql`lower(${childrenTable.fullname}) = lower(${childFullName})`
        )
      )
      .orderBy(desc(childrenTable.createdAt), desc(childrenTable.id))
      .limit(1)

    let childId = existingChild[0]?.id ?? null

    if (childId) {
      await db
        .update(childrenTable)
        .set({
          fullname: childFullName,
          birthDate: childBirthDate,
          language: childLanguage,
        })
        .where(eq(childrenTable.id, childId))
    } else {
      const insertedChild = await db
        .insert(childrenTable)
        .values({
          fullname: childFullName,
          birthDate: childBirthDate,
          language: childLanguage,
          parentId,
        })
        .returning({ id: childrenTable.id })
      childId = insertedChild[0]?.id ?? null
    }

    if (!childId || Number.isNaN(childId)) {
      return NextResponse.json({ message: "Не удалось сохранить данные ребёнка" }, { status: 500 })
    }

    await db.insert(diagnosticLeadsTable).values({ parentId, childId })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("diagnostic leads create error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await ensureDiagnosticLeadsTable()

    const rows = await db.execute(sql`
      SELECT
        dl."id",
        dl."parent_id",
        dl."child_id",
        p."fullname",
        p."phone",
        dl."status",
        dl."access_login",
        dl."access_password",
        dl."access_issued_at",
        dl."created_at"
      FROM "diagnostic_leads" dl
      INNER JOIN "parents" p ON p."id" = dl."parent_id"
      ORDER BY dl."created_at" DESC, dl."id" DESC;
    `)

    const parentIds = Array.from(new Set((rows.rows as DiagnosticLeadRow[]).map((row) => row.parent_id)))

    const [children, userSessions, parentAccounts] = await Promise.all([
      parentIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: childrenTable.id,
              parentId: childrenTable.parentId,
              fullName: childrenTable.fullname,
              birthDate: childrenTable.birthDate,
              language: childrenTable.language,
              createdAt: childrenTable.createdAt,
            })
            .from(childrenTable)
            .where(inArray(childrenTable.parentId, parentIds))
            .orderBy(desc(childrenTable.createdAt), desc(childrenTable.id)),
      parentIds.length === 0
        ? Promise.resolve([])
        : db
            .select({
              id: userSessionTable.id,
              parentId: userSessionTable.parentId,
              childrenId: userSessionTable.childrenId,
              step: userSessionTable.step,
              lastSeenAt: userSessionTable.lastSeenAt,
            })
            .from(userSessionTable)
            .where(inArray(userSessionTable.parentId, parentIds))
            .orderBy(desc(userSessionTable.lastSeenAt), desc(userSessionTable.id)),
      parentIds.length === 0
        ? Promise.resolve([])
        : db
            .select({ parentId: parentAccountsTable.parentId })
            .from(parentAccountsTable)
            .where(inArray(parentAccountsTable.parentId, parentIds)),
    ])

    const childById = new Map(children.map((child) => [child.id, child]))
    const childrenByParent = new Map<number, Array<(typeof children)[number]>>()
    for (const child of children) {
      const current = childrenByParent.get(child.parentId) ?? []
      current.push(child)
      childrenByParent.set(child.parentId, current)
    }

    const latestSessionByParent = new Map<number, (typeof userSessions)[number]>()
    for (const session of userSessions) {
      if (!latestSessionByParent.has(session.parentId)) {
        latestSessionByParent.set(session.parentId, session)
      }
    }

    const parentAccountIds = new Set(parentAccounts.map((account) => account.parentId))

    const items = (rows.rows as DiagnosticLeadRow[]).map((row) => {
      const parentChildren = childrenByParent.get(row.parent_id) ?? []
      const latestSession = latestSessionByParent.get(row.parent_id) ?? null
      const resolvedChild =
        (row.child_id ? childById.get(row.child_id) ?? null : null) ??
        (latestSession?.childrenId ? childById.get(latestSession.childrenId) ?? null : null) ??
        parentChildren[0] ??
        null

      return {
        id: row.id,
        parentId: row.parent_id,
        fullName: row.fullname,
        phone: row.phone,
        status: row.status,
        accessLogin: row.access_login,
        accessPassword: row.access_password,
        accessIssuedAt: toIsoString(row.access_issued_at),
        createdAt: toIsoString(row.created_at),
        childId: resolvedChild?.id ?? null,
        childFullName: resolvedChild?.fullName ?? null,
        childBirthDate: resolvedChild?.birthDate ? String(resolvedChild.birthDate) : null,
        childLanguage: resolvedChild?.language ?? null,
        childrenCount: parentChildren.length,
        sessionStep: latestSession?.step ?? null,
        sessionStepLabel: latestSession?.step ? stepLabel(latestSession.step) : null,
        sessionLastSeenAt: toIsoString(latestSession?.lastSeenAt),
        hasCabinetAccess: parentAccountIds.has(row.parent_id),
      }
    })

    return NextResponse.json({
      summary: {
        total: items.length,
        pending: items.filter((item) => item.status === "pending").length,
        issued: items.filter((item) => item.status === "issued").length,
      },
      items,
    })
  } catch (error) {
    console.error("diagnostic leads list error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await ensureDiagnosticLeadsTable()
    await ensureParentAuthTables()

    const body = await req.json().catch(() => null)
    const id = Number(body?.id)
    const accessLogin = String(body?.accessLogin ?? "").trim().toLowerCase()
    const accessPassword = String(body?.accessPassword ?? "").trim()

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ message: "Некорректный id заявки" }, { status: 400 })
    }

    if (accessLogin.length < 3 || accessPassword.length < 3) {
      return NextResponse.json({ message: "Укажите логин и пароль" }, { status: 400 })
    }

    const leadRows = await db.execute(sql`
      SELECT "parent_id"
      FROM "diagnostic_leads"
      WHERE "id" = ${id}
      LIMIT 1;
    `)

    const parentId = Number((leadRows.rows[0] as { parent_id?: number } | undefined)?.parent_id)
    if (!Number.isInteger(parentId) || parentId <= 0) {
      return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 })
    }

    const loginConflict = await db
      .select({ id: parentAccountsTable.id })
      .from(parentAccountsTable)
      .where(eq(parentAccountsTable.login, accessLogin))
      .limit(1)

    const existingAccount = await db
      .select({ id: parentAccountsTable.id })
      .from(parentAccountsTable)
      .where(eq(parentAccountsTable.parentId, parentId))
      .limit(1)

    if (loginConflict.length > 0 && loginConflict[0]?.id !== existingAccount[0]?.id) {
      return NextResponse.json({ message: "Этот логин уже занят" }, { status: 409 })
    }

    const passwordHash = await hashPassword(accessPassword)

    if (existingAccount.length > 0) {
      await db
        .update(parentAccountsTable)
        .set({
          login: accessLogin,
          passwordHash,
          isActive: true,
        })
        .where(eq(parentAccountsTable.id, existingAccount[0].id))
    } else {
      await db.insert(parentAccountsTable).values({
        parentId,
        login: accessLogin,
        passwordHash,
        isActive: true,
      })
    }

    const updated = await db.execute(sql`
      UPDATE "diagnostic_leads"
      SET
        "status" = 'issued',
        "access_login" = ${accessLogin},
        "access_password" = ${accessPassword},
        "access_issued_at" = now()
      WHERE "id" = ${id}
      RETURNING "id";
    `)

    if (updated.rows.length === 0) {
      return NextResponse.json({ message: "Заявка не найдена" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      item: {
        id,
        status: "issued",
        accessLogin,
        accessPassword,
      },
    })
  } catch (error) {
    console.error("diagnostic leads update error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
