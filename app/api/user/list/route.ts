import { inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  childrenTable,
  leadsTable,
  parentsTable,
} from "@/db/schema";
import { isAuthorizedAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const authorized = await isAuthorizedAdmin(req);
    if (!authorized) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const leads = await db.select().from(leadsTable);
    if (leads.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const parentIds = Array.from(new Set(leads.map((l) => l.parentId)));
    const parents = await db
      .select()
      .from(parentsTable)
      .where(inArray(parentsTable.id, parentIds));
    const children = await db
      .select()
      .from(childrenTable)
      .where(inArray(childrenTable.parentId, parentIds));

    const statusByParent = new Map<number, "warm" | "hot">();
    for (const lead of leads) {
      const current = statusByParent.get(lead.parentId);
      if (lead.status === "hot" || current === undefined) {
        statusByParent.set(lead.parentId, lead.status);
      }
    }

    const parentMap = new Map(parents.map((p) => [p.id, p]));
    const childrenByParent = new Map<number, typeof children>();
    for (const child of children) {
      const list = childrenByParent.get(child.parentId) ?? [];
      list.push(child);
      childrenByParent.set(child.parentId, list);
    }

    const items = parentIds
      .map((parentId) => {
        const parent = parentMap.get(parentId);
        if (!parent) return null;

        const status = statusByParent.get(parentId) ?? "warm";
        const childrenList = childrenByParent.get(parentId) ?? [];

        return {
          parentId,
          parentFullName: parent.fullname,
          childrenCount: childrenList.length,
          createdAt: parent.createdAt,
          status,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        return new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime();
      });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("user/list error:", error);
    return NextResponse.json({ message: "Internal error" }, { status: 500 });
  }
}
