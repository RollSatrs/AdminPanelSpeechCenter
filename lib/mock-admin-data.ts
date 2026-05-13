type LeadStatus = "warm" | "hot"
type SessionStatus = "registered" | "testing" | "done"
type TestStatus = "incomplete" | "complete"
type ChildLanguage = "ru" | "kz" | "both"

type MockParent = {
  id: number
  fullname: string
  phone: string
  createdAt: string
}

type MockChild = {
  id: number
  parentId: number
  fullname: string
  birthDate: string
  language: ChildLanguage
  createdAt: string
}

type MockLead = {
  id: number
  parentId: number
  childrenId: number | null
  createdAt: string
  status: LeadStatus
}

type MockUserSession = {
  id: number
  parentId: number
  childrenId: number | null
  status: SessionStatus
  step: string
  uiLanguage: "ru" | "kz"
  startedAt: string
  lastSeenAt: string
}

type MockTest = {
  id: number
  name: string
  ageFrom: number
  ageTo: number
}

type MockTestRule = {
  testId: number
  minScore: number
  maxScore: number
  label: string
}

type MockTestSession = {
  id: number
  testId: number
  parentId: number
  childrenId: number
  createdAt: string
  completedAt: string | null
  status: TestStatus
  score: number
  answersCount: number
}

type MockLandingLead = {
  id: number
  fullName: string
  phone: string
  question: string
  createdAt: string
}

const mockNow = new Date()
const currentYear = mockNow.getFullYear()
const previousYear = currentYear - 1

function atDate(year: number, month: number, day: number, hour = 10, minute = 0) {
  return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString()
}

function daysAgo(days: number, hour = 10, minute = 0) {
  const value = new Date(mockNow)
  value.setHours(hour, minute, 0, 0)
  value.setDate(value.getDate() - days)
  return value.toISOString()
}

function dateKey(value: string) {
  return value.slice(0, 10)
}

function monthShortRu(date: Date): string {
  return date.toLocaleDateString("ru-RU", { month: "short" })
}

function dayLabel(date: Date): string {
  return String(date.getDate()).padStart(2, "0")
}

function parseYear(raw: number | undefined, fallback: number): number {
  if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 2000 || raw > 2100) {
    return fallback
  }
  return raw
}

function parseMonth(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback
  if (!/^\d{4}-\d{2}$/.test(raw)) return fallback
  const [year, month] = raw.split("-").map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return fallback
  }
  return raw
}

function buildMonthBuckets(year: number) {
  return Array.from({ length: 12 }, (_, index) => new Date(year, index, 1))
}

function startEndOfYear(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year + 1, 0, 1)
  return { start, end }
}

