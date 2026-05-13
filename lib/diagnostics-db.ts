import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import {
  diagnosticItemsTable,
  diagnosticTemplateItemsTable,
  diagnosticTemplatesTable,
} from "@/db/schema";
import { db } from "@/lib/db";

let ensured = false;
const defaultDiagnosticTemplateSlug = "base-kz-screening";

const diagnosticSeed = [
  {
    slug: "kz-s-sabyn",
    language: "kz" as const,
    soundGroup: "Ысқырық дыбыстар",
    targetSound: "С",
    title: "Звук С",
    word: "Сабын",
    prompt: "Попросите ребёнка назвать предмет на карточке и отчётливо произнести слово «Сабын».",
    helperText: "Проверяем, насколько чисто слышится звук «С» в начале слова.",
    imageAlt: "Кусок мыла",
    imageEmoji: "🧼",
    accentColor: "#6EC1E4",
    sortOrder: 10,
  },
  {
    slug: "kz-s-asyq",
    language: "kz" as const,
    soundGroup: "Ысқырық дыбыстар",
    targetSound: "С",
    title: "Звук С",
    word: "Асық",
    prompt: "Покажите ребёнку карточку и запишите, как он произносит слово «Асық».",
    helperText: "Здесь целевой звук звучит внутри слова.",
    imageAlt: "Асык, косточка для игры",
    imageEmoji: "🎲",
    accentColor: "#6EC1E4",
    sortOrder: 20,
  },
  {
    slug: "kz-s-tas",
    language: "kz" as const,
    soundGroup: "Ысқырық дыбыстар",
    targetSound: "С",
    title: "Звук С",
    word: "Тас",
    prompt: "Запишите, как ребёнок спокойно и чётко произносит слово «Тас».",
    helperText: "Проверяем звук «С» в конце слова.",
    imageAlt: "Камень",
    imageEmoji: "🪨",
    accentColor: "#6EC1E4",
    sortOrder: 30,
  },
  {
    slug: "kz-z-zebra",
    language: "kz" as const,
    soundGroup: "Ысқырық дыбыстар",
    targetSound: "З",
    title: "Звук З",
    word: "Зебра",
    prompt: "Попросите ребёнка назвать изображение и произнести слово «Зебра».",
    helperText: "Проверяем звонкий звук «З» в начале слова.",
    imageAlt: "Зебра",
    imageEmoji: "🦓",
    accentColor: "#A68CF5",
    sortOrder: 40,
  },
  {
    slug: "kz-z-syzgysh",
    language: "kz" as const,
    soundGroup: "Ысқырық дыбыстар",
    targetSound: "З",
    title: "Звук З",
    word: "Сызғыш",
    prompt: "Запишите, как ребёнок произносит слово «Сызғыш».",
    helperText: "Слушаем, не выпадает ли звонкость и середина слова.",
    imageAlt: "Линейка",
    imageEmoji: "📏",
    accentColor: "#A68CF5",
    sortOrder: 50,
  },
  {
    slug: "kz-ng-shangy",
    language: "kz" as const,
    soundGroup: "Мұрын жолды дыбыстар",
    targetSound: "Ң",
    title: "Звук Ң",
    word: "Шаңғы",
    prompt: "Попросите ребёнка отчётливо произнести слово «Шаңғы».",
    helperText: "Проверяем носовой звук «Ң» в середине слова.",
    imageAlt: "Лыжи",
    imageEmoji: "🎿",
    accentColor: "#54B58B",
    sortOrder: 60,
  },
  {
    slug: "kz-ng-qonyrau",
    language: "kz" as const,
    soundGroup: "Мұрын жолды дыбыстар",
    targetSound: "Ң",
    title: "Звук Ң",
    word: "Қоңырау",
    prompt: "Покажите карточку и запишите произношение слова «Қоңырау».",
    helperText: "Нужен чистый звук «Ң» без упрощения середины слова.",
    imageAlt: "Колокольчик",
    imageEmoji: "🔔",
    accentColor: "#54B58B",
    sortOrder: 70,
  },
  {
    slug: "kz-sh-shana",
    language: "kz" as const,
    soundGroup: "Ызың дыбыстар",
    targetSound: "Ш",
    title: "Звук Ш",
    word: "Шана",
    prompt: "Попросите ребёнка назвать предмет на картинке: «Шана».",
    helperText: "Проверяем шипящий звук «Ш» в начале слова.",
    imageAlt: "Санки",
    imageEmoji: "🛷",
    accentColor: "#F59863",
    sortOrder: 80,
  },
  {
    slug: "kz-sh-shyrsha",
    language: "kz" as const,
    soundGroup: "Ызың дыбыстар",
    targetSound: "Ш",
    title: "Звук Ш",
    word: "Шырша",
    prompt: "Запишите, как ребёнок произносит слово «Шырша».",
    helperText: "Здесь звук «Ш» повторяется несколько раз и хорошо слышен.",
    imageAlt: "Елка",
    imageEmoji: "🎄",
    accentColor: "#F59863",
    sortOrder: 90,
  },
  {
    slug: "kz-zh-zhuldyz",
    language: "kz" as const,
    soundGroup: "Ызың дыбыстар",
    targetSound: "Ж",
    title: "Звук Ж",
    word: "Жұлдыз",
    prompt: "Попросите ребёнка произнести слово «Жұлдыз» спокойно и без спешки.",
    helperText: "Слушаем, насколько чисто звучит «Ж» в начале слова.",
    imageAlt: "Звезда",
    imageEmoji: "⭐",
    accentColor: "#F59863",
    sortOrder: 100,
  },
  {
    slug: "kz-l-laq",
    language: "kz" as const,
    soundGroup: "Сонор дыбыстар",
    targetSound: "Л",
    title: "Звук Л",
    word: "Лақ",
    prompt: "Покажите ребёнку карточку и запишите слово «Лақ».",
    helperText: "Проверяем мягкость и чистоту звука «Л».",
    imageAlt: "Козленок",
    imageEmoji: "🐐",
    accentColor: "#5FA8FF",
    sortOrder: 110,
  },
  {
    slug: "kz-r-radio",
    language: "kz" as const,
    soundGroup: "Сонор дыбыстар",
    targetSound: "Р",
    title: "Звук Р",
    word: "Радио",
    prompt: "Попросите ребёнка произнести слово «Радио» и запишите ответ.",
    helperText: "Проверяем наличие и чистоту звука «Р» в начале слова.",
    imageAlt: "Радио",
    imageEmoji: "📻",
    accentColor: "#5FA8FF",
    sortOrder: 120,
  },
  {
    slug: "kz-k-kobelek",
    language: "kz" as const,
    soundGroup: "Тіл асты айтылатын дыбыстар",
    targetSound: "К",
    title: "Звук К",
    word: "Көбелек",
    prompt: "Покажите картинку и запишите, как ребёнок произносит слово «Көбелек».",
    helperText: "Слушаем заднеязычный звук «К» в начале слова.",
    imageAlt: "Бабочка",
    imageEmoji: "🦋",
    accentColor: "#7B82F1",
    sortOrder: 130,
  },
  {
    slug: "kz-g-gul",
    language: "kz" as const,
    soundGroup: "Тіл асты айтылатын дыбыстар",
    targetSound: "Г",
    title: "Звук Г",
    word: "Гүл",
    prompt: "Попросите ребёнка назвать изображение и произнести слово «Гүл».",
    helperText: "Проверяем звонкий заднеязычный звук «Г».",
    imageAlt: "Цветок",
    imageEmoji: "🌷",
    accentColor: "#7B82F1",
    sortOrder: 140,
  },
] satisfies Array<{
  slug: string;
  language: "ru" | "kz" | "both";
  soundGroup: string;
  targetSound: string;
  title: string;
  word: string;
  prompt: string;
  helperText: string;
  imageAlt: string;
  imageEmoji: string;
  accentColor: string;
  sortOrder: number;
}>;

