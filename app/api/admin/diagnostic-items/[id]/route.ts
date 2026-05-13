import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  diagnosticItemsTable,
  diagnosticResponsesTable,
  diagnosticTemplateItemsTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { inferDiagnosticCardLanguage } from "@/lib/diagnostic-card-config";
import { db } from "@/lib/db";
import { saveDiagnosticItemImage } from "@/lib/diagnostic-item-images";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const { id } = await params;
    const itemId = Number(id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ message: "Некорректный id карточки" }, { status: 400 });
    }

    const existingRows = await db
      .select({
        id: diagnosticItemsTable.id,
        imageUrl: diagnosticItemsTable.imageUrl,
        sortOrder: diagnosticItemsTable.sortOrder,
      })
      .from(diagnosticItemsTable)
      .where(eq(diagnosticItemsTable.id, itemId))
      .limit(1);

    const existing = existingRows[0];
    if (!existing) {
      return NextResponse.json({ message: "Карточка не найдена" }, { status: 404 });
    }

    const formData = await req.formData();
    const slug = readText(formData, "slug");
    const soundGroup = readText(formData, "soundGroup");
    const targetSound = readText(formData, "targetSound");
    const word = readText(formData, "word");
    const prompt = readText(formData, "prompt") || null;
    const helperText = readText(formData, "helperText") || null;
    const imageAlt = readText(formData, "imageAlt") || null;
    const imageEmoji = readText(formData, "imageEmoji") || null;
    const accentColor = readText(formData, "accentColor") || null;
    const fallbackImageUrl = readText(formData, "imageUrl") || null;
    const removeImage = readText(formData, "removeImage") === "true";
    const imageFile = formData.get("image");

    if (!slug || !soundGroup || !targetSound || !word) {
      return NextResponse.json({ message: "Заполните обязательные поля карточки" }, { status: 400 });
    }

    const duplicate = await db
      .select({ id: diagnosticItemsTable.id })
      .from(diagnosticItemsTable)
      .where(and(eq(diagnosticItemsTable.slug, slug), ne(diagnosticItemsTable.id, itemId)))
      .limit(1);

    if (duplicate[0]) {
      return NextResponse.json({ message: "Карточка с таким slug уже существует" }, { status: 409 });
    }

    let imageUrl = removeImage ? null : fallbackImageUrl ?? existing.imageUrl;
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await saveDiagnosticItemImage(imageFile, slug || word);
    }

    const language = inferDiagnosticCardLanguage({ soundGroup, targetSound, word });
    const title = word;

    await db
      .update(diagnosticItemsTable)
      .set({
        slug,
        language,
        soundGroup,
        targetSound,
        title,
        word,
        prompt,
        helperText,
        imageUrl,
        imageAlt,
        imageEmoji,
        accentColor,
        sortOrder: existing.sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(diagnosticItemsTable.id, itemId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin diagnostic items PATCH error", error);
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
    const itemId = Number(id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return NextResponse.json({ message: "Некорректный id карточки" }, { status: 400 });
    }

    const [templateUsageRows, responseUsageRows] = await Promise.all([
      db
        .select({ id: diagnosticTemplateItemsTable.id })
        .from(diagnosticTemplateItemsTable)
        .where(eq(diagnosticTemplateItemsTable.itemId, itemId))
        .limit(1),
      db
        .select({ id: diagnosticResponsesTable.id })
        .from(diagnosticResponsesTable)
        .where(eq(diagnosticResponsesTable.itemId, itemId))
        .limit(1),
    ]);

    if (templateUsageRows[0] || responseUsageRows[0]) {
      return NextResponse.json(
        { message: "Карточка уже используется в упражнении или в ответах ребенка, удаление заблокировано" },
        { status: 400 }
      );
    }

    const deleted = await db
      .delete(diagnosticItemsTable)
      .where(eq(diagnosticItemsTable.id, itemId))
      .returning({ id: diagnosticItemsTable.id });

    if (!deleted[0]) {
      return NextResponse.json({ message: "Карточка не найдена" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin diagnostic items DELETE error", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
