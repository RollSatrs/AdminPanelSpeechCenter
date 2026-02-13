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

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_BLOCK_MS = 15 * 60 * 1000;

type RateLimitState = {
  startedAt: number;
  attempts: number;
  blockedUntil: number;
};

const attemptsStore = new Map<string, RateLimitState>();

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function isBlocked(key: string, now: number): number {
  const state = attemptsStore.get(key);
  if (!state) return 0;

  if (state.blockedUntil > now) {
    return Math.ceil((state.blockedUntil - now) / 1000);
  }
  if (now - state.startedAt > RATE_LIMIT_WINDOW_MS) {
    attemptsStore.delete(key);
  }
  return 0;
}

function registerFailure(key: string, now: number) {
  const state = attemptsStore.get(key);
  if (!state || now - state.startedAt > RATE_LIMIT_WINDOW_MS) {
    attemptsStore.set(key, {
      startedAt: now,
      attempts: 1,
      blockedUntil: 0,
    });
    return;
  }

  state.attempts += 1;
  if (state.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
    state.blockedUntil = now + RATE_LIMIT_BLOCK_MS;
  }
}

function clearFailures(key: string) {
  attemptsStore.delete(key);
}

export async function POST(req: Request) {
  try {
    await ensureAuthTables();

    const body = await req.json();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const ip = getIp(req);
    const nowMs = Date.now();
    const emailKey = `email:${email}|ip:${ip}`;
    const ipKey = `ip:${ip}`;

    if (!email || !password) {
      return NextResponse.json({ message: "Email и пароль обязательны" }, { status: 400 });
    }

    const emailRetryAfter = isBlocked(emailKey, nowMs);
    const ipRetryAfter = isBlocked(ipKey, nowMs);
    const retryAfter = Math.max(emailRetryAfter, ipRetryAfter);
    if (retryAfter > 0) {
      return NextResponse.json(
        { message: "Слишком много попыток. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const found = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    const admin = found[0];
    if (!admin) {
      registerFailure(emailKey, nowMs);
      registerFailure(ipKey, nowMs);
      return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, admin.passwordHash);
    if (!isValid) {
      registerFailure(emailKey, nowMs);
      registerFailure(ipKey, nowMs);
      return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 });
    }
    clearFailures(emailKey);
    clearFailures(ipKey);

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
