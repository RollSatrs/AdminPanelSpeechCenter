import { and, eq, gt, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  adminSessionsTable,
  adminsTable,
  childrenTable,
  leadsTable,
  parentsTable,
} from "@/db/schema";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

function calculateAge(birthDate: string): number | null {
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  const beforeBirthday =
    now.getMonth() < date.getMonth() ||
    (now.getMonth() === date.getMonth() && now.getDate() < date.getDate());
  if (beforeBirthday) age--;
  return age >= 0 ? age : null;
}

function languageLabel(lang: "ru" | "kz" | "both"): string {
  if (lang === "ru") return "Русский";
  if (lang === "kz") return "Казахский";
  return "Два языка";
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const tokenHash = hashSessionToken(token);
    const now = new Date();

    const session = await db
      .select({ adminId: adminSessionsTable.adminId })
      .from(adminSessionsTable)
      .innerJoin(adminsTable, eq(adminsTable.id, adminSessionsTable.adminId))
      .where(
        and(
          eq(adminSessionsTable.tokenHash, tokenHash),
          gt(adminSessionsTable.expiresAt, now)
        )
      )
      .limit(1);

    if (session.length === 0) {
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

        const parentLeads = leads.filter((l) => l.parentId === parentId);
        const status = parentLeads.some((l) => l.status === "hot") ? "hot" : "warm";
        const childrenList = (childrenByParent.get(parentId) ?? []).map((child) => ({
          id: child.id,
          fullName: child.fullname,
          birthDate: child.birthDate,
          language: languageLabel(child.language),
          age: calculateAge(String(child.birthDate)),
        }));

        return {
          parentId,
          parentFullName: parent.fullname,
          childrenCount: childrenList.length,
          createdAt: parent.createdAt,
          status,
          children: childrenList,
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
