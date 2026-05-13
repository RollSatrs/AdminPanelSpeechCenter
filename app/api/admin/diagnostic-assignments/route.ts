import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  childrenTable,
  diagnosticTemplatesTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

export async function POST(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const body = await req.json().catch(() => null);
    const childId = Number(body?.childId);
    const diagnosticTemplateId = Number(body?.diagnosticTemplateId);

    if (!Number.isInteger(childId) || childId <= 0 || !Number.isInteger(diagnosticTemplateId) || diagnosticTemplateId <= 0) {
      return NextResponse.json({ message: "Некорректный ребенок или упражнение" }, { status: 400 });
    }

    const [childRows, diagnosticRows, existingRows] = await Promise.all([
      db
        .select({ id: childrenTable.id })
        .from(childrenTable)
        .where(eq(childrenTable.id, childId))
        .limit(1),
      db
        .select({ id: diagnosticTemplatesTable.id, isActive: diagnosticTemplatesTable.isActive })
        .from(diagnosticTemplatesTable)
        .where(eq(diagnosticTemplatesTable.id, diagnosticTemplateId))
        .limit(1),
      db
        .select({ id: childDiagnosticAssignmentsTable.id })
        .from(childDiagnosticAssignmentsTable)
        .where(
          and(
            eq(childDiagnosticAssignmentsTable.childId, childId),
            eq(childDiagnosticAssignmentsTable.diagnosticTemplateId, diagnosticTemplateId)
          )
        )
        .limit(1),
    ]);

    if (!childRows[0]) {
      return NextResponse.json({ message: "Ребенок не найден" }, { status: 404 });
    }

    if (!diagnosticRows[0]) {
      return NextResponse.json({ message: "Упражнение не найдено" }, { status: 404 });
    }

    if (!diagnosticRows[0].isActive) {
      return NextResponse.json({ message: "Назначать можно только активное упражнение" }, { status: 400 });
    }

    if (existingRows[0]) {
      return NextResponse.json({ ok: true, id: existingRows[0].id, alreadyExists: true });
    }

    const inserted = await db
      .insert(childDiagnosticAssignmentsTable)
      .values({
        childId,
        diagnosticTemplateId,
        status: "assigned",
        assignedAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: childDiagnosticAssignmentsTable.id });

    return NextResponse.json({ ok: true, id: inserted[0]?.id ?? null, alreadyExists: false });
  } catch (error) {
    console.error("admin diagnostic assignments POST error", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
