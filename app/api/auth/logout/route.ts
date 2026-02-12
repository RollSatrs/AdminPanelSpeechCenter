import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { adminSessionsTable } from "@/db/schema";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { ensureAuthTables } from "@/lib/auth-db";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await ensureAuthTables();
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      await db
        .delete(adminSessionsTable)
        .where(eq(adminSessionsTable.tokenHash, hashSessionToken(token)));
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: AUTH_COOKIE,
      value: "",
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res;
  } catch (error) {
    console.error("logout error", error);
    return NextResponse.json({ message: "Ошибка выхода" }, { status: 500 });
  }
}
