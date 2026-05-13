import { sql } from "drizzle-orm";
import { boolean as pgBoolean, integer, pgTable, varchar, date, timestamp, pgEnum, check} from "drizzle-orm/pg-core";

export const childLanguageEnum = pgEnum("child_language", ["ru", "kz", "both"]);
export const testSessionsEnum = pgEnum("test_session_status", ["incomplete", "complete"])
export const userSessionsEnum = pgEnum("user_session_status", ["registered", "testing", "done"])
export const leadsEnum = pgEnum("lead", ["warm", "hot"])
export const diagnosticLeadStatusEnum = pgEnum("diagnostic_lead_status", ["pending", "issued"])
export const exerciseAssignmentStatusEnum = pgEnum("exercise_assignment_status", ["assigned", "in_progress", "completed"])
export const diagnosticSessionStatusEnum = pgEnum("diagnostic_session_status", ["not_started", "in_progress", "submitted", "reviewed"])
export const diagnosticResponseStatusEnum = pgEnum("diagnostic_response_status", ["pending", "recorded", "submitted", "analyzed"])
export const diagnosticAiStatusEnum = pgEnum("diagnostic_ai_status", ["not_requested", "queued", "completed", "failed"])
export const diagnosticAssignmentStatusEnum = pgEnum("diagnostic_assignment_status", ["assigned", "in_progress", "submitted", "reviewed"])


