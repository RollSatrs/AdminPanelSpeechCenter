import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { parentAccountsTable, parentSessionsTable, parentsTable } from "@/db/schema";
import { db } from "@/lib/db";
import { PARENT_AUTH_COOKIE, hashSessionToken } from "@/lib/parent-auth";
import { ensureParentAuthTables } from "@/lib/parent-auth-db";

export async function getCurrentParentSession(req: NextRequest) {
  await ensureParentAuthTables();

  const token = req.cookies.get(PARENT_AUTH_COOKIE)?.value;
  if (!token) {
    return null;
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date();

  const rows = await db
    .select({
      parentId: parentsTable.id,
      fullName: parentsTable.fullname,
      phone: parentsTable.phone,
      accountId: parentAccountsTable.id,
      login: parentAccountsTable.login,
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

  return rows[0] ?? null;
}
