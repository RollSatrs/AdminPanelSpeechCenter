import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { adminSessionsTable, adminsTable } from "@/db/schema";
import { db } from "@/lib/db";
import {
  AUTH_COOKIE,
  buildSessionExpiryDate,
  generateSessionToken,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth";
import { ensureAuthTables } from "@/lib/auth-db";

export async function POST(req: Request) {
  try {
    await ensureAuthTables();

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ message: "Email и пароль обязательны" }, { status: 400 });
    }

    const found = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    const admin = found[0];
    if (!admin) {
      return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 });
    }

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = buildSessionExpiryDate();

    await db
      .update(adminsTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(adminsTable.id, admin.id));

    await db.insert(adminSessionsTable).values({
      adminId: admin.id,
      tokenHash,
      expiresAt,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: AUTH_COOKIE,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return res;
  } catch (error) {
    console.error("login error", error);
    return NextResponse.json({ message: "Ошибка входа" }, { status: 500 });
  }
}

export async function GET() {
  // optional quick check for client that probes /auth/login
  try {
    await ensureAuthTables();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
