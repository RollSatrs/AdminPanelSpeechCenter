import Link from "next/link";
import { and, desc, eq, gt, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  adminSessionsTable,
  adminsTable,
  childrenTable,
  leadsTable,
  parentsTable,
  sessionAnswerTable,
  testResultRulesTable,
  testSessionTable,
  testsTable,
} from "@/db/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AUTH_COOKIE, hashSessionToken } from "@/lib/auth";
import { db } from "@/lib/db";

function formatDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("ru-RU");
}

function formatDateTime(value: string | Date | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU");
}

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

type ParentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ParentPage({ params }: ParentPageProps) {
  const { id } = await params;
  const parentId = Number(id);
  if (!Number.isInteger(parentId) || parentId <= 0) {
    notFound();
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }

  const tokenHash = hashSessionToken(token);
  const now = new Date();
  const session = await db
    .select({
      adminId: adminSessionsTable.adminId,
      adminEmail: adminsTable.email,
    })
    .from(adminSessionsTable)
    .innerJoin(adminsTable, eq(adminsTable.id, adminSessionsTable.adminId))
    .where(and(eq(adminSessionsTable.tokenHash, tokenHash), gt(adminSessionsTable.expiresAt, now)))
    .limit(1);

  if (session.length === 0) {
    redirect("/login");
  }

  const parents = await db
    .select()
    .from(parentsTable)
    .where(eq(parentsTable.id, parentId))
    .limit(1);
  const parent = parents[0];
  if (!parent) {
    notFound();
  }

  const leads = await db.select().from(leadsTable).where(eq(leadsTable.parentId, parentId));
  const status = leads.some((lead) => lead.status === "hot") ? "hot" : "warm";

  const children = await db
    .select()
    .from(childrenTable)
    .where(eq(childrenTable.parentId, parentId));
  const childNameById = new Map<number, string>();
  for (const child of children) {
    childNameById.set(child.id, child.fullname);
  }

  const testSessions = await db
    .select()
    .from(testSessionTable)
    .where(eq(testSessionTable.parentId, parentId))
    .orderBy(desc(testSessionTable.createdAt), desc(testSessionTable.id));

  const testIds = Array.from(new Set(testSessions.map((s) => s.testId)));
  const sessionIds = testSessions.map((s) => s.id);
  const testMap = new Map<number, { name: string }>();
  if (testIds.length > 0) {
    const tests = await db.select().from(testsTable).where(inArray(testsTable.id, testIds));
    for (const test of tests) {
      testMap.set(test.id, { name: test.name });
    }
  }

  const rulesByTest = new Map<number, Array<{ minScore: number; maxScore: number; label: string }>>();
  if (testIds.length > 0) {
    const rules = await db
      .select()
      .from(testResultRulesTable)
      .where(inArray(testResultRulesTable.testId, testIds));
    for (const rule of rules) {
      const list = rulesByTest.get(rule.testId) ?? [];
      list.push({ minScore: rule.minScore, maxScore: rule.maxScore, label: rule.label });
      rulesByTest.set(rule.testId, list);
    }
  }

  const answersCountBySession = new Map<number, number>();
  if (sessionIds.length > 0) {
    const answers = await db
      .select({ sessionId: sessionAnswerTable.sessonId })
      .from(sessionAnswerTable)
      .where(inArray(sessionAnswerTable.sessonId, sessionIds));
    for (const answer of answers) {
      const count = answersCountBySession.get(answer.sessionId) ?? 0;
      answersCountBySession.set(answer.sessionId, count + 1);
    }
  }

  const testHistory = testSessions.map((session) => {
    const rules = rulesByTest.get(session.testId) ?? [];
    const matchedRule = rules.find((rule) => session.score >= rule.minScore && session.score <= rule.maxScore);
    return {
      id: session.id,
      childFullName: session.childrenId ? childNameById.get(session.childrenId) ?? "—" : "—",
      testName: testMap.get(session.testId)?.name ?? `Тест #${session.testId}`,
      status: session.status,
      score: session.score,
      result: session.status === "complete" ? matchedRule?.label ?? "Без категории" : "—",
      answersCount: answersCountBySession.get(session.id) ?? 0,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    };
  });

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        admin={{
          email: session[0]?.adminEmail ?? "admin@speechcenter.local",
          name: "Admin",
        }}
        variant="inset"
      />
      <SidebarInset>
        <SiteHeader />
        <main className="mx-auto w-full max-w-6xl space-y-4 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Карточка родителя</h1>
            <Button asChild variant="outline">
              <Link href="/">Назад</Link>
            </Button>
          </div>

          <div className="grid gap-2 rounded-lg border p-4 text-sm md:grid-cols-3">
            <div>
              <span className="text-muted-foreground">ФИО родителя</span>
              <div className="font-medium">{parent.fullname}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Номер телефона</span>
              <div className="font-medium">{parent.phone}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Статус</span>
              <div className="pt-1">
                <Badge variant="outline">{status === "hot" ? "Горячий" : "Тёплый"}</Badge>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>ФИО ребёнка</TableHead>
                  <TableHead>Дата рождения</TableHead>
                  <TableHead>Язык</TableHead>
                  <TableHead>Возраст</TableHead>
                  <TableHead>Профиль создан</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {children.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground text-center">
                      У этого родителя пока нет детей в системе.
                    </TableCell>
                  </TableRow>
                ) : (
                  children.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell>{child.fullname}</TableCell>
                      <TableCell>{formatDate(child.birthDate)}</TableCell>
                      <TableCell>{languageLabel(child.language)}</TableCell>
                      <TableCell>{calculateAge(String(child.birthDate)) ?? "—"}</TableCell>
                      <TableCell>{formatDate(child.createdAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead>Ребёнок</TableHead>
                  <TableHead>Тест</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Результат</TableHead>
                  <TableHead>Баллы</TableHead>
                  <TableHead>Ответов</TableHead>
                  <TableHead>Старт</TableHead>
                  <TableHead>Завершён</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground text-center">
                      У этого родителя пока нет пройденных тестов.
                    </TableCell>
                  </TableRow>
                ) : (
                  testHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.childFullName}</TableCell>
                      <TableCell>{row.testName}</TableCell>
                      <TableCell>{row.status === "complete" ? "Пройден" : "Не завершён"}</TableCell>
                      <TableCell>{row.result}</TableCell>
                      <TableCell>{row.score}</TableCell>
                      <TableCell>{row.answersCount}</TableCell>
                      <TableCell>{formatDateTime(row.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(row.completedAt)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
