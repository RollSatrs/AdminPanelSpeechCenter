import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { adminSessionsTable, adminsTable, passwordResetTokens } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const token = String(body?.token ?? "").trim();
    const password = String(body?.password ?? "");

    if (!token || !password) {
      return NextResponse.json({ message: "Недостаточно данных" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Пароль должен содержать не менее 8 символов." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const found = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    const resetToken = found[0];
    if (!resetToken) {
      return NextResponse.json(
        { message: "Ссылка недействительна или уже устарела." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await db
      .update(adminsTable)
      .set({ passwordHash })
      .where(eq(adminsTable.id, resetToken.adminId));

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetToken.id));

    await db
      .delete(adminSessionsTable)
      .where(eq(adminSessionsTable.adminId, resetToken.adminId));

    return NextResponse.json({ ok: true, message: "Пароль успешно обновлён." });
  } catch (error) {
    console.error("reset password error", error);
    return NextResponse.json(
      { message: "Не удалось обновить пароль." },
      { status: 500 }
    );
  }
}
