import "server-only";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export const AUTH_COOKIE = "admin_token";
export const AUTH_SESSION_DAYS = 7;

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
