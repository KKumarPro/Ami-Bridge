import { pgTable, text, serial, integer, timestamp, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "mentor", "admin"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studentProfiles = pgTable("student_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  branch: text("branch").notNull(),
  year: integer("year").notNull(),
  prScore: integer("pr_score").default(0).notNull(),
  codingScore: integer("coding_score").default(0).notNull(),
  resumeScore: integer("resume_score").default(0).notNull(),
  mockScore: integer("mock_score").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const mentorAssignments = pgTable("mentor_assignments", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  difficultyLevel: text("difficulty_level", { enum: ["easy", "medium", "hard"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interviewQuestions = pgTable("interview_questions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  correctAnswer: text("correct_answer").notNull(),
  topic: text("topic").notNull(),
  marks: integer("marks").default(10).notNull(),
});

export const studentAttempts = pgTable("student_attempts", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  totalScore: integer("total_score").notNull(),
  maxScore: integer("max_score").notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow().notNull(),
});

export const attemptDetails = pgTable("attempt_details", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => studentAttempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => interviewQuestions.id, { onDelete: "cascade" }),
  studentAnswer: text("student_answer").notNull(),
  scoreAwarded: integer("score_awarded").notNull(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filePath: text("file_path").notNull(),
  adminScore: integer("admin_score"), // null means not yet scored
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const mentorFeedback = pgTable("mentor_feedback", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  notes: text("notes").notNull(),
  performanceRating: integer("performance_rating").notNull(), // 1-5
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [studentProfiles.userId],
    references: [users.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  questions: many(interviewQuestions),
}));

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one }) => ({
  company: one(companies, {
    fields: [interviewQuestions.companyId],
    references: [companies.id],
  }),
}));


// Base Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertStudentProfileSchema = createInsertSchema(studentProfiles).omit({ id: true, lastUpdated: true, prScore: true, codingScore: true, resumeScore: true, mockScore: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(interviewQuestions).omit({ id: true });
export const insertAttemptSchema = createInsertSchema(studentAttempts).omit({ id: true, attemptedAt: true });
export const insertAttemptDetailSchema = createInsertSchema(attemptDetails).omit({ id: true });
export const insertResumeSchema = createInsertSchema(resumes).omit({ id: true, uploadedAt: true, adminScore: true });
export const insertFeedbackSchema = createInsertSchema(mentorFeedback).omit({ id: true, createdAt: true });

// Explicit API Contract Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type StudentProfile = typeof studentProfiles.$inferSelect;
export type InsertStudentProfile = z.infer<typeof insertStudentProfileSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type InterviewQuestion = typeof interviewQuestions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type StudentAttempt = typeof studentAttempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type AttemptDetail = typeof attemptDetails.$inferSelect;
export type InsertAttemptDetail = z.infer<typeof insertAttemptDetailSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type MentorFeedback = typeof mentorFeedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

// Request Types
export type RegisterRequest = InsertUser & { branch?: string; year?: number };
export type LoginRequest = Pick<InsertUser, "email" | "password">;
export type ScoreResumeRequest = { adminScore: number };

// Extended Response Types
export type StudentProfileResponse = User & { profile: StudentProfile };
export type DashboardStatsResponse = {
  totalStudents: number;
  totalMentors: number;
  totalCompanies: number;
  averagePrs: number;
  topStudents: (User & { profile: StudentProfile })[];
  prsDistribution: { range: string; count: number }[];
};

export type InterviewSubmissionRequest = {
  companyId: number;
  answers: { questionId: number; studentAnswer: string }[];
};
