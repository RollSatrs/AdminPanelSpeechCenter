import { desc, inArray } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import {
  childrenTable,
  parentsTable,
  userSessionTable,
} from "@/db/schema"
import { isAuthorizedAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

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
    testQuestion: "Прохождение теста",
  }
  return labels[step] ?? step
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const sessions = await db
      .select()
      .from(userSessionTable)
      .orderBy(desc(userSessionTable.lastSeenAt), desc(userSessionTable.id))

    const uniqueByParent = new Map<number, (typeof sessions)[number]>()
    for (const session of sessions) {
      if (!uniqueByParent.has(session.parentId)) {
        uniqueByParent.set(session.parentId, session)
      }
    }
    const uniqueSessions = Array.from(uniqueByParent.values())

    const parentIds = uniqueSessions.map((s) => s.parentId)
    const childIds = uniqueSessions
      .map((s) => s.childrenId)
      .filter((id): id is number => typeof id === "number")

    const parentsMap = new Map<number, { id: number; fullname: string; phone: string }>()
    if (parentIds.length > 0) {
      const allParents = await db
        .select()
        .from(parentsTable)
        .where(inArray(parentsTable.id, parentIds))
      for (const parent of allParents) {
        parentsMap.set(parent.id, { id: parent.id, fullname: parent.fullname, phone: parent.phone })
      }
    }

    const childrenMap = new Map<number, { id: number; fullname: string }>()
    if (childIds.length > 0) {
      const allChildren = await db
        .select()
        .from(childrenTable)
        .where(inArray(childrenTable.id, childIds))
      for (const child of allChildren) {
        childrenMap.set(child.id, { id: child.id, fullname: child.fullname })
      }
    }

    const active24hThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const stuck72hThreshold = new Date(Date.now() - 72 * 60 * 60 * 1000)

    const items = uniqueSessions.map((session) => {
      const parent = parentsMap.get(session.parentId)
      const child = session.childrenId ? childrenMap.get(session.childrenId) : null
      return {
        sessionId: session.id,
        parentId: session.parentId,
        parentFullName: parent?.fullname ?? `Parent #${session.parentId}`,
        parentPhone: parent?.phone ?? "—",
        childId: child?.id ?? null,
        childFullName: child?.fullname ?? null,
        status: session.status,
        step: session.step,
        stepLabel: stepLabel(session.step),
        startedAt: session.startedAt,
        lastSeenAt: session.lastSeenAt,
      }
    })

    const summary = {
      uniqueParents: items.length,
      active24h: items.filter((i) => new Date(i.lastSeenAt) >= active24hThreshold).length,
      done: items.filter((i) => i.status === "done").length,
      stuck: items.filter((i) => i.status !== "done" && new Date(i.lastSeenAt) < stuck72hThreshold).length,
    }

    return NextResponse.json({ summary, items })
  } catch (error) {
    console.error("sessions/users error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
