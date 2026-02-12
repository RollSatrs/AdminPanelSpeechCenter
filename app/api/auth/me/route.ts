import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { adminSessionsTable, adminsTable } from "@/db/schema";
import { db } from "@/lib/db";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { ensureAuthTables } from "@/lib/auth-db";

export async function GET(req: NextRequest) {
  try {
    await ensureAuthTables();

    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tokenHash = hashSessionToken(token);
    const now = new Date();

    const rows = await db
      .select({
        id: adminsTable.id,
        email: adminsTable.email,
      })
      .from(adminSessionsTable)
      .innerJoin(adminsTable, eq(adminsTable.id, adminSessionsTable.adminId))
      .where(and(eq(adminSessionsTable.tokenHash, tokenHash), gt(adminSessionsTable.expiresAt, now)))
      .limit(1);

    if (rows.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, admin: rows[0] });
  } catch (error) {
    console.error("me error", error);
    return NextResponse.json({ message: "Ошибка проверки сессии" }, { status: 500 });
  }
}
