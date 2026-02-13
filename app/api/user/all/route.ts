import { and, eq, gte, sql } from "drizzle-orm";
import { leadsTable, parentsTable } from "@/db/schema";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
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
