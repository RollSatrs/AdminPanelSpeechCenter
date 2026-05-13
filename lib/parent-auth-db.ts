import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureParentAuthTables() {
  if (ensured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "parent_accounts" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "parent_id" integer NOT NULL UNIQUE REFERENCES "parents"("id") ON DELETE cascade,
      "login" varchar(255) NOT NULL UNIQUE,
      "password_hash" varchar(255) NOT NULL,
      "is_active" boolean NOT NULL DEFAULT true,
      "last_login_at" timestamp with time zone,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "parent_sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "parent_account_id" integer NOT NULL REFERENCES "parent_accounts"("id") ON DELETE cascade,
      "token_hash" varchar(255) NOT NULL UNIQUE,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;`);
  await db.execute(sql`ALTER TABLE "parent_accounts" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp with time zone;`);

  ensured = true;
}
