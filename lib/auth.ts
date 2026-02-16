import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const defaultCookie = "admin_token";
const defaultSessionDays = 7;

function parseSessionDays(raw: string | undefined): number {
  if (!raw) return defaultSessionDays;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) return defaultSessionDays;
  return value;
}

export const AUTH_COOKIE = process.env.AUTH_COOKIE?.trim() || defaultCookie;
export const AUTH_SESSION_DAYS = parseSessionDays(process.env.AUTH_SESSION_DAYS);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildSessionExpiryDate(): Date {
  return new Date(Date.now() + AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000);
}
