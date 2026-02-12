import { and, eq, gt, gte, sql } from "drizzle-orm";
import { adminSessionsTable, adminsTable, leadsTable, parentsTable } from "@/db/schema";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // проверка, что cookie соответствует живой сессии
    const tokenHash = hashSessionToken(token);
    const now = new Date();

    const session = await db
      .select({ adminId: adminSessionsTable.adminId })
      .from(adminSessionsTable)
      .innerJoin(adminsTable, eq(adminsTable.id, adminSessionsTable.adminId))
      .where(
        and(
          eq(adminSessionsTable.tokenHash, tokenHash),
          gt(adminSessionsTable.expiresAt, now)
        )
      )
      .limit(1);

    if (session.length === 0) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsersRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parentsTable);

    const [newUsers30dRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(parentsTable)
      .where(gte(parentsTable.createdAt, thirtyDaysAgo));

    const [hotLeadsRow] = await db
      .select({ count: sql<number>`count(distinct ${leadsTable.parentId})` })
      .from(leadsTable)
      .where(eq(leadsTable.status, "hot"));

    const [warmLeadsRow] = await db
      .select({
        count: sql<number>`count(distinct ${leadsTable.parentId})`,
      })
      .from(leadsTable)
      .where(
        and(
          eq(leadsTable.status, "warm"),
          sql`${leadsTable.parentId} not in (
            select distinct ${leadsTable.parentId}
            from ${leadsTable}
            where ${leadsTable.status} = 'hot'
          )`
        )
      );

    return NextResponse.json({
      totalUsers: Number(totalUsersRow?.count ?? 0),
      newUsers30d: Number(newUsers30dRow?.count ?? 0),
      warmLeads: Number(warmLeadsRow?.count ?? 0),
      hotLeads: Number(hotLeadsRow?.count ?? 0),
    });
  } catch (e) {
    console.error("users/all error:", e);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
