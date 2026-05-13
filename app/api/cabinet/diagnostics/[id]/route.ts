import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  childrenTable,
  diagnosticItemsTable,
  diagnosticResponsesTable,
  diagnosticSessionsTable,
  diagnosticTemplateItemsTable,
  diagnosticTemplatesTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";
import { getCurrentParentSession } from "@/lib/parent-session";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    const sessionRows = await db
      .select({
        id: diagnosticSessionsTable.id,
        childId: diagnosticSessionsTable.childId,
        diagnosticTemplateId: diagnosticSessionsTable.diagnosticTemplateId,
        assignmentId: diagnosticSessionsTable.assignmentId,
        status: diagnosticSessionsTable.status,
        currentItemOrder: diagnosticSessionsTable.currentItemOrder,
        startedAt: diagnosticSessionsTable.startedAt,
        submittedAt: diagnosticSessionsTable.submittedAt,
        reviewedAt: diagnosticSessionsTable.reviewedAt,
        childFullName: childrenTable.fullname,
        childBirthDate: childrenTable.birthDate,
        childLanguage: childrenTable.language,
        diagnosticTitle: diagnosticTemplatesTable.title,
        diagnosticDescription: diagnosticTemplatesTable.description,
      })
      .from(diagnosticSessionsTable)
      .innerJoin(childrenTable, eq(childrenTable.id, diagnosticSessionsTable.childId))
      .leftJoin(diagnosticTemplatesTable, eq(diagnosticTemplatesTable.id, diagnosticSessionsTable.diagnosticTemplateId))
      .where(
        and(
          eq(diagnosticSessionsTable.id, sessionId),
          eq(diagnosticSessionsTable.parentId, parent.parentId)
        )
      )
      .limit(1);

    const session = sessionRows[0];
    if (!session) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    const responseRows = await db
      .select({
        id: diagnosticResponsesTable.id,
        itemId: diagnosticResponsesTable.itemId,
        status: diagnosticResponsesTable.status,
        audioPath: diagnosticResponsesTable.audioPath,
        audioMimeType: diagnosticResponsesTable.audioMimeType,
        audioDurationMs: diagnosticResponsesTable.audioDurationMs,
        transcript: diagnosticResponsesTable.transcript,
        aiStatus: diagnosticResponsesTable.aiStatus,
        aiSummary: diagnosticResponsesTable.aiSummary,
        recordedAt: diagnosticResponsesTable.recordedAt,
        analyzedAt: diagnosticResponsesTable.analyzedAt,
      })
      .from(diagnosticResponsesTable)
      .where(eq(diagnosticResponsesTable.sessionId, sessionId));

    const itemIds = responseRows.map((response) => response.itemId);
    const templateItems =
      session.diagnosticTemplateId && itemIds.length > 0
        ? await db
            .select({
              itemId: diagnosticTemplateItemsTable.itemId,
              sortOrder: diagnosticTemplateItemsTable.sortOrder,
            })
            .from(diagnosticTemplateItemsTable)
            .where(
              and(
                eq(diagnosticTemplateItemsTable.diagnosticTemplateId, session.diagnosticTemplateId),
                inArray(diagnosticTemplateItemsTable.itemId, itemIds)
              )
            )
        : [];

    const items =
      itemIds.length === 0
        ? []
        : await db
            .select({
              id: diagnosticItemsTable.id,
              slug: diagnosticItemsTable.slug,
              language: diagnosticItemsTable.language,
              soundGroup: diagnosticItemsTable.soundGroup,
              targetSound: diagnosticItemsTable.targetSound,
              title: diagnosticItemsTable.title,
              word: diagnosticItemsTable.word,
              prompt: diagnosticItemsTable.prompt,
              helperText: diagnosticItemsTable.helperText,
              imageUrl: diagnosticItemsTable.imageUrl,
              imageAlt: diagnosticItemsTable.imageAlt,
              imageEmoji: diagnosticItemsTable.imageEmoji,
              accentColor: diagnosticItemsTable.accentColor,
              sortOrder: diagnosticItemsTable.sortOrder,
            })
            .from(diagnosticItemsTable)
            .where(inArray(diagnosticItemsTable.id, itemIds));

    const templateSortOrderByItemId = new Map(templateItems.map((item) => [item.itemId, item.sortOrder]));
    const itemById = new Map(items.map((item) => [item.id, item]));
    const orderedItems = responseRows
      .map((response) => {
        const item = itemById.get(response.itemId);
        if (!item) return null;
        const resolvedSortOrder = templateSortOrderByItemId.get(item.id) ?? item.sortOrder;
        return {
          responseId: response.id,
          item: {
            id: item.id,
            slug: item.slug,
            language: item.language,
            soundGroup: item.soundGroup,
            targetSound: item.targetSound,
            title: item.title,
            word: item.word,
            prompt: item.prompt,
            helperText: item.helperText,
            imageUrl: item.imageUrl,
            imageAlt: item.imageAlt,
            imageEmoji: item.imageEmoji ?? "🖼️",
            accentColor: item.accentColor ?? "#111111",
            sortOrder: resolvedSortOrder,
          },
          status: response.status,
          audioUrl: response.audioPath,
          audioMimeType: response.audioMimeType,
          audioDurationMs: response.audioDurationMs,
          transcript: response.transcript,
          aiStatus: response.aiStatus,
          aiSummary: response.aiSummary,
          recordedAt:
            response.recordedAt instanceof Date
              ? response.recordedAt.toISOString()
              : response.recordedAt
                ? String(response.recordedAt)
                : null,
          analyzedAt:
            response.analyzedAt instanceof Date
              ? response.analyzedAt.toISOString()
              : response.analyzedAt
                ? String(response.analyzedAt)
                : null,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => a.item.sortOrder - b.item.sortOrder);

    const recordedItems = orderedItems.filter((item) => item.status !== "pending").length;

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        assignmentId: session.assignmentId,
        status: session.status,
        currentItemOrder: session.currentItemOrder,
        startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : session.startedAt ? String(session.startedAt) : null,
        submittedAt: session.submittedAt instanceof Date ? session.submittedAt.toISOString() : session.submittedAt ? String(session.submittedAt) : null,
        reviewedAt: session.reviewedAt instanceof Date ? session.reviewedAt.toISOString() : session.reviewedAt ? String(session.reviewedAt) : null,
        diagnostic: {
          id: session.diagnosticTemplateId,
          title: session.diagnosticTitle ?? "Упражнение",
          description: session.diagnosticDescription ?? null,
        },
        progress: {
          recordedItems,
          totalItems: orderedItems.length,
        },
        child: {
          id: session.childId,
          fullName: session.childFullName,
          birthDate: String(session.childBirthDate),
          language: session.childLanguage,
        },
        items: orderedItems,
      },
    });
  } catch (error) {
    console.error("cabinet diagnostics session GET error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const sessionId = Number(id);
    const body = await req.json().catch(() => null);
    const action = String(body?.action ?? "").trim();

    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    const rows = await db
      .select({
        id: diagnosticSessionsTable.id,
        assignmentId: diagnosticSessionsTable.assignmentId,
      })
      .from(diagnosticSessionsTable)
      .where(
        and(
          eq(diagnosticSessionsTable.id, sessionId),
          eq(diagnosticSessionsTable.parentId, parent.parentId)
        )
      )
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    if (action !== "submit") {
      return NextResponse.json({ message: "Некорректное действие" }, { status: 400 });
    }

    await db
      .update(diagnosticResponsesTable)
      .set({
        status: "submitted",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticResponsesTable.sessionId, sessionId),
          inArray(diagnosticResponsesTable.status, ["recorded", "analyzed"])
        )
      );

    await db
      .update(diagnosticSessionsTable)
      .set({
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(diagnosticSessionsTable.id, sessionId));

    if (rows[0]?.assignmentId) {
      await db
        .update(childDiagnosticAssignmentsTable)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(childDiagnosticAssignmentsTable.id, rows[0].assignmentId));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("cabinet diagnostics session PATCH error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
