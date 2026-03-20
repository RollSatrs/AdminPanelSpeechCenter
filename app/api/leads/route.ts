import { sql } from "drizzle-orm"
import { NextRequest, NextResponse } from "next/server"
import { isAuthorizedAdmin } from "@/lib/admin-auth"
import { db } from "@/lib/db"

type LandingLeadRow = {
  id: number
  fullname: string
  phone: string
  question: string
  created_at: Date | string
}

async function ensureLandingLeadsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "landing_leads" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "fullname" varchar(255) NOT NULL,
      "phone" varchar(32) NOT NULL,
      "question" text NOT NULL,
      "created_at" timestamp with time zone NOT NULL DEFAULT now()
    );
  `)
}

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await ensureLandingLeadsTable()

    const rows = await db.execute(sql`
      SELECT "id", "fullname", "phone", "question", "created_at"
      FROM "landing_leads"
      ORDER BY "created_at" DESC, "id" DESC;
    `)

    const items = (rows.rows as LandingLeadRow[]).map((row) => ({
      id: row.id,
      fullName: row.fullname,
      phone: row.phone,
      question: row.question,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    }))

    return NextResponse.json({
      summary: { total: items.length },
      items,
    })
  } catch (error) {
    console.error("leads route error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req)
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    await ensureLandingLeadsTable()

    const body = await req.json().catch(() => null)
    const ids = Array.isArray(body?.ids)
      ? body.ids
          .map((value: unknown) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      : []

    if (ids.length === 0) {
      return NextResponse.json({ message: "No ids provided" }, { status: 400 })
    }

    const idList = sql.join(ids.map((id: number) => sql`${id}`), sql`, `)

    await db.execute(sql`
      DELETE FROM "landing_leads"
      WHERE "id" IN (${idList});
    `)

    return NextResponse.json({ ok: true, deletedIds: ids })
  } catch (error) {
    console.error("leads delete error", error)
    return NextResponse.json({ message: "Internal error" }, { status: 500 })
  }
}
