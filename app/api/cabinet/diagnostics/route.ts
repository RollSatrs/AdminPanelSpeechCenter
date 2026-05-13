import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  childrenTable,
  diagnosticLeadsTable,
  diagnosticResponsesTable,
  diagnosticSessionsTable,
  diagnosticTemplateItemsTable,
  diagnosticTemplatesTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";
import { getCurrentParentSession } from "@/lib/parent-session";

export async function GET(req: NextRequest) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const children = await db
      .select({
        id: childrenTable.id,
        fullName: childrenTable.fullname,
        birthDate: childrenTable.birthDate,
        language: childrenTable.language,
      })
      .from(childrenTable)
      .where(eq(childrenTable.parentId, parent.parentId));

    const childIds = children.map((child) => child.id);
    const assignments =
      childIds.length === 0
        ? []
        : await db
            .select({
              id: childDiagnosticAssignmentsTable.id,
              childId: childDiagnosticAssignmentsTable.childId,
              diagnosticTemplateId: childDiagnosticAssignmentsTable.diagnosticTemplateId,
              status: childDiagnosticAssignmentsTable.status,
              assignedAt: childDiagnosticAssignmentsTable.assignedAt,
              updatedAt: childDiagnosticAssignmentsTable.updatedAt,
              diagnosticTitle: diagnosticTemplatesTable.title,
              diagnosticDescription: diagnosticTemplatesTable.description,
              diagnosticLanguage: diagnosticTemplatesTable.language,
            })
            .from(childDiagnosticAssignmentsTable)
            .innerJoin(
              diagnosticTemplatesTable,
              eq(diagnosticTemplatesTable.id, childDiagnosticAssignmentsTable.diagnosticTemplateId)
            )
            .where(inArray(childDiagnosticAssignmentsTable.childId, childIds))
            .orderBy(desc(childDiagnosticAssignmentsTable.assignedAt), desc(childDiagnosticAssignmentsTable.id));

    const assignmentIds = assignments.map((assignment) => assignment.id);
    const sessions =
      assignmentIds.length === 0
        ? []
        : await db
            .select({
              id: diagnosticSessionsTable.id,
              assignmentId: diagnosticSessionsTable.assignmentId,
              childId: diagnosticSessionsTable.childId,
              status: diagnosticSessionsTable.status,
              currentItemOrder: diagnosticSessionsTable.currentItemOrder,
              startedAt: diagnosticSessionsTable.startedAt,
              submittedAt: diagnosticSessionsTable.submittedAt,
              createdAt: diagnosticSessionsTable.createdAt,
            })
            .from(diagnosticSessionsTable)
            .where(inArray(diagnosticSessionsTable.assignmentId, assignmentIds))
            .orderBy(desc(diagnosticSessionsTable.createdAt), desc(diagnosticSessionsTable.id));

    const sessionIds = sessions.map((session) => session.id);
    const responses =
      sessionIds.length === 0
        ? []
        : await db
            .select({
              sessionId: diagnosticResponsesTable.sessionId,
              status: diagnosticResponsesTable.status,
            })
            .from(diagnosticResponsesTable)
            .where(inArray(diagnosticResponsesTable.sessionId, sessionIds));

    const responseStats = new Map<number, { total: number; recorded: number }>();
    for (const response of responses) {
      const current = responseStats.get(response.sessionId) ?? { total: 0, recorded: 0 };
      current.total += 1;
      if (response.status !== "pending") {
        current.recorded += 1;
      }
      responseStats.set(response.sessionId, current);
    }

    const latestSessionByAssignment = new Map<number, (typeof sessions)[number]>();
    for (const session of sessions) {
      if (session.assignmentId && !latestSessionByAssignment.has(session.assignmentId)) {
        latestSessionByAssignment.set(session.assignmentId, session);
      }
    }

    const templateIds = [...new Set(assignments.map((assignment) => assignment.diagnosticTemplateId))];
    const templateItems =
      templateIds.length === 0
        ? []
        : await db
            .select({
              diagnosticTemplateId: diagnosticTemplateItemsTable.diagnosticTemplateId,
            })
            .from(diagnosticTemplateItemsTable)
            .where(inArray(diagnosticTemplateItemsTable.diagnosticTemplateId, templateIds))
            .orderBy(asc(diagnosticTemplateItemsTable.sortOrder), asc(diagnosticTemplateItemsTable.id));

    const itemCountByTemplate = new Map<number, number>();
    for (const item of templateItems) {
      itemCountByTemplate.set(item.diagnosticTemplateId, (itemCountByTemplate.get(item.diagnosticTemplateId) ?? 0) + 1);
    }

    const assignmentsByChild = new Map<number, Array<(typeof assignments)[number]>>();
    for (const assignment of assignments) {
      const bucket = assignmentsByChild.get(assignment.childId) ?? [];
      bucket.push(assignment);
      assignmentsByChild.set(assignment.childId, bucket);
    }

    return NextResponse.json({
      ok: true,
      parent: {
        id: parent.parentId,
        fullName: parent.fullName,
        phone: parent.phone,
        login: parent.login,
      },
      children: children.map((child) => {
        return {
          id: child.id,
          fullName: child.fullName,
          birthDate: String(child.birthDate),
          language: child.language,
          diagnostics: (assignmentsByChild.get(child.id) ?? []).map((assignment) => {
            const session = latestSessionByAssignment.get(assignment.id) ?? null;
            const stats = session ? responseStats.get(session.id) ?? { total: 0, recorded: 0 } : { total: 0, recorded: 0 };

            return {
              assignmentId: assignment.id,
              status: assignment.status,
              assignedAt:
                assignment.assignedAt instanceof Date
                  ? assignment.assignedAt.toISOString()
                  : String(assignment.assignedAt),
              diagnostic: {
                id: assignment.diagnosticTemplateId,
                title: assignment.diagnosticTitle,
                description: assignment.diagnosticDescription,
                language: assignment.diagnosticLanguage,
                totalItems: itemCountByTemplate.get(assignment.diagnosticTemplateId) ?? 0,
              },
              session: session
                ? {
                    sessionId: session.id,
                    status: session.status,
                    currentItemOrder: session.currentItemOrder,
                    recordedItems: stats.recorded,
                    totalItems: stats.total,
                    startedAt:
                      session.startedAt instanceof Date
                        ? session.startedAt.toISOString()
                        : session.startedAt
                          ? String(session.startedAt)
                          : null,
                    submittedAt:
                      session.submittedAt instanceof Date
                        ? session.submittedAt.toISOString()
                        : session.submittedAt
                          ? String(session.submittedAt)
                          : null,
                  }
                : null,
            };
          }),
        };
      }),
    });
  } catch (error) {
    console.error("cabinet diagnostics GET error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const body = await req.json().catch(() => null);
    const assignmentId = Number(body?.assignmentId);

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({ message: "Некорректное упражнение" }, { status: 400 });
    }

    const assignmentRows = await db
      .select({
        id: childDiagnosticAssignmentsTable.id,
        childId: childDiagnosticAssignmentsTable.childId,
        diagnosticTemplateId: childDiagnosticAssignmentsTable.diagnosticTemplateId,
        language: childrenTable.language,
      })
      .from(childDiagnosticAssignmentsTable)
      .innerJoin(childrenTable, eq(childrenTable.id, childDiagnosticAssignmentsTable.childId))
      .where(and(eq(childDiagnosticAssignmentsTable.id, assignmentId), eq(childrenTable.parentId, parent.parentId)))
      .limit(1);

    const assignment = assignmentRows[0];
    if (!assignment) {
      return NextResponse.json({ message: "Назначенное упражнение не найдено" }, { status: 404 });
    }

    const existingRows = await db
      .select({
        id: diagnosticSessionsTable.id,
        status: diagnosticSessionsTable.status,
      })
      .from(diagnosticSessionsTable)
      .where(
        and(
          eq(diagnosticSessionsTable.assignmentId, assignmentId),
          or(
            eq(diagnosticSessionsTable.status, "not_started"),
            eq(diagnosticSessionsTable.status, "in_progress")
          )
        )
      )
      .orderBy(desc(diagnosticSessionsTable.createdAt), desc(diagnosticSessionsTable.id))
      .limit(1);

    if (existingRows[0]) {
      return NextResponse.json({ ok: true, sessionId: existingRows[0].id, resumed: true });
    }

    const latestFinishedRows = await db
      .select({ id: diagnosticSessionsTable.id })
      .from(diagnosticSessionsTable)
      .where(eq(diagnosticSessionsTable.assignmentId, assignmentId))
      .orderBy(desc(diagnosticSessionsTable.createdAt), desc(diagnosticSessionsTable.id))
      .limit(1);

    if (latestFinishedRows[0]) {
      return NextResponse.json({ ok: true, sessionId: latestFinishedRows[0].id, resumed: true, readonly: true });
    }

    const itemRows = await db
      .select({
        itemId: diagnosticTemplateItemsTable.itemId,
        sortOrder: diagnosticTemplateItemsTable.sortOrder,
      })
      .from(diagnosticTemplateItemsTable)
      .where(eq(diagnosticTemplateItemsTable.diagnosticTemplateId, assignment.diagnosticTemplateId))
      .orderBy(asc(diagnosticTemplateItemsTable.sortOrder), asc(diagnosticTemplateItemsTable.id));

    if (itemRows.length === 0) {
      return NextResponse.json({ message: "В назначенном упражнении пока нет карточек" }, { status: 400 });
    }

    const leadRows = await db
      .select({ id: diagnosticLeadsTable.id })
      .from(diagnosticLeadsTable)
      .where(
        and(
          eq(diagnosticLeadsTable.parentId, parent.parentId),
          eq(diagnosticLeadsTable.childId, assignment.childId)
        )
      )
      .orderBy(desc(diagnosticLeadsTable.createdAt), desc(diagnosticLeadsTable.id))
      .limit(1);

    const inserted = await db
      .insert(diagnosticSessionsTable)
      .values({
        diagnosticLeadId: leadRows[0]?.id ?? null,
        diagnosticTemplateId: assignment.diagnosticTemplateId,
        assignmentId,
        parentId: parent.parentId,
        childId: assignment.childId,
        status: "not_started",
        currentItemOrder: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: diagnosticSessionsTable.id });

    const sessionId = inserted[0]?.id;
    if (!sessionId) {
      return NextResponse.json({ message: "Не удалось открыть упражнение" }, { status: 500 });
    }

    await db.insert(diagnosticResponsesTable).values(
      itemRows.map((item) => ({
        sessionId,
        itemId: item.itemId,
        status: "pending" as const,
        aiStatus: "not_requested" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    await db
      .update(childDiagnosticAssignmentsTable)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(childDiagnosticAssignmentsTable.id, assignmentId));

    return NextResponse.json({ ok: true, sessionId, resumed: false });
  } catch (error) {
    console.error("cabinet diagnostics POST error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
