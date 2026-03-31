import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureBotRuntimeTable() {
  if (ensured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "bot_runtime_state" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
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

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'bot_runtime_state'
          AND column_name = 'id'
          AND is_identity = 'NO'
      ) THEN
        IF pg_get_serial_sequence('bot_runtime_state', 'id') IS NULL THEN
          CREATE SEQUENCE IF NOT EXISTS bot_runtime_state_id_seq;
          EXECUTE 'ALTER SEQUENCE bot_runtime_state_id_seq OWNED BY "bot_runtime_state"."id"';
          EXECUTE 'ALTER TABLE "bot_runtime_state" ALTER COLUMN "id" SET DEFAULT nextval(''bot_runtime_state_id_seq'')';
          EXECUTE 'SELECT setval(''bot_runtime_state_id_seq'', COALESCE((SELECT MAX(id) FROM "bot_runtime_state"), 1), true)';
        END IF;
      END IF;
    END $$;
  `);

  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_action" varchar(32);`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_token" varchar(128);`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_requested_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_processed_at" timestamp with time zone;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "control_result" text;`);
  await db.execute(sql`ALTER TABLE "bot_runtime_state" ADD COLUMN IF NOT EXISTS "heartbeat_at" timestamp with time zone;`);

  await db.execute(sql`
    INSERT INTO "bot_runtime_state" ("status")
    SELECT 'stopped'
    WHERE NOT EXISTS (
      SELECT 1
      FROM "bot_runtime_state"
    );
  `);

  ensured = true;
}