function startEndOfMonth(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

function previousMonth(monthValue: string): string {
  const { start } = startEndOfMonth(monthValue)
  const prev = new Date(start.getFullYear(), start.getMonth() - 1, 1)
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
}

function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function resultColor(label: string) {
  if (label === "Возрастная норма") return "#22c55e"
  if (label === "Норма") return "#14b8a6"
  if (label === "Нужно наблюдение") return "#f59e0b"
  if (label === "Зона риска") return "#f97316"
  if (label === "Высокий риск ЗРР") return "#ef4444"
  return "var(--chart-4)"
}

export function isMockAdminModeEnabled() {
  return process.env.NODE_ENV !== "production" && !process.env.DATABASE_URL
}

export function getMockAdmin() {
  return {
    id: 0,
    email: "demo@speechcenter.local",
    name: "Demo Admin",
  }
}

export function stepLabel(step: string): string {
  const labels: Record<string, string> = {
    idle: "Старт",
    chooseUiLanguage: "Выбор языка",
    parentPhone: "Телефон родителя",
    parentFullName: "ФИО родителя",
    confirmParentFullName: "Подтверждение ФИО",
    childFullName: "ФИО ребёнка",
    childLanguage: "Язык ребёнка",
    childAge: "Возраст ребёнка",
    confirmData: "Подтверждение данных",
    mainMenu: "Главное меню",
    chooseChild: "Выбор ребёнка",
    testQuestion: "Прохождение теста",
  }
  return labels[step] ?? step
}

export const mockTests: MockTest[] = [
  { id: 1, name: "Экспресс-скрининг речи 3-5 лет", ageFrom: 3, ageTo: 5 },
  { id: 2, name: "Диагностика готовности к школе", ageFrom: 5, ageTo: 7 },
]

export const mockTestRules: MockTestRule[] = [
  { testId: 1, minScore: 0, maxScore: 24, label: "Высокий риск ЗРР" },
  { testId: 1, minScore: 25, maxScore: 34, label: "Нужно наблюдение" },
  { testId: 1, minScore: 35, maxScore: 50, label: "Возрастная норма" },
  { testId: 2, minScore: 0, maxScore: 24, label: "Высокий риск ЗРР" },
  { testId: 2, minScore: 25, maxScore: 34, label: "Нужно наблюдение" },
  { testId: 2, minScore: 35, maxScore: 50, label: "Возрастная норма" },
]

export const mockParents: MockParent[] = [
  { id: 1, fullname: "Алия Серикова", phone: "+7 701 111 01 01", createdAt: atDate(previousYear, 8, 14, 11, 20) },
  { id: 2, fullname: "Тимур Абдрахманов", phone: "+7 701 111 01 02", createdAt: atDate(previousYear, 9, 5, 15, 10) },
  { id: 3, fullname: "Динара Касымова", phone: "+7 701 111 01 03", createdAt: atDate(previousYear, 10, 21, 9, 45) },
  { id: 4, fullname: "Руслан Ибрагимов", phone: "+7 701 111 01 04", createdAt: atDate(previousYear, 12, 11, 13, 5) },
  { id: 5, fullname: "Жанна Тулегенова", phone: "+7 701 111 01 05", createdAt: atDate(currentYear, 1, 18, 10, 15) },
  { id: 6, fullname: "Ермек Садыков", phone: "+7 701 111 01 06", createdAt: atDate(currentYear, 2, 9, 16, 25) },
  { id: 7, fullname: "Айнур Бекенова", phone: "+7 701 111 01 07", createdAt: atDate(currentYear, 3, 18, 11, 5) },
  { id: 8, fullname: "Виктория Нургалиева", phone: "+7 701 111 01 08", createdAt: atDate(currentYear, 3, 24, 14, 40) },
  { id: 9, fullname: "Марат Оспанов", phone: "+7 701 111 01 09", createdAt: atDate(currentYear, 4, 7, 9, 25) },
  { id: 10, fullname: "Салтанат Жумабекова", phone: "+7 701 111 01 10", createdAt: atDate(currentYear, 4, 13, 18, 10) },
]

export const mockChildren: MockChild[] = [
  { id: 101, parentId: 1, fullname: "Марк Сериков", birthDate: "2021-03-14", language: "ru", createdAt: atDate(previousYear, 8, 15, 12, 10) },
  { id: 102, parentId: 2, fullname: "Амина Абдрахманова", birthDate: "2020-06-22", language: "both", createdAt: atDate(previousYear, 9, 6, 10, 0) },
  { id: 103, parentId: 2, fullname: "Дамир Абдрахманов", birthDate: "2022-01-10", language: "kz", createdAt: atDate(previousYear, 9, 7, 11, 20) },
  { id: 104, parentId: 3, fullname: "София Касымова", birthDate: "2019-11-03", language: "ru", createdAt: atDate(previousYear, 10, 22, 10, 35) },
  { id: 105, parentId: 4, fullname: "Арсен Ибрагимов", birthDate: "2021-07-18", language: "kz", createdAt: atDate(previousYear, 12, 12, 9, 40) },
  { id: 106, parentId: 5, fullname: "Мирослава Тулегенова", birthDate: "2019-09-27", language: "ru", createdAt: atDate(currentYear, 1, 19, 14, 10) },
  { id: 107, parentId: 5, fullname: "Айару Тулегенова", birthDate: "2021-12-08", language: "both", createdAt: atDate(currentYear, 1, 21, 15, 25) },
  { id: 108, parentId: 6, fullname: "Нурислам Садыков", birthDate: "2020-08-30", language: "kz", createdAt: atDate(currentYear, 2, 10, 11, 50) },
  { id: 109, parentId: 7, fullname: "Алиса Бекенова", birthDate: "2019-05-16", language: "ru", createdAt: atDate(currentYear, 3, 19, 12, 40) },
  { id: 110, parentId: 8, fullname: "Лев Нургалиев", birthDate: "2018-12-14", language: "both", createdAt: atDate(currentYear, 3, 25, 11, 5) },
  { id: 111, parentId: 8, fullname: "Ева Нургалиева", birthDate: "2021-10-02", language: "ru", createdAt: atDate(currentYear, 3, 26, 13, 35) },
  { id: 112, parentId: 9, fullname: "Самир Оспанов", birthDate: "2020-04-09", language: "kz", createdAt: atDate(currentYear, 4, 8, 10, 0) },
  { id: 113, parentId: 10, fullname: "Аделя Жумабекова", birthDate: "2019-02-05", language: "both", createdAt: atDate(currentYear, 4, 13, 19, 0) },
  { id: 114, parentId: 10, fullname: "Тимур Жумабеков", birthDate: "2022-09-11", language: "ru", createdAt: atDate(currentYear, 4, 14, 10, 20) },
]

export const mockLeads: MockLead[] = [
  { id: 201, parentId: 1, childrenId: 101, createdAt: atDate(previousYear, 8, 15, 16, 10), status: "warm" },
  { id: 202, parentId: 2, childrenId: 102, createdAt: atDate(previousYear, 9, 6, 14, 0), status: "warm" },
  { id: 203, parentId: 2, childrenId: 102, createdAt: atDate(previousYear, 9, 8, 10, 25), status: "hot" },
  { id: 204, parentId: 3, childrenId: 104, createdAt: atDate(previousYear, 10, 23, 12, 30), status: "warm" },
  { id: 205, parentId: 4, childrenId: 105, createdAt: atDate(previousYear, 12, 12, 16, 45), status: "warm" },
  { id: 206, parentId: 5, childrenId: 106, createdAt: atDate(currentYear, 1, 19, 17, 15), status: "warm" },
  { id: 207, parentId: 5, childrenId: 106, createdAt: atDate(currentYear, 1, 25, 10, 5), status: "hot" },
  { id: 208, parentId: 6, childrenId: 108, createdAt: atDate(currentYear, 2, 10, 15, 40), status: "warm" },
  { id: 209, parentId: 7, childrenId: 109, createdAt: atDate(currentYear, 3, 18, 13, 15), status: "warm" },
  { id: 210, parentId: 7, childrenId: 109, createdAt: atDate(currentYear, 3, 21, 10, 50), status: "hot" },
  { id: 211, parentId: 8, childrenId: 110, createdAt: atDate(currentYear, 3, 24, 15, 20), status: "warm" },
  { id: 212, parentId: 8, childrenId: 110, createdAt: atDate(currentYear, 3, 28, 11, 10), status: "hot" },
  { id: 213, parentId: 9, childrenId: 112, createdAt: atDate(currentYear, 4, 8, 13, 10), status: "warm" },
  { id: 214, parentId: 10, childrenId: 113, createdAt: atDate(currentYear, 4, 13, 19, 40), status: "warm" },
  { id: 215, parentId: 10, childrenId: 113, createdAt: atDate(currentYear, 4, 14, 11, 30), status: "hot" },
]

export const mockUserSessions: MockUserSession[] = [
  { id: 301, parentId: 1, childrenId: 101, status: "registered", step: "confirmParentFullName", uiLanguage: "ru", startedAt: atDate(previousYear, 8, 14, 11, 30), lastSeenAt: daysAgo(120, 18, 10) },
  { id: 302, parentId: 2, childrenId: 102, status: "done", step: "mainMenu", uiLanguage: "ru", startedAt: atDate(previousYear, 9, 5, 15, 20), lastSeenAt: daysAgo(12, 14, 5) },
  { id: 303, parentId: 3, childrenId: 104, status: "testing", step: "testQuestion", uiLanguage: "ru", startedAt: atDate(previousYear, 10, 21, 10, 5), lastSeenAt: daysAgo(7, 11, 35) },
  { id: 304, parentId: 4, childrenId: 105, status: "registered", step: "childAge", uiLanguage: "kz", startedAt: atDate(previousYear, 12, 11, 13, 20), lastSeenAt: daysAgo(80, 10, 50) },
  { id: 305, parentId: 5, childrenId: 106, status: "done", step: "mainMenu", uiLanguage: "ru", startedAt: atDate(currentYear, 1, 18, 10, 30), lastSeenAt: daysAgo(15, 12, 15) },
  { id: 306, parentId: 6, childrenId: 108, status: "testing", step: "confirmData", uiLanguage: "kz", startedAt: atDate(currentYear, 2, 9, 16, 40), lastSeenAt: daysAgo(5, 17, 45) },
  { id: 307, parentId: 7, childrenId: 109, status: "done", step: "mainMenu", uiLanguage: "ru", startedAt: atDate(currentYear, 3, 18, 11, 15), lastSeenAt: daysAgo(1, 20, 20) },
  { id: 308, parentId: 8, childrenId: 110, status: "testing", step: "testQuestion", uiLanguage: "ru", startedAt: atDate(currentYear, 3, 24, 14, 50), lastSeenAt: daysAgo(0, 9, 10) },
  { id: 309, parentId: 9, childrenId: 112, status: "registered", step: "childLanguage", uiLanguage: "kz", startedAt: atDate(currentYear, 4, 7, 9, 35), lastSeenAt: daysAgo(0, 8, 5) },
  { id: 310, parentId: 10, childrenId: 113, status: "done", step: "mainMenu", uiLanguage: "ru", startedAt: atDate(currentYear, 4, 13, 18, 15), lastSeenAt: daysAgo(0, 7, 30) },
]

export const mockTestSessions: MockTestSession[] = [
  { id: 401, testId: 1, parentId: 1, childrenId: 101, createdAt: atDate(previousYear, 8, 16, 10, 40), completedAt: null, status: "incomplete", score: 14, answersCount: 5 },
  { id: 402, testId: 1, parentId: 2, childrenId: 102, createdAt: atDate(previousYear, 9, 7, 12, 5), completedAt: atDate(previousYear, 9, 7, 12, 45), status: "complete", score: 44, answersCount: 12 },
  { id: 403, testId: 1, parentId: 3, childrenId: 104, createdAt: atDate(previousYear, 11, 2, 9, 25), completedAt: atDate(previousYear, 11, 2, 10, 5), status: "complete", score: 27, answersCount: 11 },
  { id: 404, testId: 2, parentId: 4, childrenId: 105, createdAt: atDate(currentYear, 1, 5, 16, 10), completedAt: null, status: "incomplete", score: 16, answersCount: 4 },
  { id: 405, testId: 2, parentId: 5, childrenId: 106, createdAt: atDate(currentYear, 1, 20, 10, 30), completedAt: atDate(currentYear, 1, 20, 11, 5), status: "complete", score: 22, answersCount: 14 },
  { id: 406, testId: 2, parentId: 5, childrenId: 107, createdAt: atDate(currentYear, 2, 1, 13, 10), completedAt: atDate(currentYear, 2, 1, 13, 55), status: "complete", score: 31, answersCount: 13 },
  { id: 407, testId: 1, parentId: 6, childrenId: 108, createdAt: atDate(currentYear, 2, 11, 14, 20), completedAt: null, status: "incomplete", score: 18, answersCount: 6 },
  { id: 408, testId: 1, parentId: 7, childrenId: 109, createdAt: atDate(currentYear, 3, 20, 15, 15), completedAt: atDate(currentYear, 3, 20, 15, 50), status: "complete", score: 37, answersCount: 12 },
  { id: 409, testId: 2, parentId: 8, childrenId: 110, createdAt: atDate(currentYear, 3, 27, 11, 35), completedAt: atDate(currentYear, 3, 27, 12, 10), status: "complete", score: 29, answersCount: 10 },
  { id: 410, testId: 2, parentId: 8, childrenId: 111, createdAt: atDate(currentYear, 3, 29, 16, 40), completedAt: atDate(currentYear, 3, 29, 17, 20), status: "complete", score: 41, answersCount: 12 },
  { id: 411, testId: 1, parentId: 9, childrenId: 112, createdAt: atDate(currentYear, 4, 8, 14, 5), completedAt: null, status: "incomplete", score: 12, answersCount: 3 },
  { id: 412, testId: 2, parentId: 10, childrenId: 113, createdAt: atDate(currentYear, 4, 14, 12, 10), completedAt: atDate(currentYear, 4, 14, 12, 45), status: "complete", score: 24, answersCount: 14 },
]

export const mockLandingLeads: MockLandingLead[] = [
  {
    id: 501,
    fullName: "Мадина Омарова",
    phone: "+7 707 555 10 01",
    question: "Ребёнку 4 года, говорит отдельные слова. Нужна консультация по первичной диагностике.",
    createdAt: daysAgo(9, 11, 15),
  },
  {
    id: 502,
    fullName: "Аскар Ниязбеков",
    phone: "+7 707 555 10 02",
    question: "Хотим записаться на тест перед школой и понять, какой формат занятий лучше.",
    createdAt: daysAgo(7, 15, 30),
  },
  {
    id: 503,
    fullName: "Сабина Жаксылыкова",
    phone: "+7 707 555 10 03",
    question: "Интересуют занятия на казахском языке для ребёнка 5 лет.",
    createdAt: daysAgo(5, 13, 10),
  },
  {
    id: 504,
    fullName: "Елена Ким",
    phone: "+7 707 555 10 04",
    question: "Нужна повторная консультация после предыдущего тестирования, чтобы сверить динамику.",
    createdAt: daysAgo(4, 9, 40),
  },
  {
    id: 505,
    fullName: "Нуржан Кабиев",
    phone: "+7 707 555 10 05",
    question: "Ребёнок понимает речь, но почти не отвечает. Хотим обсудить дальнейшие шаги.",
    createdAt: daysAgo(2, 16, 20),
  },
  {
    id: 506,
    fullName: "Олеся Романова",
    phone: "+7 707 555 10 06",
    question: "Нужна онлайн-консультация и примерный план на 2 месяца занятий.",
    createdAt: daysAgo(1, 10, 5),
  },
]

function getParentById(parentId: number) {
  return mockParents.find((parent) => parent.id === parentId) ?? null
}

function getChildById(childId: number | null) {
  if (!childId) return null
  return mockChildren.find((child) => child.id === childId) ?? null
}

function getParentStatus(parentId: number): LeadStatus {
  return mockLeads.some((lead) => lead.parentId === parentId && lead.status === "hot") ? "hot" : "warm"
}

function resolveTestResult(testId: number, score: number) {
  return (
    mockTestRules.find((rule) => rule.testId === testId && score >= rule.minScore && score <= rule.maxScore)
      ?.label ?? "Без категории"
  )
}

export function getMockDashboardSummary() {
  const hotParentIds = new Set(mockLeads.filter((lead) => lead.status === "hot").map((lead) => lead.parentId))
  const warmParentIds = new Set(
    mockLeads.filter((lead) => lead.status === "warm" && !hotParentIds.has(lead.parentId)).map((lead) => lead.parentId)
  )
  const threshold = new Date(mockNow.getTime() - 30 * 24 * 60 * 60 * 1000)

  return {
    totalUsers: mockParents.length,
    newUsers30d: mockParents.filter((parent) => new Date(parent.createdAt) >= threshold).length,
    warmLeads: warmParentIds.size,
    hotLeads: hotParentIds.size,
  }
}

export function getMockTimeline() {
  const parentByDate = new Map<string, number>()
  const childByDate = new Map<string, number>()

  for (const parent of mockParents) {
    const key = dateKey(parent.createdAt)
    parentByDate.set(key, (parentByDate.get(key) ?? 0) + 1)
  }

  for (const child of mockChildren) {
    const key = dateKey(child.createdAt)
    childByDate.set(key, (childByDate.get(key) ?? 0) + 1)
  }

  const allKeys = Array.from(new Set([...parentByDate.keys(), ...childByDate.keys()])).sort()
  if (allKeys.length === 0) {
    return { totalParents: 0, totalChildren: 0, timeline: [] as Array<{ date: string; parents: number; children: number }> }
  }

  const timeline: Array<{ date: string; parents: number; children: number }> = []
  const start = new Date(allKeys[0])
  const end = new Date(allKeys[allKeys.length - 1])

  for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10)
    timeline.push({
      date: key,
      parents: parentByDate.get(key) ?? 0,
      children: childByDate.get(key) ?? 0,
    })
  }

  return {
    totalParents: mockParents.length,
    totalChildren: mockChildren.length,
    timeline,
  }
}

