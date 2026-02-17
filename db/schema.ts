import { sql } from "drizzle-orm";
import { integer, pgTable, varchar, date, timestamp, pgEnum, check} from "drizzle-orm/pg-core";

export const childLanguageEnum = pgEnum("child_language", ["ru", "kz", "both"]);
export const testSessionsEnum = pgEnum("test_session_status", ["incomplete", "complete"])
export const userSessionsEnum = pgEnum("user_session_status", ["registered", "testing", "done"])
export const leadsEnum = pgEnum("lead", ["warm", "hot"])

export const adminsTable = pgTable("admins", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("admin_id").notNull().references(() => adminsTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parentsTable =  pgTable("parents", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullname: varchar({ length: 255 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const childrenTable = pgTable("children", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullname: varchar({ length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  language: childLanguageEnum("language").notNull(),
  parentId: integer("parent_id").notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

}); 

export const testsTable = pgTable("tests", {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 255 }).notNull(),
    ageFrom: integer("age_from").notNull(),
    ageTo: integer("age_to").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    ageRangeCheck: check("tests_age_range_check", sql`${t.ageFrom} < ${t.ageTo}`),
  })
);

export const questionsTable = pgTable("questions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  // DB currently has legacy column name `text_id`; keep app field as `testId`.
  testId: integer('text_id').notNull().references(() => testsTable.id, { onDelete: 'cascade' }),
  textRu: varchar("text_ru", { length: 255 }).notNull(),
  textKz: varchar("text_kz", { length: 255 }).notNull(),
  textEn: varchar("text_en", { length: 255 })
})

export const answersTable = pgTable("answers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  textRu: varchar("text_ru", { length: 255 }).notNull(),
  textKz: varchar("text_kz", { length: 255 }).notNull(),
  textEn: varchar("text_en", { length: 255 }), 
  points: integer("points").notNull().default(0)
})

export const testResultRulesTable = pgTable("test_result_rules", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  testId: integer("test_id").notNull().references(() => testsTable.id, { onDelete: "cascade" }),
  minScore: integer("min_score").notNull(),
  maxScore: integer("max_score").notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  textRu: varchar("text_ru", { length: 1000 }).notNull(),
  textKz: varchar("text_kz", { length: 1000 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// DB currently uses legacy table name `sessions`.
export const testSessionTable = pgTable("sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  testId: integer('test_id').notNull().references(() => testsTable.id, { onDelete: 'cascade' }),
  parentId: integer('parent_id').notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  childrenId: integer('children_id').notNull().references(() => childrenTable.id, { onDelete: 'cascade' }),
  chatId: varchar("chat_id", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  status: testSessionsEnum("status").default("incomplete").notNull(),
  score: integer("score").default(0).notNull(),
})
export const userSessionTable = pgTable("user_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer('parent_id').notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  childrenId: integer('children_id').references(() => childrenTable.id, { onDelete: 'cascade' }),
  status: userSessionsEnum("status").default("registered").notNull(),
  step: varchar("step", { length: 64 }).notNull(),
  uiLanguage: varchar("ui_language", { length: 16 }),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
})

export const sessionAnswerTable = pgTable("sesson_answer", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessonId: integer('session_id').notNull().references(() => testSessionTable.id, { onDelete: 'cascade' }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, {onDelete: 'cascade'}),
  answerId: integer('answer_id').notNull().references(() => answersTable.id, {onDelete: 'cascade'}),
  answerText: varchar('answer_text', { length: 255 }).notNull(),  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const leadsTable = pgTable("leads", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer('parent_id').notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  childrenId: integer('children_id').references(() => childrenTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  status: leadsEnum("leads").notNull()
})
