import { and, eq, gt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionsTable,
  adminsTable,
  childrenTable,
  parentsTable,
} from "@/db/schema";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

type DailyCountRow = {
  date: string;
  count: number;
};

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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

    const parentRows = await db
      .select({
        date: sql<string>`date_trunc('day', ${parentsTable.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(parentsTable)
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    const childRows = await db
      .select({
        date: sql<string>`date_trunc('day', ${childrenTable.createdAt})::date::text`,
        count: sql<number>`count(*)::int`,
      })
      .from(childrenTable)
      .groupBy(sql`1`)
      .orderBy(sql`1`);

    const parentByDate = new Map<string, number>(
      (parentRows as DailyCountRow[]).map((r) => [r.date, Number(r.count ?? 0)])
    );
    const childByDate = new Map<string, number>(
      (childRows as DailyCountRow[]).map((r) => [r.date, Number(r.count ?? 0)])
    );

    const allDates = new Set<string>([
      ...Array.from(parentByDate.keys()),
      ...Array.from(childByDate.keys()),
    ]);

    const timeline = Array.from(allDates)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .map((date) => ({
        date,
        parents: parentByDate.get(date) ?? 0,
        children: childByDate.get(date) ?? 0,
      }));

    const totals = timeline.reduce(
      (acc, item) => {
        acc.parents += item.parents;
        acc.children += item.children;
        return acc;
      },
      { parents: 0, children: 0 }
    );

    return NextResponse.json({
      totalParents: totals.parents,
      totalChildren: totals.children,
      timeline,
    });
  } catch (error) {
    console.error("user/timeline error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
