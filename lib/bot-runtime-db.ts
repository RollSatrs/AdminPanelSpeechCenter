import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureBotRuntimeTable() {
  if (ensured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bot_runtime_state" (
      "id" integer PRIMARY KEY,
      "status" varchar(32) NOT NULL,
      "qr_data_url" text,
      "last_error" text,
      "heartbeat_at" timestamp with time zone,
      "control_action" varchar(32),
      "control_token" varchar(128),
      "control_requested_at" timestamp with time zone,
      "control_processed_at" timestamp with time zone,
      "control_result" text,
      "updated_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `);

  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_action" varchar(32);`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_token" varchar(128);`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_requested_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_processed_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_result" text;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "heartbeat_at" timestamp with time zone;`);

  await db.execute(sql`
    INSERT INTO "bot_runtime_state" ("id", "status")
    VALUES (1, 'stopped')
    ON CONFLICT ("id") DO NOTHING;
  `);

  ensured = true;
}