export async function ensureDiagnosticsTables() {
  if (ensured) return;

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "diagnostic_session_status" AS ENUM ('not_started', 'in_progress', 'submitted', 'reviewed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "diagnostic_response_status" AS ENUM ('pending', 'recorded', 'submitted', 'analyzed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "diagnostic_ai_status" AS ENUM ('not_requested', 'queued', 'completed', 'failed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "diagnostic_assignment_status" AS ENUM ('assigned', 'in_progress', 'submitted', 'reviewed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_items" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "slug" varchar(160) NOT NULL UNIQUE,
      "language" "child_language" NOT NULL,
      "sound_group" varchar(64) NOT NULL,
      "target_sound" varchar(32) NOT NULL,
      "title" varchar(255) NOT NULL,
      "word" varchar(120) NOT NULL,
      "prompt" varchar(255),
      "helper_text" varchar(1000),
      "image_url" varchar(512),
      "image_alt" varchar(255),
      "image_emoji" varchar(16),
      "accent_color" varchar(32),
      "sort_order" integer NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_templates" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "slug" varchar(160) NOT NULL UNIQUE,
      "title" varchar(255) NOT NULL,
      "description" varchar(2000),
      "language" "child_language" NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_template_items" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "diagnostic_template_id" integer NOT NULL REFERENCES "diagnostic_templates"("id") ON DELETE cascade,
      "item_id" integer NOT NULL REFERENCES "diagnostic_items"("id") ON DELETE cascade,
      "sort_order" integer NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "child_diagnostic_assignments" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "child_id" integer NOT NULL REFERENCES "children"("id") ON DELETE cascade,
      "diagnostic_template_id" integer NOT NULL REFERENCES "diagnostic_templates"("id") ON DELETE cascade,
      "assigned_by_admin_id" integer REFERENCES "admins"("id") ON DELETE set null,
      "status" "diagnostic_assignment_status" NOT NULL DEFAULT 'assigned',
      "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
      "submitted_at" timestamp with time zone,
      "reviewed_at" timestamp with time zone,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "diagnostic_lead_id" integer REFERENCES "diagnostic_leads"("id") ON DELETE set null,
      "diagnostic_template_id" integer REFERENCES "diagnostic_templates"("id") ON DELETE set null,
      "assignment_id" integer REFERENCES "child_diagnostic_assignments"("id") ON DELETE set null,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "child_id" integer NOT NULL REFERENCES "children"("id") ON DELETE cascade,
      "status" "diagnostic_session_status" NOT NULL DEFAULT 'not_started',
      "current_item_order" integer NOT NULL DEFAULT 0,
      "started_at" timestamp with time zone,
      "submitted_at" timestamp with time zone,
      "reviewed_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_responses" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "session_id" integer NOT NULL REFERENCES "diagnostic_sessions"("id") ON DELETE cascade,
      "item_id" integer NOT NULL REFERENCES "diagnostic_items"("id") ON DELETE cascade,
      "status" "diagnostic_response_status" NOT NULL DEFAULT 'pending',
      "audio_path" varchar(512),
      "audio_mime_type" varchar(128),
      "audio_duration_ms" integer,
      "transcript" varchar(1000),
      "ai_status" "diagnostic_ai_status" NOT NULL DEFAULT 'not_requested',
      "ai_summary" varchar(2048),
      "recorded_at" timestamp with time zone,
      "analyzed_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "prompt" varchar(255);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "helper_text" varchar(1000);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "image_url" varchar(512);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "image_alt" varchar(255);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "image_emoji" varchar(16);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "accent_color" varchar(32);`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "diagnostic_items" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "diagnostic_templates" ADD COLUMN IF NOT EXISTS "description" varchar(2000);`);
  await db.execute(sql`ALTER TABLE "diagnostic_templates" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;`);
  await db.execute(sql`ALTER TABLE "diagnostic_templates" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "diagnostic_templates" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "diagnostic_template_items" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;`);
  await db.execute(sql`ALTER TABLE "diagnostic_template_items" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "diagnostic_template_items" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "child_diagnostic_assignments" ADD COLUMN IF NOT EXISTS "status" "diagnostic_assignment_status" NOT NULL DEFAULT 'assigned';`);
  await db.execute(sql`ALTER TABLE "child_diagnostic_assignments" ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "child_diagnostic_assignments" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "child_diagnostic_assignments" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "child_diagnostic_assignments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "diagnostic_lead_id" integer REFERENCES "diagnostic_leads"("id") ON DELETE set null;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "diagnostic_template_id" integer REFERENCES "diagnostic_templates"("id") ON DELETE set null;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "assignment_id" integer REFERENCES "child_diagnostic_assignments"("id") ON DELETE set null;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "current_item_order" integer NOT NULL DEFAULT 0;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "started_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "submitted_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "diagnostic_sessions" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "audio_path" varchar(512);`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "audio_mime_type" varchar(128);`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "audio_duration_ms" integer;`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "transcript" varchar(1000);`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "ai_status" "diagnostic_ai_status" NOT NULL DEFAULT 'not_requested';`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "ai_summary" varchar(2048);`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "recorded_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "analyzed_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "diagnostic_responses" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  const existing = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "diagnostic_items";`);
  const count = Number((existing.rows[0] as { count?: number | string } | undefined)?.count ?? 0);

  if (count === 0) {
    await db.insert(diagnosticItemsTable).values(diagnosticSeed);
  }

  const templatesExisting = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "diagnostic_templates";`);
  const templateCount = Number((templatesExisting.rows[0] as { count?: number | string } | undefined)?.count ?? 0);

  if (templateCount === 0) {
    await db.insert(diagnosticTemplatesTable).values({
      slug: defaultDiagnosticTemplateSlug,
      title: "Базовая диагностика",
      description: "Первичный голосовой скрининг по карточкам из диагностического документа.",
      language: "kz",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  const defaultTemplateRows = await db
    .select({ id: diagnosticTemplatesTable.id })
    .from(diagnosticTemplatesTable)
    .where(eq(diagnosticTemplatesTable.slug, defaultDiagnosticTemplateSlug))
    .limit(1);

  const defaultTemplateId = defaultTemplateRows[0]?.id;

  if (defaultTemplateId) {
    const existingTemplateItems = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM "diagnostic_template_items" WHERE "diagnostic_template_id" = ${defaultTemplateId};`
    );
    const templateItemsCount = Number(
      (existingTemplateItems.rows[0] as { count?: number | string } | undefined)?.count ?? 0
    );

    if (templateItemsCount === 0) {
      const items = await db
        .select({
          id: diagnosticItemsTable.id,
          sortOrder: diagnosticItemsTable.sortOrder,
        })
        .from(diagnosticItemsTable)
        .orderBy(asc(diagnosticItemsTable.sortOrder), asc(diagnosticItemsTable.id));

      if (items.length > 0) {
        await db.insert(diagnosticTemplateItemsTable).values(
          items.map((item) => ({
            diagnosticTemplateId: defaultTemplateId,
            itemId: item.id,
            sortOrder: item.sortOrder,
            createdAt: new Date(),
            updatedAt: new Date(),
          }))
        );
      }
    }
  }

  ensured = true;
}
