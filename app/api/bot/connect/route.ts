import crypto from "crypto";
import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { ensureBotProcessOnline } from "@/lib/bot-process";
import { ensureBotRuntimeTable } from "@/lib/bot-runtime-db";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureBotProcessOnline();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не удалось запустить процесс бота";
    return NextResponse.json({ message }, { status: 503 });
  }

  await ensureBotRuntimeTable();

  const token = crypto.randomUUID();
  await db.execute(sql`
    UPDATE "bot_runtime_state"
    SET
      "control_action" = 'connect',
      "control_token" = ${token},
      "control_requested_at" = now(),
      "control_processed_at" = null,
      "control_result" = null
    WHERE "id" = 1;
  `);

  return NextResponse.json({ ok: true, token });
}
