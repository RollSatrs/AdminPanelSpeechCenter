import "server-only";
import {
  AUTH_SESSION_DAYS,
  buildSessionExpiryDate,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth";

const defaultParentCookie = "parent_token";

export const PARENT_AUTH_COOKIE = process.env.PARENT_AUTH_COOKIE?.trim() || defaultParentCookie;
export const PARENT_AUTH_SESSION_DAYS = AUTH_SESSION_DAYS;

export {
  buildSessionExpiryDate,
  generateSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
};
