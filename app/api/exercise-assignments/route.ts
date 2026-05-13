import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  childrenTable,
  diagnosticItemsTable,
  diagnosticTemplateItemsTable,
  diagnosticTemplatesTable,
  parentsTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const parentId = Number(req.nextUrl.searchParams.get("parentId"));
    if (!Number.isInteger(parentId) || parentId <= 0) {
      return NextResponse.json({ message: "Некорректный parentId" }, { status: 400 });
    }

    const parentRows = await db
      .select({
        id: parentsTable.id,
        fullName: parentsTable.fullname,
        phone: parentsTable.phone,
      })
      .from(parentsTable)
      .where(eq(parentsTable.id, parentId))
      .limit(1);

    const parent = parentRows[0];
    if (!parent) {
      return NextResponse.json({ message: "Родитель не найден" }, { status: 404 });
    }

    const children = await db
      .select({
        id: childrenTable.id,
        fullName: childrenTable.fullname,
        birthDate: childrenTable.birthDate,
        language: childrenTable.language,
      })
      .from(childrenTable)
      .where(eq(childrenTable.parentId, parentId))
      .orderBy(asc(childrenTable.fullname), asc(childrenTable.id));

    const childIds = children.map((child) => child.id);

    const exercises = await db
      .select({
        id: diagnosticTemplatesTable.id,
        slug: diagnosticTemplatesTable.slug,
        title: diagnosticTemplatesTable.title,
        description: diagnosticTemplatesTable.description,
        language: diagnosticTemplatesTable.language,
        isActive: diagnosticTemplatesTable.isActive,
      })
      .from(diagnosticTemplatesTable)
      .where(eq(diagnosticTemplatesTable.isActive, true))
      .orderBy(asc(diagnosticTemplatesTable.title), asc(diagnosticTemplatesTable.id));

    const exerciseIds = exercises.map((exercise) => exercise.id);
    const templateItems =
      exerciseIds.length === 0
        ? []
        : await db
            .select({
              diagnosticTemplateId: diagnosticTemplateItemsTable.diagnosticTemplateId,
              itemId: diagnosticTemplateItemsTable.itemId,
              sortOrder: diagnosticTemplateItemsTable.sortOrder,
              word: diagnosticItemsTable.word,
              soundGroup: diagnosticItemsTable.soundGroup,
              imageEmoji: diagnosticItemsTable.imageEmoji,
              accentColor: diagnosticItemsTable.accentColor,
            })
            .from(diagnosticTemplateItemsTable)
            .innerJoin(diagnosticItemsTable, eq(diagnosticItemsTable.id, diagnosticTemplateItemsTable.itemId))
            .where(inArray(diagnosticTemplateItemsTable.diagnosticTemplateId, exerciseIds))
            .orderBy(
              asc(diagnosticTemplateItemsTable.diagnosticTemplateId),
              asc(diagnosticTemplateItemsTable.sortOrder),
              asc(diagnosticTemplateItemsTable.id)
            );

    const exerciseMetaById = new Map<
      number,
      {
        itemCount: number;
        previewWord: string | null;
        previewSoundGroup: string | null;
        previewImageEmoji: string | null;
        previewAccentColor: string | null;
      }
    >();

    for (const item of templateItems) {
      const current = exerciseMetaById.get(item.diagnosticTemplateId) ?? {
        itemCount: 0,
        previewWord: null,
        previewSoundGroup: null,
        previewImageEmoji: null,
        previewAccentColor: null,
      };

      current.itemCount += 1;
      if (!current.previewWord) {
        current.previewWord = item.word;
        current.previewSoundGroup = item.soundGroup;
        current.previewImageEmoji = item.imageEmoji;
        current.previewAccentColor = item.accentColor;
      }
      exerciseMetaById.set(item.diagnosticTemplateId, current);
    }

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
              submittedAt: childDiagnosticAssignmentsTable.submittedAt,
              reviewedAt: childDiagnosticAssignmentsTable.reviewedAt,
              childFullName: childrenTable.fullname,
              exerciseTitle: diagnosticTemplatesTable.title,
              exerciseDescription: diagnosticTemplatesTable.description,
            })
            .from(childDiagnosticAssignmentsTable)
            .innerJoin(childrenTable, eq(childrenTable.id, childDiagnosticAssignmentsTable.childId))
            .innerJoin(
              diagnosticTemplatesTable,
              eq(diagnosticTemplatesTable.id, childDiagnosticAssignmentsTable.diagnosticTemplateId)
            )
            .where(inArray(childDiagnosticAssignmentsTable.childId, childIds))
            .orderBy(
              desc(childDiagnosticAssignmentsTable.assignedAt),
              desc(childDiagnosticAssignmentsTable.id)
            );

    return NextResponse.json({
      parent,
      children: children.map((child) => ({
        ...child,
        birthDate: String(child.birthDate),
      })),
      exercises: exercises.map((exercise) => {
        const meta = exerciseMetaById.get(exercise.id);
        return {
          id: exercise.id,
          slug: exercise.slug,
          title: exercise.title,
          description: exercise.description,
          language: exercise.language,
          isActive: exercise.isActive,
          itemCount: meta?.itemCount ?? 0,
          previewWord: meta?.previewWord ?? null,
          previewSoundGroup: meta?.previewSoundGroup ?? null,
          previewImageEmoji: meta?.previewImageEmoji ?? null,
          previewAccentColor: meta?.previewAccentColor ?? null,
        };
      }),
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        childId: assignment.childId,
        childFullName: assignment.childFullName,
        exerciseId: assignment.diagnosticTemplateId,
        exerciseTitle: assignment.exerciseTitle,
        exerciseDescription: assignment.exerciseDescription,
        itemCount: exerciseMetaById.get(assignment.diagnosticTemplateId)?.itemCount ?? 0,
        status: assignment.status,
        assignedAt:
          assignment.assignedAt instanceof Date
            ? assignment.assignedAt.toISOString()
            : String(assignment.assignedAt),
        updatedAt:
          assignment.updatedAt instanceof Date
            ? assignment.updatedAt.toISOString()
            : String(assignment.updatedAt),
        submittedAt:
          assignment.submittedAt instanceof Date
            ? assignment.submittedAt.toISOString()
            : assignment.submittedAt
              ? String(assignment.submittedAt)
              : null,
        reviewedAt:
          assignment.reviewedAt instanceof Date
            ? assignment.reviewedAt.toISOString()
            : assignment.reviewedAt
              ? String(assignment.reviewedAt)
              : null,
      })),
    });
  } catch (error) {
    console.error("exercise assignments GET error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const body = await req.json().catch(() => null);
    const childId = Number(body?.childId);
    const exerciseId = Number(body?.exerciseId ?? body?.diagnosticTemplateId);

    if (!Number.isInteger(childId) || childId <= 0 || !Number.isInteger(exerciseId) || exerciseId <= 0) {
      return NextResponse.json({ message: "Некорректные данные назначения" }, { status: 400 });
    }

    const [childRows, exerciseRows, existingRows] = await Promise.all([
      db
        .select({ id: childrenTable.id })
        .from(childrenTable)
        .where(eq(childrenTable.id, childId))
        .limit(1),
      db
        .select({ id: diagnosticTemplatesTable.id, isActive: diagnosticTemplatesTable.isActive })
        .from(diagnosticTemplatesTable)
        .where(eq(diagnosticTemplatesTable.id, exerciseId))
        .limit(1),
      db
        .select({ id: childDiagnosticAssignmentsTable.id })
        .from(childDiagnosticAssignmentsTable)
        .where(
          and(
            eq(childDiagnosticAssignmentsTable.childId, childId),
            eq(childDiagnosticAssignmentsTable.diagnosticTemplateId, exerciseId)
          )
        )
        .limit(1),
    ]);

    if (!childRows[0]) {
      return NextResponse.json({ message: "Ребёнок не найден" }, { status: 404 });
    }

    if (!exerciseRows[0]) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    if (!exerciseRows[0].isActive) {
      return NextResponse.json({ message: "Назначать можно только активное упражнение" }, { status: 400 });
    }

    if (existingRows[0]) {
      return NextResponse.json({ ok: true, assignmentId: existingRows[0].id, alreadyExists: true });
    }

    const now = new Date();
    const inserted = await db
      .insert(childDiagnosticAssignmentsTable)
      .values({
        childId,
        diagnosticTemplateId: exerciseId,
        status: "assigned",
        assignedAt: now,
        updatedAt: now,
      })
      .returning({ id: childDiagnosticAssignmentsTable.id });

    return NextResponse.json({ ok: true, assignmentId: inserted[0]?.id ?? null, alreadyExists: false });
  } catch (error) {
    console.error("exercise assignments POST error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
