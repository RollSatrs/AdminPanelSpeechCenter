import { sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { getBotProcessStatus } from "@/lib/bot-process";
import { ensureBotRuntimeTable } from "@/lib/bot-runtime-db";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  await ensureBotRuntimeTable();
  const processStatus = await getBotProcessStatus();

  const rows = await db.execute(sql`
    SELECT
      "status",
      "qr_data_url",
      "last_error",
      "heartbeat_at",
      "updated_at"
    FROM "bot_runtime_state"
    WHERE "id" = 1
    LIMIT 1;
  `);

  const row = rows.rows[0] as
    | {
        status: string;
        qr_data_url: string | null;
        last_error: string | null;
        heartbeat_at: string | Date | null;
        updated_at: string | Date;
      }
    | undefined;

  const heartbeatAt = row?.heartbeat_at ? new Date(row.heartbeat_at) : null;
  const now = Date.now();
  const heartbeatMs = heartbeatAt?.getTime() ?? 0;
  const isOffline = !heartbeatMs || now - heartbeatMs > 12_000;
  const resolvedStatus = isOffline ? "offline" : row?.status ?? "stopped";

  return NextResponse.json(
    {
      status: resolvedStatus,
      qrDataUrl: row?.qr_data_url ?? null,
      lastError: row?.last_error ?? null,
      heartbeatAt: row?.heartbeat_at ?? null,
      updatedAt: row?.updated_at ?? null,
      process: processStatus,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
