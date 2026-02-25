import { db } from "./db";
import {
  users,
  studentProfiles,
  mentorAssignments,
  companies,
  interviewQuestions,
  studentAttempts,
  attemptDetails,
  resumes,
  mentorFeedback,
  type User,
  type InsertUser,
  type StudentProfile,
  type InsertStudentProfile,
  type Company,
  type InsertCompany,
  type InterviewQuestion,
  type InsertQuestion,
  type StudentAttempt,
  type InsertAttempt,
  type AttemptDetail,
  type InsertAttemptDetail,
  type Resume,
  type InsertResume,
  type MentorFeedback,
  type InsertFeedback,
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllMentors(): Promise<User[]>;
  getAllStudents(): Promise<User[]>;

  // Student Profile
  createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile>;
  getStudentProfile(userId: number): Promise<StudentProfile | undefined>;
  updateStudentProfile(userId: number, updates: Partial<StudentProfile>): Promise<StudentProfile>;

  // Mentor Assignment
  assignMentor(mentorId: number, studentId: number): Promise<void>;
  getMentorForStudent(studentId: number): Promise<User | undefined>;
  getStudentsForMentor(mentorId: number): Promise<User[]>;

  // Company
  createCompany(company: InsertCompany): Promise<Company>;
  getCompanyById(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;

  // Interview Questions
  createQuestion(question: InsertQuestion): Promise<InterviewQuestion>;
  getQuestionsForCompany(companyId: number): Promise<InterviewQuestion[]>;
  getQuestionById(id: number): Promise<InterviewQuestion | undefined>;

  // Student Attempts
  createAttempt(attempt: InsertAttempt): Promise<StudentAttempt>;
  updateAttempt(id: number, updates: Partial<StudentAttempt>): Promise<StudentAttempt>;
  createAttemptDetail(detail: InsertAttemptDetail): Promise<AttemptDetail>;
  getRecentAttempts(studentId: number, limit: number): Promise<StudentAttempt[]>;
  getLastFiveAttempts(studentId: number): Promise<StudentAttempt[]>;

  // Resume
  createResume(resume: InsertResume): Promise<Resume>;
  getResumesByStudentId(studentId: number): Promise<Resume[]>;
  getResumeById(id: number): Promise<Resume | undefined>;
  updateResumeScore(id: number, adminScore: number): Promise<Resume>;
  getAllResumes(): Promise<Resume[]>;

  // Mentor Feedback
  createFeedback(feedback: InsertFeedback): Promise<MentorFeedback>;
  getLatestFeedback(studentId: number): Promise<MentorFeedback | undefined>;
  getAllFeedbackForStudent(studentId: number): Promise<MentorFeedback[]>;

  // Analytics
  countUsersByRole(role: string): Promise<number>;
  getAveragePRS(): Promise<number>;
  getTopStudents(limit: number): Promise<User[]>;
  getPRSDistribution(): Promise<{ range: string; count: number }[]>;
  getCompanyAttemptStats(): Promise<{ name: string; count: number }[]>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getAllMentors(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "mentor"));
  }

  async getAllStudents(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, "student"));
  }

  async createStudentProfile(profile: InsertStudentProfile): Promise<StudentProfile> {
    const [created] = await db.insert(studentProfiles).values(profile).returning();
    return created;
  }

  async getStudentProfile(userId: number): Promise<StudentProfile | undefined> {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    return profile;
  }

  async updateStudentProfile(userId: number, updates: Partial<StudentProfile>): Promise<StudentProfile> {
    const [updated] = await db
      .update(studentProfiles)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(studentProfiles.userId, userId))
      .returning();
    return updated;
  }

  async assignMentor(mentorId: number, studentId: number): Promise<void> {
    await db.insert(mentorAssignments).values({ mentorId, studentId });
  }

  async getMentorForStudent(studentId: number): Promise<User | undefined> {
    const [assignment] = await db
      .select()
      .from(mentorAssignments)
      .where(eq(mentorAssignments.studentId, studentId));
    
    if (!assignment) return undefined;

    const [mentor] = await db.select().from(users).where(eq(users.id, assignment.mentorId));
    return mentor;
  }

  async getStudentsForMentor(mentorId: number): Promise<User[]> {
    const assignments = await db
      .select()
      .from(mentorAssignments)
      .where(eq(mentorAssignments.mentorId, mentorId));
    
    const studentIds = assignments.map(a => a.studentId);
    if (studentIds.length === 0) return [];

    return await db.select().from(users).where(sql`${users.id} = ANY(${studentIds})`);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies);
  }

  async createQuestion(question: InsertQuestion): Promise<InterviewQuestion> {
    const [created] = await db.insert(interviewQuestions).values(question).returning();
    return created;
  }

  async getQuestionsForCompany(companyId: number): Promise<InterviewQuestion[]> {
    return await db.select().from(interviewQuestions).where(eq(interviewQuestions.companyId, companyId));
  }

  async getQuestionById(id: number): Promise<InterviewQuestion | undefined> {
    const [question] = await db.select().from(interviewQuestions).where(eq(interviewQuestions.id, id));
    return question;
  }

  async createAttempt(attempt: InsertAttempt): Promise<StudentAttempt> {
    const [created] = await db.insert(studentAttempts).values(attempt).returning();
    return created;
  }

  async updateAttempt(id: number, updates: Partial<StudentAttempt>): Promise<StudentAttempt> {
    const [updated] = await db
      .update(studentAttempts)
      .set(updates)
      .where(eq(studentAttempts.id, id))
      .returning();
    return updated;
  }

  async createAttemptDetail(detail: InsertAttemptDetail): Promise<AttemptDetail> {
    const [created] = await db.insert(attemptDetails).values(detail).returning();
    return created;
  }

  async getRecentAttempts(studentId: number, limit: number): Promise<StudentAttempt[]> {
    return await db
      .select()
      .from(studentAttempts)
      .where(eq(studentAttempts.studentId, studentId))
      .orderBy(desc(studentAttempts.attemptedAt))
      .limit(limit);
  }

  async getLastFiveAttempts(studentId: number): Promise<StudentAttempt[]> {
    return this.getRecentAttempts(studentId, 5);
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const [created] = await db.insert(resumes).values(resume).returning();
    return created;
  }

  async getResumesByStudentId(studentId: number): Promise<Resume[]> {
    return await db.select().from(resumes).where(eq(resumes.studentId, studentId));
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  async updateResumeScore(id: number, adminScore: number): Promise<Resume> {
    const [updated] = await db.update(resumes).set({ adminScore }).where(eq(resumes.id, id)).returning();
    return updated;
  }

  async getAllResumes(): Promise<Resume[]> {
    return await db.select().from(resumes).orderBy(desc(resumes.uploadedAt));
  }

  async createFeedback(feedback: InsertFeedback): Promise<MentorFeedback> {
    const [created] = await db.insert(mentorFeedback).values(feedback).returning();
    return created;
  }

  async getLatestFeedback(studentId: number): Promise<MentorFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(mentorFeedback)
      .where(eq(mentorFeedback.studentId, studentId))
      .orderBy(desc(mentorFeedback.createdAt))
      .limit(1);
    return feedback;
  }

  async getAllFeedbackForStudent(studentId: number): Promise<MentorFeedback[]> {
    return await db
      .select()
      .from(mentorFeedback)
      .where(eq(mentorFeedback.studentId, studentId))
      .orderBy(desc(mentorFeedback.createdAt));
  }

  async countUsersByRole(role: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, role));
    return Number(result.count);
  }

  async getAveragePRS(): Promise<number> {
    const [result] = await db
      .select({ avg: sql<number>`AVG(pr_score)` })
      .from(studentProfiles);
    return Number(result.avg) || 0;
  }

  async getTopStudents(limit: number): Promise<User[]> {
    const topProfiles = await db
      .select()
      .from(studentProfiles)
      .orderBy(desc(studentProfiles.prScore))
      .limit(limit);
    
    const userIds = topProfiles.map(p => p.userId);
    if (userIds.length === 0) return [];

    return await db.select().from(users).where(sql`${users.id} = ANY(${userIds})`);
  }

  async getPRSDistribution(): Promise<{ range: string; count: number }[]> {
    const profiles = await db.select().from(studentProfiles);
    
    const distribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];

    profiles.forEach(p => {
      if (p.prScore <= 20) distribution[0].count++;
      else if (p.prScore <= 40) distribution[1].count++;
      else if (p.prScore <= 60) distribution[2].count++;
      else if (p.prScore <= 80) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  }

  async getCompanyAttemptStats(): Promise<{ name: string; count: number }[]> {
    const results = await db
      .select({
        companyId: studentAttempts.companyId,
        count: sql<number>`count(*)`,
      })
      .from(studentAttempts)
      .groupBy(studentAttempts.companyId);

    const stats = [];
    for (const result of results) {
      const company = await this.getCompanyById(result.companyId);
      if (company) {
        stats.push({
          name: company.name,
          count: Number(result.count),
        });
      }
    }

    return stats;
  }
}

export const storage = new DatabaseStorage();
