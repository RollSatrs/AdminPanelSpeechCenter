import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

let ensured = false;

export async function ensureAuthTables() {
  if (ensured) return;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admins" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "email" varchar(255) NOT NULL UNIQUE,
      "password_hash" varchar(255) NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "admin_sessions" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "admin_id" integer NOT NULL REFERENCES "admins"("id") ON DELETE cascade,
      "token_hash" varchar(255) NOT NULL UNIQUE,
      "expires_at" timestamp with time zone NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
  `);

  ensured = true;
}
