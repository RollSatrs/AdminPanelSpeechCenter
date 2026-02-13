import "server-only";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { adminSessionsTable, adminsTable } from "@/db/schema";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { ensureAuthTables } from "@/lib/auth-db";
import { db } from "@/lib/db";

export async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  await ensureAuthTables();

  const token = req.cookies.get(AUTH_COOKIE)?.value;
  if (!token) return false;

  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const session = await db
    .select({ adminId: adminSessionsTable.adminId })
    .from(adminSessionsTable)
    .innerJoin(adminsTable, eq(adminsTable.id, adminSessionsTable.adminId))
    .where(and(eq(adminSessionsTable.tokenHash, tokenHash), gt(adminSessionsTable.expiresAt, now)))
    .limit(1);

  return session.length > 0;
}
