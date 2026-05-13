import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { parentSessionsTable } from "@/db/schema";
import { PARENT_AUTH_COOKIE, hashSessionToken } from "@/lib/parent-auth";
import { ensureParentAuthTables } from "@/lib/parent-auth-db";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await ensureParentAuthTables();

    const token = req.cookies.get(PARENT_AUTH_COOKIE)?.value;
    if (token) {
      await db
        .delete(parentSessionsTable)
        .where(eq(parentSessionsTable.tokenHash, hashSessionToken(token)));
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: PARENT_AUTH_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("parent logout error", error);
    return NextResponse.json({ message: "Ошибка выхода" }, { status: 500 });
  }
}
