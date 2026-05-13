import { asc, desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { diagnosticItemsTable } from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { inferDiagnosticCardLanguage } from "@/lib/diagnostic-card-config";
import { db } from "@/lib/db";
import { saveDiagnosticItemImage } from "@/lib/diagnostic-item-images";
import { ensureDiagnosticsTables } from "@/lib/diagnostics-db";

function readText(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await ensureDiagnosticsTables();

    const items = await db
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
        createdAt: diagnosticItemsTable.createdAt,
        updatedAt: diagnosticItemsTable.updatedAt,
      })
      .from(diagnosticItemsTable)
      .orderBy(asc(diagnosticItemsTable.sortOrder), asc(diagnosticItemsTable.id));

    return NextResponse.json({
      ok: true,
      items: items.map((item) => ({
        ...item,
        createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
        updatedAt: item.updatedAt instanceof Date ? item.updatedAt.toISOString() : String(item.updatedAt),
      })),
    });
  } catch (error) {
    console.error("admin diagnostic items GET error", error);
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
    const imageFile = formData.get("image");

    if (!slug || !soundGroup || !targetSound || !word) {
      return NextResponse.json({ message: "Заполните обязательные поля карточки" }, { status: 400 });
    }

    const existing = await db
      .select({ id: diagnosticItemsTable.id })
      .from(diagnosticItemsTable)
      .where(eq(diagnosticItemsTable.slug, slug))
      .limit(1);

    if (existing[0]) {
      return NextResponse.json({ message: "Карточка с таким slug уже существует" }, { status: 409 });
    }

    let imageUrl = fallbackImageUrl;
    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await saveDiagnosticItemImage(imageFile, slug || word);
    }

    const language = inferDiagnosticCardLanguage({ soundGroup, targetSound, word });
    const title = word;

    const latestItemRows = await db
      .select({ sortOrder: diagnosticItemsTable.sortOrder })
      .from(diagnosticItemsTable)
      .orderBy(desc(diagnosticItemsTable.sortOrder), desc(diagnosticItemsTable.id))
      .limit(1);

    const nextSortOrder = (latestItemRows[0]?.sortOrder ?? 0) + 10;

    const inserted = await db
      .insert(diagnosticItemsTable)
      .values({
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
        sortOrder: nextSortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: diagnosticItemsTable.id });

    return NextResponse.json({ ok: true, id: inserted[0]?.id ?? null });
  } catch (error) {
    console.error("admin diagnostic items POST error", error);
    const message = error instanceof Error ? error.message : "Internal error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
