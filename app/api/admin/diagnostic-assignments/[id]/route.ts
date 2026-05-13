import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  diagnosticSessionsTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const assignmentId = Number(id);
    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json({ message: "Некорректный id назначения" }, { status: 400 });
    }

    const sessionRows = await db
      .select({ id: diagnosticSessionsTable.id })
      .from(diagnosticSessionsTable)
      .where(eq(diagnosticSessionsTable.assignmentId, assignmentId))
      .limit(1);

    if (sessionRows[0]) {
      return NextResponse.json(
        { message: "Снять упражнение нельзя: по этому назначению уже создана диагностическая сессия" },
        { status: 409 }
      );
    }

    const deleted = await db
      .delete(childDiagnosticAssignmentsTable)
      .where(eq(childDiagnosticAssignmentsTable.id, assignmentId))
      .returning({ id: childDiagnosticAssignmentsTable.id });

    if (!deleted[0]) {
      return NextResponse.json({ message: "Назначение не найдено" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin diagnostic assignments DELETE error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
