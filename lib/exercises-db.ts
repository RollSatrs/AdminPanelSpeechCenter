import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureExerciseTables() {
  if (ensured) return;

  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "exercise_assignment_status" AS ENUM ('assigned', 'in_progress', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "speech_exercises" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "slug" varchar(120) NOT NULL UNIQUE,
      "title" varchar(255) NOT NULL,
      "word" varchar(120) NOT NULL,
      "target_sound" varchar(32),
      "image_emoji" varchar(16),
      "accent_color" varchar(32),
      "sample_prompt" varchar(255),
      "helper_text" varchar(1000),
      "created_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "child_exercise_assignments" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "child_id" integer NOT NULL REFERENCES "children"("id") ON DELETE cascade,
      "exercise_id" integer NOT NULL REFERENCES "speech_exercises"("id") ON DELETE cascade,
      "assigned_by_admin_id" integer REFERENCES "admins"("id") ON DELETE set null,
      "status" "exercise_assignment_status" NOT NULL DEFAULT 'assigned',
      "notes" varchar(1000),
      "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
      "completed_at" timestamp with time zone
    );
  `);

  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "target_sound" varchar(32);`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "image_emoji" varchar(16);`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "accent_color" varchar(32);`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "sample_prompt" varchar(255);`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "helper_text" varchar(1000);`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "speech_exercises" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);

  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "assigned_by_admin_id" integer REFERENCES "admins"("id") ON DELETE set null;`);
  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "status" "exercise_assignment_status" NOT NULL DEFAULT 'assigned';`);
  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "notes" varchar(1000);`);
  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "assigned_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone NOT NULL DEFAULT now();`);
  await db.execute(sql`ALTER TABLE "child_exercise_assignments" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;`);

  const existing = await db.execute(sql`SELECT COUNT(*)::int AS count FROM "speech_exercises";`);
  const count = Number((existing.rows[0] as { count?: number | string } | undefined)?.count ?? 0);

  if (count === 0) {
    await db.execute(sql`
      INSERT INTO "speech_exercises"
        ("slug", "title", "word", "target_sound", "image_emoji", "accent_color", "sample_prompt", "helper_text")
      VALUES
        ('apple-b', 'Яркий звук Б', 'Яблоко', 'Б', '🍎', '#FF8B6A', 'Повтори слово «Яблоко» спокойно и отчётливо.', 'Следите, чтобы ребёнок хорошо выделял звук «Б» в середине слова.'),
        ('drum-b', 'Сильный удар Б', 'Барабан', 'Б', '🥁', '#FFB15C', 'Сначала послушайте слово «Барабан», затем повторите его вместе.', 'Хорошо подходит для тренировки звонкого звука «Б» в начале слова.'),
        ('fish-r', 'Рычащий звук Р', 'Рыба', 'Р', '🐟', '#54B7C6', 'Попросите ребёнка произнести слово «Рыба» плавно и без спешки.', 'Обратите внимание на чёткое начало слова и мягкое удержание звука «Р».'),
        ('moon-l', 'Чистый звук Л', 'Луна', 'Л', '🌙', '#7A8CFF', 'Послушайте, как звучит слово «Луна», и повторите его несколько раз.', 'Подходит для мягкой тренировки звука «Л» на коротком слове.'),
        ('juice-s', 'Свистящий звук С', 'Сок', 'С', '🧃', '#66C28A', 'Попросите ребёнка произнести слово «Сок» коротко, но отчётливо.', 'Следите за ясным свистящим звуком «С» в начале слова.'),
        ('sun-sh', 'Шипящий звук Ш', 'Шар', 'Ш', '🎈', '#F07FA8', 'Повторите слово «Шар» в тихом темпе, чтобы звук был слышен отчётливо.', 'Во время упражнения можно слегка вытянуть губы, чтобы звук «Ш» получился чище.');
    `);
  }

  ensured = true;
}
