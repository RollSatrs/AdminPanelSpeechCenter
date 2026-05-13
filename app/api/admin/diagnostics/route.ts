import { asc, desc, eq, inArray } from "drizzle-orm";
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

const allowedLanguages = new Set(["ru", "kz", "both"]);

function uniqueOrderedNumbers(values: unknown): number[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<number>();
  const result: number[] = [];

  for (const value of values) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0 || seen.has(parsed)) continue;
    seen.add(parsed);
    result.push(parsed);
  }

  return result;
}

function readBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const [diagnostics, availableItems, children, assignmentRows] = await Promise.all([
      db
        .select({
          id: diagnosticTemplatesTable.id,
          slug: diagnosticTemplatesTable.slug,
          title: diagnosticTemplatesTable.title,
          description: diagnosticTemplatesTable.description,
          language: diagnosticTemplatesTable.language,
          isActive: diagnosticTemplatesTable.isActive,
          createdAt: diagnosticTemplatesTable.createdAt,
          updatedAt: diagnosticTemplatesTable.updatedAt,
        })
        .from(diagnosticTemplatesTable)
        .orderBy(desc(diagnosticTemplatesTable.updatedAt), asc(diagnosticTemplatesTable.id)),
      db
        .select({
          id: diagnosticItemsTable.id,
          slug: diagnosticItemsTable.slug,
          language: diagnosticItemsTable.language,
          soundGroup: diagnosticItemsTable.soundGroup,
          targetSound: diagnosticItemsTable.targetSound,
          title: diagnosticItemsTable.title,
          word: diagnosticItemsTable.word,
          imageUrl: diagnosticItemsTable.imageUrl,
          imageEmoji: diagnosticItemsTable.imageEmoji,
          accentColor: diagnosticItemsTable.accentColor,
          sortOrder: diagnosticItemsTable.sortOrder,
        })
        .from(diagnosticItemsTable)
        .orderBy(asc(diagnosticItemsTable.sortOrder), asc(diagnosticItemsTable.id)),
      db
        .select({
          id: childrenTable.id,
          fullName: childrenTable.fullname,
          birthDate: childrenTable.birthDate,
          language: childrenTable.language,
          parentId: parentsTable.id,
          parentFullName: parentsTable.fullname,
          parentPhone: parentsTable.phone,
        })
        .from(childrenTable)
        .innerJoin(parentsTable, eq(parentsTable.id, childrenTable.parentId))
        .orderBy(asc(parentsTable.fullname), asc(childrenTable.fullname), asc(childrenTable.id)),
      db
        .select({
          id: childDiagnosticAssignmentsTable.id,
          childId: childDiagnosticAssignmentsTable.childId,
          diagnosticTemplateId: childDiagnosticAssignmentsTable.diagnosticTemplateId,
          status: childDiagnosticAssignmentsTable.status,
          assignedAt: childDiagnosticAssignmentsTable.assignedAt,
          updatedAt: childDiagnosticAssignmentsTable.updatedAt,
          childFullName: childrenTable.fullname,
          childLanguage: childrenTable.language,
          parentFullName: parentsTable.fullname,
          parentPhone: parentsTable.phone,
          diagnosticTitle: diagnosticTemplatesTable.title,
        })
        .from(childDiagnosticAssignmentsTable)
        .innerJoin(childrenTable, eq(childrenTable.id, childDiagnosticAssignmentsTable.childId))
        .innerJoin(parentsTable, eq(parentsTable.id, childrenTable.parentId))
        .innerJoin(diagnosticTemplatesTable, eq(diagnosticTemplatesTable.id, childDiagnosticAssignmentsTable.diagnosticTemplateId))
        .orderBy(desc(childDiagnosticAssignmentsTable.assignedAt), desc(childDiagnosticAssignmentsTable.id)),
    ]);

    const diagnosticIds = diagnostics.map((diagnostic) => diagnostic.id);
    const templateItems =
      diagnosticIds.length === 0
        ? []
        : await db
            .select({
              id: diagnosticTemplateItemsTable.id,
              diagnosticTemplateId: diagnosticTemplateItemsTable.diagnosticTemplateId,
              itemId: diagnosticTemplateItemsTable.itemId,
              sortOrder: diagnosticTemplateItemsTable.sortOrder,
              itemSlug: diagnosticItemsTable.slug,
              itemLanguage: diagnosticItemsTable.language,
              itemSoundGroup: diagnosticItemsTable.soundGroup,
              itemTargetSound: diagnosticItemsTable.targetSound,
              itemTitle: diagnosticItemsTable.title,
              itemWord: diagnosticItemsTable.word,
              itemImageUrl: diagnosticItemsTable.imageUrl,
              itemImageEmoji: diagnosticItemsTable.imageEmoji,
              itemAccentColor: diagnosticItemsTable.accentColor,
            })
            .from(diagnosticTemplateItemsTable)
            .innerJoin(diagnosticItemsTable, eq(diagnosticItemsTable.id, diagnosticTemplateItemsTable.itemId))
            .where(inArray(diagnosticTemplateItemsTable.diagnosticTemplateId, diagnosticIds))
            .orderBy(asc(diagnosticTemplateItemsTable.sortOrder), asc(diagnosticTemplateItemsTable.id));

    const templateItemsByDiagnostic = new Map<number, typeof templateItems>();
    for (const templateItem of templateItems) {
      const bucket = templateItemsByDiagnostic.get(templateItem.diagnosticTemplateId) ?? [];
      bucket.push(templateItem);
      templateItemsByDiagnostic.set(templateItem.diagnosticTemplateId, bucket);
    }

    const assignmentCountByDiagnostic = new Map<number, number>();
    for (const assignment of assignmentRows) {
      assignmentCountByDiagnostic.set(
        assignment.diagnosticTemplateId,
        (assignmentCountByDiagnostic.get(assignment.diagnosticTemplateId) ?? 0) + 1
      );
    }

    return NextResponse.json({
      ok: true,
      diagnostics: diagnostics.map((diagnostic) => ({
        id: diagnostic.id,
        slug: diagnostic.slug,
        title: diagnostic.title,
        description: diagnostic.description,
        language: diagnostic.language,
        isActive: diagnostic.isActive,
        itemCount: (templateItemsByDiagnostic.get(diagnostic.id) ?? []).length,
        assignmentCount: assignmentCountByDiagnostic.get(diagnostic.id) ?? 0,
        createdAt:
          diagnostic.createdAt instanceof Date ? diagnostic.createdAt.toISOString() : String(diagnostic.createdAt),
        updatedAt:
          diagnostic.updatedAt instanceof Date ? diagnostic.updatedAt.toISOString() : String(diagnostic.updatedAt),
        items: (templateItemsByDiagnostic.get(diagnostic.id) ?? []).map((item) => ({
          id: item.id,
          itemId: item.itemId,
          sortOrder: item.sortOrder,
          item: {
            id: item.itemId,
            slug: item.itemSlug,
            language: item.itemLanguage,
            soundGroup: item.itemSoundGroup,
            targetSound: item.itemTargetSound,
            title: item.itemTitle,
            word: item.itemWord,
            imageUrl: item.itemImageUrl,
            imageEmoji: item.itemImageEmoji,
            accentColor: item.itemAccentColor,
          },
        })),
      })),
      items: availableItems,
      children: children.map((child) => ({
        id: child.id,
        fullName: child.fullName,
        birthDate: String(child.birthDate),
        language: child.language,
        parentId: child.parentId,
        parentFullName: child.parentFullName,
        parentPhone: child.parentPhone,
      })),
      assignments: assignmentRows.map((assignment) => ({
        id: assignment.id,
        childId: assignment.childId,
        childFullName: assignment.childFullName,
        childLanguage: assignment.childLanguage,
        parentFullName: assignment.parentFullName,
        parentPhone: assignment.parentPhone,
        diagnosticTemplateId: assignment.diagnosticTemplateId,
        diagnosticTitle: assignment.diagnosticTitle,
        status: assignment.status,
        assignedAt:
          assignment.assignedAt instanceof Date ? assignment.assignedAt.toISOString() : String(assignment.assignedAt),
        updatedAt:
          assignment.updatedAt instanceof Date ? assignment.updatedAt.toISOString() : String(assignment.updatedAt),
      })),
    });
  } catch (error) {
    console.error("admin diagnostics GET error", error);
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
    const slug = String(body?.slug ?? "").trim();
    const title = String(body?.title ?? "").trim();
    const description = String(body?.description ?? "").trim() || null;
    const language = String(body?.language ?? "").trim();
    const isActive = readBoolean(body?.isActive);
    const orderedItemIds = uniqueOrderedNumbers(body?.orderedItemIds);

    if (!slug || !title) {
      return NextResponse.json({ message: "Укажите slug и название упражнения" }, { status: 400 });
    }

    if (!allowedLanguages.has(language)) {
      return NextResponse.json({ message: "Некорректный язык упражнения" }, { status: 400 });
    }

    if (orderedItemIds.length === 0) {
      return NextResponse.json({ message: "Добавьте хотя бы одну карточку в упражнение" }, { status: 400 });
    }

    const existing = await db
      .select({ id: diagnosticTemplatesTable.id })
      .from(diagnosticTemplatesTable)
      .where(eq(diagnosticTemplatesTable.slug, slug))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ message: "Упражнение с таким slug уже существует" }, { status: 409 });
    }

    const items = await db
      .select({ id: diagnosticItemsTable.id })
      .from(diagnosticItemsTable)
      .where(inArray(diagnosticItemsTable.id, orderedItemIds));

    if (items.length !== orderedItemIds.length) {
      return NextResponse.json({ message: "Некоторые карточки упражнения не найдены" }, { status: 400 });
    }

    const now = new Date();
    const inserted = await db
      .insert(diagnosticTemplatesTable)
      .values({
        slug,
        title,
        description,
        language: language as "ru" | "kz" | "both",
        isActive,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: diagnosticTemplatesTable.id });

    const diagnosticTemplateId = inserted[0]?.id;
    if (!diagnosticTemplateId) {
      return NextResponse.json({ message: "Не удалось создать упражнение" }, { status: 500 });
    }

    await db.insert(diagnosticTemplateItemsTable).values(
      orderedItemIds.map((itemId, index) => ({
        diagnosticTemplateId,
        itemId,
        sortOrder: (index + 1) * 10,
        createdAt: now,
        updatedAt: now,
      }))
    );

    return NextResponse.json({ ok: true, id: diagnosticTemplateId });
  } catch (error) {
    console.error("admin diagnostics POST error", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