export const adminsTable = pgTable("admins", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const adminSessionsTable = pgTable("admin_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => adminsTable.id, { onDelete: "cascade" }),
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

export const parentAccountsTable = pgTable("parent_accounts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer("parent_id")
    .notNull()
    .references(() => parentsTable.id, { onDelete: "cascade" })
    .unique(),
  login: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: pgBoolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const parentSessionsTable = pgTable("parent_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  parentAccountId: integer("parent_account_id")
    .notNull()
    .references(() => parentAccountsTable.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const childrenTable = pgTable("children", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullname: varchar({ length: 255 }).notNull(),
  birthDate: date('birth_date').notNull(),
  language: childLanguageEnum("language").notNull(),
  parentId: integer("parent_id").notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

}); 

export const speechExercisesTable = pgTable("speech_exercises", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar({ length: 120 }).notNull().unique(),
  title: varchar({ length: 255 }).notNull(),
  word: varchar({ length: 120 }).notNull(),
  targetSound: varchar("target_sound", { length: 32 }),
  imageEmoji: varchar("image_emoji", { length: 16 }),
  accentColor: varchar("accent_color", { length: 32 }),
  samplePrompt: varchar("sample_prompt", { length: 255 }),
  helperText: varchar("helper_text", { length: 1000 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const childExerciseAssignmentsTable = pgTable("child_exercise_assignments", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  childId: integer("child_id")
    .notNull()
    .references(() => childrenTable.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => speechExercisesTable.id, { onDelete: "cascade" }),
  assignedByAdminId: integer("assigned_by_admin_id").references(() => adminsTable.id, { onDelete: "set null" }),
  status: exerciseAssignmentStatusEnum("status").default("assigned").notNull(),
  notes: varchar("notes", { length: 1000 }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
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

export const diagnosticLeadsTable = pgTable("diagnostic_leads", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  parentId: integer('parent_id').notNull().references(() => parentsTable.id, { onDelete: 'cascade' }),
  childId: integer('child_id').references(() => childrenTable.id, { onDelete: "set null" }),
  status: diagnosticLeadStatusEnum("status").default("pending").notNull(),
  accessLogin: varchar("access_login", { length: 255 }),
  accessPassword: varchar("access_password", { length: 255 }),
  accessIssuedAt: timestamp("access_issued_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})

export const diagnosticItemsTable = pgTable("diagnostic_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  language: childLanguageEnum("language").notNull(),
  soundGroup: varchar("sound_group", { length: 64 }).notNull(),
  targetSound: varchar("target_sound", { length: 32 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  word: varchar("word", { length: 120 }).notNull(),
  prompt: varchar("prompt", { length: 255 }),
  helperText: varchar("helper_text", { length: 1000 }),
  imageUrl: varchar("image_url", { length: 512 }),
  imageAlt: varchar("image_alt", { length: 255 }),
  imageEmoji: varchar("image_emoji", { length: 16 }),
  accentColor: varchar("accent_color", { length: 32 }),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const diagnosticTemplatesTable = pgTable("diagnostic_templates", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  description: varchar("description", { length: 2000 }),
  language: childLanguageEnum("language").notNull(),
  isActive: pgBoolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const diagnosticTemplateItemsTable = pgTable("diagnostic_template_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  diagnosticTemplateId: integer("diagnostic_template_id")
    .notNull()
    .references(() => diagnosticTemplatesTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id")
    .notNull()
    .references(() => diagnosticItemsTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const childDiagnosticAssignmentsTable = pgTable("child_diagnostic_assignments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  childId: integer("child_id")
    .notNull()
    .references(() => childrenTable.id, { onDelete: "cascade" }),
  diagnosticTemplateId: integer("diagnostic_template_id")
    .notNull()
    .references(() => diagnosticTemplatesTable.id, { onDelete: "cascade" }),
  assignedByAdminId: integer("assigned_by_admin_id").references(() => adminsTable.id, { onDelete: "set null" }),
  status: diagnosticAssignmentStatusEnum("status").default("assigned").notNull(),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const diagnosticSessionsTable = pgTable("diagnostic_sessions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  diagnosticLeadId: integer("diagnostic_lead_id").references(() => diagnosticLeadsTable.id, { onDelete: "set null" }),
  diagnosticTemplateId: integer("diagnostic_template_id").references(() => diagnosticTemplatesTable.id, { onDelete: "set null" }),
  assignmentId: integer("assignment_id").references(() => childDiagnosticAssignmentsTable.id, { onDelete: "set null" }),
  parentId: integer("parent_id").notNull().references(() => parentsTable.id, { onDelete: "cascade" }),
  childId: integer("child_id").notNull().references(() => childrenTable.id, { onDelete: "cascade" }),
  status: diagnosticSessionStatusEnum("status").default("not_started").notNull(),
  currentItemOrder: integer("current_item_order").default(0).notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const diagnosticResponsesTable = pgTable("diagnostic_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sessionId: integer("session_id").notNull().references(() => diagnosticSessionsTable.id, { onDelete: "cascade" }),
  itemId: integer("item_id").notNull().references(() => diagnosticItemsTable.id, { onDelete: "cascade" }),
  status: diagnosticResponseStatusEnum("status").default("pending").notNull(),
  audioPath: varchar("audio_path", { length: 512 }),
  audioMimeType: varchar("audio_mime_type", { length: 128 }),
  audioDurationMs: integer("audio_duration_ms"),
  transcript: varchar("transcript", { length: 1000 }),
  aiStatus: diagnosticAiStatusEnum("ai_status").default("not_requested").notNull(),
  aiSummary: varchar("ai_summary", { length: 2048 }),
  recordedAt: timestamp("recorded_at", { withTimezone: true }),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
})

export const botRuntimeStateTable = pgTable("bot_runtime_state", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  status: varchar("status", { length: 32 }).notNull(),
  qrDataUrl: varchar("qr_data_url"),
  lastError: varchar("last_error"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  controlAction: varchar("control_action"),
  controlToken: varchar("control_token", { length: 128 }),
  controlRequestedAt: timestamp("control_requested_at", { withTimezone: true }),
  controlProcessedAt: timestamp("control_processed_at", { withTimezone: true }),
  controlResult: varchar("control_result", { length: 2048 }),
  heartbeatAt: timestamp("heartbeat_at", { withTimezone: true }),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  adminId: integer("admin_id")
    .notNull()
    .references(() => adminsTable.id, { onDelete: "cascade" }),  
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
})
