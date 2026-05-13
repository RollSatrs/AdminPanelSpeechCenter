import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { parentAccountsTable, parentSessionsTable } from "@/db/schema";
import { PARENT_AUTH_COOKIE, hashSessionToken } from "@/lib/parent-auth";
import { ensureParentAuthTables } from "@/lib/parent-auth-db";
import { db } from "@/lib/db";

export async function isAuthorizedParent(req: NextRequest): Promise<boolean> {
  await ensureParentAuthTables();

  const token = req.cookies.get(PARENT_AUTH_COOKIE)?.value;
  if (!token) return false;

  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const session = await db
    .select({ parentAccountId: parentSessionsTable.parentAccountId })
    .from(parentSessionsTable)
    .innerJoin(parentAccountsTable, eq(parentAccountsTable.id, parentSessionsTable.parentAccountId))
    .where(
      and(
        eq(parentSessionsTable.tokenHash, tokenHash),
        eq(parentAccountsTable.isActive, true),
        gt(parentSessionsTable.expiresAt, now)
      )
    )
    .limit(1);

  return session.length > 0;
}
