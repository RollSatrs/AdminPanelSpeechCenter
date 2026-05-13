import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  childDiagnosticAssignmentsTable,
  diagnosticItemsTable,
  diagnosticResponsesTable,
  diagnosticSessionsTable,
  diagnosticTemplateItemsTable,
} from "@/db/schema";
import { db } from "@/lib/db";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";
import { getCurrentParentSession } from "@/lib/parent-session";

type Params = {
  params: Promise<{
    id: string;
    itemId: string;
  }>;
};

function extensionFromMimeType(mimeType: string): string {
  if (mimeType.includes("webm")) return "webm";
  if (mimeType.includes("wav")) return "wav";
  if (mimeType.includes("mpeg")) return "mp3";
  if (mimeType.includes("mp4")) return "m4a";
  if (mimeType.includes("ogg")) return "ogg";
  return "bin";
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const parent = await getCurrentParentSession(req);
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id, itemId } = await params;
    const sessionId = Number(id);
    const diagnosticItemId = Number(itemId);

    if (!Number.isInteger(sessionId) || sessionId <= 0 || !Number.isInteger(diagnosticItemId) || diagnosticItemId <= 0) {
      return NextResponse.json({ message: "Некорректные параметры" }, { status: 400 });
    }

    const sessionRows = await db
      .select({
        id: diagnosticSessionsTable.id,
        assignmentId: diagnosticSessionsTable.assignmentId,
        itemSortOrder: diagnosticItemsTable.sortOrder,
        templateItemSortOrder: diagnosticTemplateItemsTable.sortOrder,
      })
      .from(diagnosticSessionsTable)
      .innerJoin(diagnosticResponsesTable, eq(diagnosticResponsesTable.sessionId, diagnosticSessionsTable.id))
      .innerJoin(diagnosticItemsTable, eq(diagnosticItemsTable.id, diagnosticResponsesTable.itemId))
      .leftJoin(
        diagnosticTemplateItemsTable,
        and(
          eq(diagnosticTemplateItemsTable.diagnosticTemplateId, diagnosticSessionsTable.diagnosticTemplateId),
          eq(diagnosticTemplateItemsTable.itemId, diagnosticResponsesTable.itemId)
        )
      )
      .where(
        and(
          eq(diagnosticSessionsTable.id, sessionId),
          eq(diagnosticSessionsTable.parentId, parent.parentId),
          eq(diagnosticResponsesTable.itemId, diagnosticItemId)
        )
      )
      .limit(1);

    const session = sessionRows[0];
    if (!session) {
      return NextResponse.json({ message: "Карточка упражнения не найдена" }, { status: 404 });
    }

    const formData = await req.formData();
    const audio = formData.get("audio");
    const durationMsRaw = Number(formData.get("durationMs"));
    const transcriptRaw = String(formData.get("transcript") ?? "").trim().slice(0, 1000);
    const aiSummaryRaw = String(formData.get("aiSummary") ?? "").trim().slice(0, 2048);

    if (!(audio instanceof File)) {
      return NextResponse.json({ message: "Аудиофайл не передан" }, { status: 400 });
    }

    const mimeType = audio.type || "audio/webm";
    if (!mimeType.startsWith("audio/")) {
      return NextResponse.json({ message: "Нужен аудиофайл" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "diagnostics", String(sessionId));
    await mkdir(uploadDir, { recursive: true });

    const extension = extensionFromMimeType(mimeType);
    const fileName = `${diagnosticItemId}-${randomUUID()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const fileBuffer = Buffer.from(await audio.arrayBuffer());
    await writeFile(filePath, fileBuffer);

    const publicPath = `/uploads/diagnostics/${sessionId}/${fileName}`;
    const now = new Date();

    await db
      .update(diagnosticResponsesTable)
      .set({
        status: "recorded",
        audioPath: publicPath,
        audioMimeType: mimeType,
        audioDurationMs: Number.isFinite(durationMsRaw) && durationMsRaw > 0 ? Math.round(durationMsRaw) : null,
        transcript: transcriptRaw || null,
        aiSummary: aiSummaryRaw || null,
        aiStatus: transcriptRaw ? "completed" : "not_requested",
        analyzedAt: transcriptRaw ? now : null,
        recordedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(diagnosticResponsesTable.sessionId, sessionId),
          eq(diagnosticResponsesTable.itemId, diagnosticItemId)
        )
      );

    await db
      .update(diagnosticSessionsTable)
      .set({
        status: "in_progress",
        startedAt: now,
        currentItemOrder: session.templateItemSortOrder ?? session.itemSortOrder,
        updatedAt: now,
      })
      .where(eq(diagnosticSessionsTable.id, sessionId));

    if (session.assignmentId) {
      await db
        .update(childDiagnosticAssignmentsTable)
        .set({
          status: "in_progress",
          updatedAt: now,
        })
        .where(eq(childDiagnosticAssignmentsTable.id, session.assignmentId));
    }

    return NextResponse.json({
      ok: true,
      audioUrl: publicPath,
      mimeType,
    });
  } catch (error) {
    console.error("cabinet diagnostics recording POST error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
