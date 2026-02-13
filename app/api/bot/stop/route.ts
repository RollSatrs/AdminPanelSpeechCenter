import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { ensureBotRuntimeTable } from "@/lib/bot-runtime-db";
import { stopBotProcess } from "@/lib/bot-process";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    await stopBotProcess();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Не удалось остановить процесс бота";
    return NextResponse.json({ message }, { status: 503 });
  }

  await ensureBotRuntimeTable();

  await db.execute(sql`
    UPDATE "bot_runtime_state"
    SET
      "status" = 'stopped',
      "qr_data_url" = null,
      "last_error" = null,
      "updated_at" = now()
    WHERE "id" = 1;
  `);

  return NextResponse.json({ ok: true });
}
