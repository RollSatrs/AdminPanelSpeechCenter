import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { parentAccountsTable, parentSessionsTable } from "@/db/schema";
import { db } from "@/lib/db";
import {
  PARENT_AUTH_COOKIE,
  buildSessionExpiryDate,
  generateSessionToken,
  hashSessionToken,
  verifyPassword,
} from "@/lib/parent-auth";
import { ensureParentAuthTables } from "@/lib/parent-auth-db";

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
    await ensureParentAuthTables();

    const body = await req.json().catch(() => null);
    const login = String(body?.login ?? "").trim().toLowerCase();
    const password = String(body?.password ?? "");
    const ip = getIp(req);
    const nowMs = Date.now();
    const loginKey = `parent-login:${login}|ip:${ip}`;
    const ipKey = `parent-ip:${ip}`;

    if (!login || !password) {
      return NextResponse.json({ message: "Логин и пароль обязательны" }, { status: 400 });
    }

    const loginRetryAfter = isBlocked(loginKey, nowMs);
    const ipRetryAfter = isBlocked(ipKey, nowMs);
    const retryAfter = Math.max(loginRetryAfter, ipRetryAfter);
    if (retryAfter > 0) {
      return NextResponse.json(
        { message: "Слишком много попыток. Повторите позже." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const found = await db
      .select()
      .from(parentAccountsTable)
      .where(and(eq(parentAccountsTable.login, login), eq(parentAccountsTable.isActive, true)))
      .limit(1);

    const parentAccount = found[0];
    if (!parentAccount) {
      registerFailure(loginKey, nowMs);
      registerFailure(ipKey, nowMs);
      return NextResponse.json({ message: "Неверный логин или пароль" }, { status: 401 });
    }

    const isValid = await verifyPassword(password, parentAccount.passwordHash);
    if (!isValid) {
      registerFailure(loginKey, nowMs);
      registerFailure(ipKey, nowMs);
      return NextResponse.json({ message: "Неверный логин или пароль" }, { status: 401 });
    }

    clearFailures(loginKey);
    clearFailures(ipKey);

    const rawToken = generateSessionToken();
    const tokenHash = hashSessionToken(rawToken);
    const expiresAt = buildSessionExpiryDate();

    await db
      .update(parentAccountsTable)
      .set({ lastLoginAt: new Date() })
      .where(eq(parentAccountsTable.id, parentAccount.id));

    await db.insert(parentSessionsTable).values({
      parentAccountId: parentAccount.id,
      tokenHash,
      expiresAt,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set({
      name: PARENT_AUTH_COOKIE,
      value: rawToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });

    return res;
  } catch (error) {
    console.error("parent login error", error);
    return NextResponse.json({ message: "Ошибка входа" }, { status: 500 });
  }
}
