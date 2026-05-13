import "server-only"

import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { buildPhoneCandidates } from "@/lib/phone"

type ParentLookupRow = {
  id: number
  fullname: string
  phone: string
  createdAt: Date | string
}

export async function ensureDiagnosticLeadsTable() {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "diagnostic_lead_status" AS ENUM ('pending', 'issued');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "diagnostic_leads" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "parent_id" integer NOT NULL REFERENCES "parents"("id") ON DELETE cascade,
      "child_id" integer REFERENCES "children"("id") ON DELETE set null,
      "status" "diagnostic_lead_status" NOT NULL DEFAULT 'pending',
      "access_login" varchar(255),
      "access_password" varchar(255),
      "access_issued_at" timestamp with time zone,
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `)

  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "child_id" integer REFERENCES "children"("id") ON DELETE set null;`)
  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "status" "diagnostic_lead_status" NOT NULL DEFAULT 'pending';`)
  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "access_login" varchar(255);`)
  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "access_password" varchar(255);`)
  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "access_issued_at" timestamp with time zone;`)
  await db.execute(sql`ALTER TABLE "diagnostic_leads" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone NOT NULL DEFAULT now();`)
}

export async function findBestParentByPhone(phoneInput: string): Promise<ParentLookupRow | null> {
  const candidates = buildPhoneCandidates(phoneInput)
  if (candidates.length === 0) return null

  const phoneList = sql.join(candidates.map((value) => sql`${value}`), sql`, `)
  const normalizedPhone = candidates.find((value) => /^8\d{10}$/.test(value)) ?? candidates[0]

  const rows = await db.execute(sql`
    SELECT
      p."id",
      p."fullname",
      p."phone",
      p."created_at" AS "createdAt"
    FROM "parents" p
    WHERE regexp_replace(p."phone", '[^0-9]', '', 'g') IN (${phoneList})
    ORDER BY
      (
        SELECT COUNT(*)
        FROM "children" c
        WHERE c."parent_id" = p."id"
      ) DESC,
      (
        SELECT MAX(us."last_seen_at")
        FROM "user_sessions" us
        WHERE us."parent_id" = p."id"
      ) DESC NULLS LAST,
      CASE
        WHEN regexp_replace(p."phone", '[^0-9]', '', 'g') = ${normalizedPhone} THEN 1
        ELSE 0
      END DESC,
      p."created_at" DESC,
      p."id" DESC
    LIMIT 1;
  `)

  return (rows.rows[0] as ParentLookupRow | undefined) ?? null
}
