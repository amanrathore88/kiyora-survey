import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// ============================================================
// 1. SURVEYS
// ============================================================
export const surveys = sqliteTable("surveys", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  incentiveText: text("incentive_text"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const surveysRelations = relations(surveys, ({ many }) => ({
  sections: many(sections),
  sessions: many(surveySessions),
}));

// ============================================================
// 2. SECTIONS
// ============================================================
export const sections = sqliteTable("sections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id),
  sectionKey: text("section_key").notNull(),
  sectionTitle: text("section_title").notNull(),
  description: text("description"),
  conceptText: text("concept_text"),
  orderIndex: integer("order_index").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const sectionsRelations = relations(sections, ({ one, many }) => ({
  survey: one(surveys, {
    fields: [sections.surveyId],
    references: [surveys.id],
  }),
  questions: many(questions),
}));

// ============================================================
// 3. QUESTIONS
// ============================================================
export const questions = sqliteTable("questions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id),
  questionNumber: text("question_number").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type", {
    enum: ["radio", "checkbox", "text"],
  }).notNull(),
  minSelections: integer("min_selections"),
  maxSelections: integer("max_selections"),
  hasOtherOption: integer("has_other_option", { mode: "boolean" })
    .notNull()
    .default(false),
  conditionalLogic: text("conditional_logic"),
  researcherNote: text("researcher_note"),
  orderIndex: integer("order_index").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  currentRevision: integer("current_revision").notNull().default(1),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const questionsRelations = relations(questions, ({ one, many }) => ({
  section: one(sections, {
    fields: [questions.sectionId],
    references: [sections.id],
  }),
  options: many(questionOptions),
  revisions: many(questionRevisions),
  responses: many(responses),
}));

// ============================================================
// 4. QUESTION OPTIONS (normalized — no JSON blobs)
// ============================================================
export const questionOptions = sqliteTable("question_options", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  optionText: text("option_text").notNull(),
  orderIndex: integer("order_index").notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const questionOptionsRelations = relations(
  questionOptions,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionOptions.questionId],
      references: [questions.id],
    }),
  })
);

// ============================================================
// 5. QUESTION REVISIONS (versioning — never destroy history)
// ============================================================
export const questionRevisions = sqliteTable("question_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  revisionNumber: integer("revision_number").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull(),
  optionsSnapshot: text("options_snapshot").notNull(), // JSON snapshot at this revision
  changedBy: text("changed_by"),
  changeReason: text("change_reason"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const questionRevisionsRelations = relations(
  questionRevisions,
  ({ one }) => ({
    question: one(questions, {
      fields: [questionRevisions.questionId],
      references: [questions.id],
    }),
  })
);

// ============================================================
// 6. SURVEY SESSIONS
// ============================================================
export const surveySessions = sqliteTable("survey_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  surveyId: integer("survey_id")
    .notNull()
    .references(() => surveys.id),
  sessionToken: text("session_token").notNull().unique(),
  status: text("status", {
    enum: ["in_progress", "completed", "abandoned"],
  })
    .notNull()
    .default("in_progress"),
  currentQuestionIndex: integer("current_question_index").notNull().default(0),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  startedAt: text("started_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  completedAt: text("completed_at"),
  lastActivityAt: text("last_activity_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const surveySessionsRelations = relations(
  surveySessions,
  ({ one, many }) => ({
    survey: one(surveys, {
      fields: [surveySessions.surveyId],
      references: [surveys.id],
    }),
    responses: many(responses),
    contact: one(respondentContacts),
  })
);

// ============================================================
// 7. RESPONSES (one per question per session)
// ============================================================
export const responses = sqliteTable("responses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => surveySessions.id),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  questionRevision: integer("question_revision").notNull(),
  submittedAt: text("submitted_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  isArchived: integer("is_archived", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const responsesRelations = relations(responses, ({ one, many }) => ({
  session: one(surveySessions, {
    fields: [responses.sessionId],
    references: [surveySessions.id],
  }),
  question: one(questions, {
    fields: [responses.questionId],
    references: [questions.id],
  }),
  answers: many(responseAnswers),
}));

// ============================================================
// 8. RESPONSE ANSWERS (individual selections / text per response)
// ============================================================
export const responseAnswers = sqliteTable("response_answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  responseId: integer("response_id")
    .notNull()
    .references(() => responses.id),
  questionId: integer("question_id")
    .notNull()
    .references(() => questions.id),
  optionId: integer("option_id").references(() => questionOptions.id),
  otherText: text("other_text"),
  freeText: text("free_text"),
});

export const responseAnswersRelations = relations(
  responseAnswers,
  ({ one }) => ({
    response: one(responses, {
      fields: [responseAnswers.responseId],
      references: [responses.id],
    }),
    question: one(questions, {
      fields: [responseAnswers.questionId],
      references: [questions.id],
    }),
    option: one(questionOptions, {
      fields: [responseAnswers.optionId],
      references: [questionOptions.id],
    }),
  })
);

// ============================================================
// 9. RESPONDENT CONTACTS (collected only after survey completion)
// ============================================================
export const respondentContacts = sqliteTable("respondent_contacts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id")
    .notNull()
    .unique()
    .references(() => surveySessions.id),
  participantName: text("participant_name"),
  participantContact: text("participant_contact"),
  collectedAt: text("collected_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const respondentContactsRelations = relations(
  respondentContacts,
  ({ one }) => ({
    session: one(surveySessions, {
      fields: [respondentContacts.sessionId],
      references: [surveySessions.id],
    }),
  })
);

// ============================================================
// 10. ADMIN USERS
// ============================================================
export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  lastLoginAt: text("last_login_at"),
});