export function getMockLeadUsers() {
  return [...mockParents]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((parent) => ({
      parentId: parent.id,
      parentFullName: parent.fullname,
      childrenCount: mockChildren.filter((child) => child.parentId === parent.id).length,
      createdAt: parent.createdAt,
      status: getParentStatus(parent.id),
    }))
}

export function getMockSessionsUsersResponse() {
  const uniqueSessions = [...mockUserSessions].sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  )
  const active24hThreshold = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000)
  const stuck72hThreshold = new Date(mockNow.getTime() - 72 * 60 * 60 * 1000)

  const items = uniqueSessions.map((session) => {
    const parent = getParentById(session.parentId)
    const child = getChildById(session.childrenId)

    return {
      sessionId: session.id,
      parentId: session.parentId,
      parentFullName: parent?.fullname ?? `Parent #${session.parentId}`,
      parentPhone: parent?.phone ?? "—",
      childId: child?.id ?? null,
      childFullName: child?.fullname ?? null,
      status: session.status,
      step: session.step,
      stepLabel: stepLabel(session.step),
      startedAt: session.startedAt,
      lastSeenAt: session.lastSeenAt,
    }
  })

  return {
    summary: {
      uniqueParents: items.length,
      active24h: items.filter((item) => new Date(item.lastSeenAt) >= active24hThreshold).length,
      done: items.filter((item) => item.status === "done").length,
      stuck: items.filter((item) => item.status !== "done" && new Date(item.lastSeenAt) < stuck72hThreshold).length,
    },
    items,
  }
}

