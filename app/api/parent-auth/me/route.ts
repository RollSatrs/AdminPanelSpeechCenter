import { and, eq, gt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { childrenTable, parentAccountsTable, parentSessionsTable, parentsTable } from "@/db/schema";
import { db } from "@/lib/db";
import { PARENT_AUTH_COOKIE, hashSessionToken } from "@/lib/parent-auth";
import { ensureParentAuthTables } from "@/lib/parent-auth-db";

export async function GET(req: NextRequest) {
  try {
    await ensureParentAuthTables();

    const token = req.cookies.get(PARENT_AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tokenHash = hashSessionToken(token);
    const now = new Date();

    const rows = await db
      .select({
        accountId: parentAccountsTable.id,
        login: parentAccountsTable.login,
        parentId: parentsTable.id,
        fullName: parentsTable.fullname,
        phone: parentsTable.phone,
      })
      .from(parentSessionsTable)
      .innerJoin(parentAccountsTable, eq(parentAccountsTable.id, parentSessionsTable.parentAccountId))
      .innerJoin(parentsTable, eq(parentsTable.id, parentAccountsTable.parentId))
      .where(
        and(
          eq(parentSessionsTable.tokenHash, tokenHash),
          eq(parentAccountsTable.isActive, true),
          gt(parentSessionsTable.expiresAt, now)
        )
      )
      .limit(1);

    const parent = rows[0];
    if (!parent) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const children = await db
      .select({
        id: childrenTable.id,
        fullName: childrenTable.fullname,
        birthDate: childrenTable.birthDate,
        language: childrenTable.language,
      })
      .from(childrenTable)
      .where(eq(childrenTable.parentId, parent.parentId));

    return NextResponse.json({
      ok: true,
      parent: {
        id: parent.parentId,
        fullName: parent.fullName,
        phone: parent.phone,
        login: parent.login,
      },
      children: children.map((child) => ({
        id: child.id,
        fullName: child.fullName,
        birthDate: String(child.birthDate),
        language: child.language,
      })),
    });
  } catch (error) {
    console.error("parent me error", error);
    return NextResponse.json({ message: "Ошибка проверки сессии" }, { status: 500 });
  }
}
