import { and, eq, inArray, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  diagnosticItemsTable,
  diagnosticSessionsTable,
  diagnosticTemplateItemsTable,
  diagnosticTemplatesTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

const allowedLanguages = new Set(["ru", "kz", "both"]);

type Params = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const diagnosticId = Number(id);
    if (!Number.isInteger(diagnosticId) || diagnosticId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    const existingRows = await db
      .select({ id: diagnosticTemplatesTable.id })
      .from(diagnosticTemplatesTable)
      .where(eq(diagnosticTemplatesTable.id, diagnosticId))
      .limit(1);

    if (!existingRows[0]) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

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

    const duplicate = await db
      .select({ id: diagnosticTemplatesTable.id })
      .from(diagnosticTemplatesTable)
      .where(and(eq(diagnosticTemplatesTable.slug, slug), ne(diagnosticTemplatesTable.id, diagnosticId)))
      .limit(1);

    if (duplicate[0]) {
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

    await db
      .update(diagnosticTemplatesTable)
      .set({
        slug,
        title,
        description,
        language: language as "ru" | "kz" | "both",
        isActive,
        updatedAt: now,
      })
      .where(eq(diagnosticTemplatesTable.id, diagnosticId));

    await db
      .delete(diagnosticTemplateItemsTable)
      .where(eq(diagnosticTemplateItemsTable.diagnosticTemplateId, diagnosticId));

    await db.insert(diagnosticTemplateItemsTable).values(
      orderedItemIds.map((itemId, index) => ({
        diagnosticTemplateId: diagnosticId,
        itemId,
        sortOrder: (index + 1) * 10,
        createdAt: now,
        updatedAt: now,
      }))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin diagnostics PATCH error", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const diagnosticId = Number(id);
    if (!Number.isInteger(diagnosticId) || diagnosticId <= 0) {
      return NextResponse.json({ message: "Некорректный id упражнения" }, { status: 400 });
    }

    const [assignmentRows, sessionRows] = await Promise.all([
      db
        .select({ id: childDiagnosticAssignmentsTable.id })
        .from(childDiagnosticAssignmentsTable)
        .where(eq(childDiagnosticAssignmentsTable.diagnosticTemplateId, diagnosticId))
        .limit(1),
      db
        .select({ id: diagnosticSessionsTable.id })
        .from(diagnosticSessionsTable)
        .where(eq(diagnosticSessionsTable.diagnosticTemplateId, diagnosticId))
        .limit(1),
    ]);

    if (assignmentRows[0] || sessionRows[0]) {
      return NextResponse.json(
        { message: "Это упражнение уже назначали или запускали, поэтому удаление заблокировано" },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(diagnosticTemplatesTable)
      .where(eq(diagnosticTemplatesTable.id, diagnosticId))
      .returning({ id: diagnosticTemplatesTable.id });

    if (!deleted[0]) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin diagnostics DELETE error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