export function getMockAnalyticsOverview(yearInput?: number, monthInput?: string) {
  const selectedYear = parseYear(yearInput, currentYear)
  const defaultMonth = `${currentYear}-${String(mockNow.getMonth() + 1).padStart(2, "0")}`
  const selectedMonth = parseMonth(monthInput, defaultMonth)

  const yearCurrent = startEndOfYear(selectedYear)
  const yearPrevious = startEndOfYear(selectedYear - 1)
  const monthCurrent = startEndOfMonth(selectedMonth)
  const monthPrevious = startEndOfMonth(previousMonth(selectedMonth))

  const monthBuckets = buildMonthBuckets(selectedYear)
  const leadsByMonthMap = new Map<string, { warm: number; hot: number }>()
  const parentsByMonthMap = new Map<string, number>()

  for (const month of monthBuckets) {
    const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
    leadsByMonthMap.set(key, { warm: 0, hot: 0 })
    parentsByMonthMap.set(key, 0)
  }

  let leadsCurrentYear = 0
  let leadsPreviousYear = 0
  for (const lead of mockLeads) {
    const date = new Date(lead.createdAt)
    if (date >= yearCurrent.start && date < yearCurrent.end) {
      leadsCurrentYear++
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const row = leadsByMonthMap.get(key)
      if (row) {
        if (lead.status === "hot") row.hot += 1
        else row.warm += 1
      }
    } else if (date >= yearPrevious.start && date < yearPrevious.end) {
      leadsPreviousYear++
    }
  }

  let parentsCurrentYear = 0
  let parentsPreviousYear = 0
  for (const parent of mockParents) {
    const date = new Date(parent.createdAt)
    if (date >= yearCurrent.start && date < yearCurrent.end) {
      parentsCurrentYear++
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      parentsByMonthMap.set(key, (parentsByMonthMap.get(key) ?? 0) + 1)
    } else if (date >= yearPrevious.start && date < yearPrevious.end) {
      parentsPreviousYear++
    }
  }

  const completedSessions = mockTestSessions.filter(
    (session) => session.status === "complete" && session.completedAt
  )

  const resultsCurrentMap = new Map<string, number>()
  let resultsCurrentYear = 0
  let resultsPreviousYear = 0

  for (const session of completedSessions) {
    const completedAt = new Date(session.completedAt as string)
    const label = resolveTestResult(session.testId, session.score)

    if (completedAt >= yearCurrent.start && completedAt < yearCurrent.end) {
      resultsCurrentYear++
      resultsCurrentMap.set(label, (resultsCurrentMap.get(label) ?? 0) + 1)
    } else if (completedAt >= yearPrevious.start && completedAt < yearPrevious.end) {
      resultsPreviousYear++
    }
  }

  const resultsDistribution = Array.from(resultsCurrentMap.entries()).map(([label, value], index) => ({
    key: `result_${index + 1}`,
    label,
    value,
    color: resultColor(label),
  }))

  const dayBuckets: Date[] = []
  for (
    let day = new Date(monthCurrent.start);
    day < monthCurrent.end;
    day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
  ) {
    dayBuckets.push(new Date(day))
  }

  const parentsByDayMap = new Map<string, number>()
  const leadsByDayMap = new Map<string, { warm: number; hot: number }>()
  for (const day of dayBuckets) {
    const key = dayLabel(day)
    parentsByDayMap.set(key, 0)
    leadsByDayMap.set(key, { warm: 0, hot: 0 })
  }

  let parentsCurrentMonth = 0
  let parentsPreviousMonth = 0
  for (const parent of mockParents) {
    const date = new Date(parent.createdAt)
    if (date >= monthCurrent.start && date < monthCurrent.end) {
      parentsCurrentMonth++
      const key = dayLabel(date)
      parentsByDayMap.set(key, (parentsByDayMap.get(key) ?? 0) + 1)
    } else if (date >= monthPrevious.start && date < monthPrevious.end) {
      parentsPreviousMonth++
    }
  }

  let warmCurrentMonth = 0
  let hotCurrentMonth = 0
  let warmPreviousMonth = 0
  let hotPreviousMonth = 0
  for (const lead of mockLeads) {
    const date = new Date(lead.createdAt)
    if (date >= monthCurrent.start && date < monthCurrent.end) {
      const key = dayLabel(date)
      const bucket = leadsByDayMap.get(key)
      if (bucket) {
        if (lead.status === "hot") {
          bucket.hot += 1
          hotCurrentMonth++
        } else {
          bucket.warm += 1
          warmCurrentMonth++
        }
      }
    } else if (date >= monthPrevious.start && date < monthPrevious.end) {
      if (lead.status === "hot") hotPreviousMonth++
      else warmPreviousMonth++
    }
  }

  return {
    selectedYear,
    selectedMonth,
    yearRangeLabel: `01.01.${selectedYear} - 31.12.${selectedYear}`,
    monthRangeLabel: `${monthCurrent.start.toLocaleDateString("ru-RU", { month: "long" })} ${monthCurrent.start.getFullYear()}`,
    leadsByMonth: monthBuckets.map((month) => {
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
      const value = leadsByMonthMap.get(key) ?? { warm: 0, hot: 0 }
      return {
        month: monthShortRu(month),
        warm: value.warm,
        hot: value.hot,
      }
    }),
    uniqueParentsByMonth: monthBuckets.map((month) => {
      const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
      return {
        month: monthShortRu(month),
        parents: parentsByMonthMap.get(key) ?? 0,
      }
    }),
    resultsDistribution,
    parentsByDay: dayBuckets.map((day) => ({
      day: dayLabel(day),
      parents: parentsByDayMap.get(dayLabel(day)) ?? 0,
    })),
    leadsByDay: dayBuckets.map((day) => ({
      day: dayLabel(day),
      warm: leadsByDayMap.get(dayLabel(day))?.warm ?? 0,
      hot: leadsByDayMap.get(dayLabel(day))?.hot ?? 0,
    })),
    trends: {
      yearlyLeads: {
        current: leadsCurrentYear,
        previous: leadsPreviousYear,
        changePct: percentChange(leadsCurrentYear, leadsPreviousYear),
        hasEnoughData: leadsPreviousYear > 0,
      },
      yearlyParents: {
        current: parentsCurrentYear,
        previous: parentsPreviousYear,
        changePct: percentChange(parentsCurrentYear, parentsPreviousYear),
        hasEnoughData: parentsPreviousYear > 0,
      },
      yearlyResults: {
        current: resultsCurrentYear,
        previous: resultsPreviousYear,
        changePct: percentChange(resultsCurrentYear, resultsPreviousYear),
        hasEnoughData: resultsPreviousYear > 0,
      },
      monthlyParents: {
        current: parentsCurrentMonth,
        previous: parentsPreviousMonth,
        changePct: percentChange(parentsCurrentMonth, parentsPreviousMonth),
        hasEnoughData: parentsPreviousMonth > 0,
      },
      monthlyLeads: {
        currentWarm: warmCurrentMonth,
        currentHot: hotCurrentMonth,
        currentTotal: warmCurrentMonth + hotCurrentMonth,
        previousWarm: warmPreviousMonth,
        previousHot: hotPreviousMonth,
        previousTotal: warmPreviousMonth + hotPreviousMonth,
        changePct: percentChange(warmCurrentMonth + hotCurrentMonth, warmPreviousMonth + hotPreviousMonth),
        hasEnoughData: warmPreviousMonth + hotPreviousMonth > 0,
      },
    },
  }
}

export function getMockLandingLeads() {
  return [...mockLandingLeads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getMockParentDetail(parentId: number) {
  const parent = getParentById(parentId)
  if (!parent) return null

  const children = mockChildren.filter((child) => child.parentId === parentId)
  const childNameById = new Map(children.map((child) => [child.id, child.fullname]))
  const testNameById = new Map(mockTests.map((test) => [test.id, test.name]))

  const testHistory = mockTestSessions
    .filter((session) => session.parentId === parentId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((session) => ({
      id: session.id,
      childFullName: childNameById.get(session.childrenId) ?? "—",
      testName: testNameById.get(session.testId) ?? `Тест #${session.testId}`,
      status: session.status,
      score: session.score,
      result: session.status === "complete" ? resolveTestResult(session.testId, session.score) : "—",
      answersCount: session.answersCount,
      createdAt: session.createdAt,
      completedAt: session.completedAt,
    }))

  return {
    parent,
    children,
    status: getParentStatus(parentId),
    testHistory,
  }
}
