import crypto from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

import { adminsTable, passwordResetTokens } from "@/db/schema";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ message: "Укажите email" }, { status: 400 });
    }

    const found = await db.select().from(adminsTable).where(eq(adminsTable.email, email)).limit(1);
    const admin = found[0];

    if (admin) {
      await db
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.adminId, admin.id),
            isNull(passwordResetTokens.usedAt)
          )
        );

      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const appUrl = process.env.APP_URL?.trim() || "http://localhost:3000";

      await db.insert(passwordResetTokens).values({
        adminId: admin.id,
        tokenHash,
        expiresAt,
      });

      await sendPasswordResetEmail(
        email,
        `${appUrl}/admin/reset-password?token=${rawToken}`
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Если такой email зарегистрирован, письмо для сброса пароля уже отправлено.",
    });
  } catch (error) {
    console.error("forgot password error", error);
    return NextResponse.json(
      { message: "Не удалось отправить письмо для сброса пароля." },
      { status: 500 }
    );
  }
}
