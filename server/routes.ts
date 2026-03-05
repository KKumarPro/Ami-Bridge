import type { Express } from "express";
  import type { Server } from "http";
  import { storage } from "./storage";
  import { api } from "@shared/routes";
  import { z } from "zod";
  import bcrypt from "bcrypt";
  import session from "express-session";
  import multer from "multer";
  import path from "path";
  import fs from "fs";

  const SALT_ROUNDS = 10;

  // Configure multer for resume uploads
  const uploadDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
      }
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
  });

  // Extend Express session type
  declare module 'express-session' {
    interface SessionData {
      userId: number;
    }
  }

  // PRS Calculation
  async function recalculatePRS(studentId: number) {
    const profile = await storage.getStudentProfile(studentId);
    if (!profile) return;

    const prs = Math.round(
      (0.5 * profile.codingScore) +
      (0.3 * profile.mockScore) +
      (0.2 * profile.resumeScore)
    );

    await storage.updateStudentProfile(studentId, { prScore: prs });
  }

  export async function registerRoutes(
    httpServer: Server,
    app: Express
  ): Promise<Server> {
    // Session middleware
    app.use(session({
      secret: process.env.SESSION_SECRET || 'ami-bridge-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Auth middleware
    const requireAuth = (req: any, res: any, next: any) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      next();
    };

    const requireRole = (role: string) => {
      return async (req: any, res: any, next: any) => {
        const user = await storage.getUserById(req.session.userId);
        if (!user || user.role !== role) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        next();
      };
    };

    // ===== AUTH ROUTES =====
    app.post(api.auth.register.path, async (req, res) => {
      try {
        const input = api.auth.register.input.parse(req.body);
        const existing = await storage.getUserByEmail(input.email);
        if (existing) return res.status(400).json({ message: 'Email already exists', field: 'email' });
        const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
        const user = await storage.createUser({ name: input.name, email: input.email, password: hashedPassword, role: input.role });
        if (input.role === 'student' && input.branch && input.year) {
          await storage.createStudentProfile({ userId: user.id, branch: input.branch, year: input.year });
          const mentors = await storage.getAllMentors();
          if (mentors.length > 0) await storage.assignMentor(mentors[0].id, user.id);
        }
        req.session.userId = user.id;
        res.status(201).json({ ...user, password: undefined });
      } catch (err) { res.status(500).json({ message: 'Error' }); }
    });

    app.post(api.auth.login.path, async (req, res) => {
      try {
        const input = api.auth.login.input.parse(req.body);
        const user = await storage.getUserByEmail(input.email);
        if (!user || !await bcrypt.compare(input.password, user.password) || user.role !== req.body.role) {
          return res.status(401).json({ message: 'Invalid credentials' });
        }
        req.session.userId = user.id;
        res.json({ ...user, password: undefined });
      } catch (err) { res.status(500).json({ message: 'Error' }); }
    });

    app.post(api.auth.logout.path, (req, res) => {
      req.session.destroy(() => res.json({ message: 'Logged out' }));
    });

    app.get(api.auth.me.path, requireAuth, async (req, res) => {
      const user = await storage.getUserById(req.session.userId!);
      res.json({ ...user, password: undefined });
    });

    // ===== STUDENT ROUTES =====
    app.get(api.student.dashboard.path, requireAuth, requireRole('student'), async (req, res) => {
      const userId = req.session.userId!;
      const user = await storage.getUserById(userId);
      const profile = await storage.getStudentProfile(userId);
      const mentor = await storage.getMentorForStudent(userId);
      const recentAttempts = await storage.getRecentAttempts(userId, 3);
      const latestFeedback = await storage.getLatestFeedback(userId);
      res.json({ profile: { ...user, password: undefined, profile }, mentor, recentAttempts, latestFeedback });
    });

    app.get(api.student.companies.path, requireAuth, requireRole('student'), async (req, res) => {
      res.json(await storage.getAllCompanies());
    });

    app.get(api.student.questions.path, requireAuth, requireRole('student'), async (req, res) => {
      const questions = await storage.getQuestionsForCompany(Number(req.params.companyId));
      res.json(questions.map(({ correctAnswer, ...rest }) => rest));
    });

    app.post(api.student.submitInterview.path, requireAuth, requireRole('student'), async (req, res) => {
      try {
        const userId = req.session.userId!;
        const input = api.student.submitInterview.input.parse(req.body);
        const questions = await storage.getQuestionsForCompany(input.companyId);
        let totalScore = 0, maxScore = 0;
        const attempt = await storage.createAttempt({ studentId: userId, companyId: input.companyId, totalScore: 0, maxScore: 0 });
        for (const answer of input.answers) {
          const q = questions.find(question => question.id === answer.questionId);
          if (!q) continue;
          maxScore += q.marks;
          const score = answer.studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase() ? q.marks : 0;
          totalScore += score;
          await storage.createAttemptDetail({ attemptId: attempt.id, questionId: q.id, studentAnswer: answer.studentAnswer, scoreAwarded: score });
        }
        await storage.updateAttempt(attempt.id, { totalScore, maxScore });
        const lastFive = (await storage.getLastFiveAttempts(userId)).filter(a => a.maxScore > 0);
        const codingScore = lastFive.length ? Math.round(lastFive.reduce((s, a) => s + (a.totalScore / a.maxScore) * 100, 0) / lastFive.length) : 0;
        await storage.updateStudentProfile(userId, { codingScore });
        await recalculatePRS(userId);
        res.json({ attempt: { ...attempt, totalScore, maxScore } });
      } catch (err) { res.status(500).json({ message: 'Error' }); }
    });

    app.post(api.student.uploadResume.path, requireAuth, requireRole('student'), upload.single('resume'), async (req, res) => {
      const userId = req.session.userId!;
      const score = Math.floor(Math.random() * 35) + 60;
      const resume = await storage.createResume({ studentId: userId, filePath: req.file!.path, adminScore: score });
      await storage.updateStudentProfile(userId, { resumeScore: score });
      await recalculatePRS(userId);
      res.status(201).json(resume);
    });

    // ===== MENTOR ROUTES =====
    app.get(api.mentor.dashboard.path, requireAuth, requireRole('mentor'), async (req, res) => {
      const students = await Promise.all((await storage.getStudentsForMentor(req.session.userId!)).map(async u => ({ ...u, password: undefined, profile: await storage.getStudentProfile(u.id) })));
      res.json({ students });
    });

    app.post(api.mentor.submitFeedback.path, requireAuth, requireRole('mentor'), async (req, res) => {
      const input = api.mentor.submitFeedback.input.parse(req.body);
      await storage.createFeedback({ mentorId: req.session.userId!, studentId: input.studentId, notes: input.notes, performanceRating: input.performanceRating });
      const allFeedback = await storage.getAllFeedbackForStudent(input.studentId);
      const mockScore = allFeedback.length ? Math.round((allFeedback.reduce((s, f) => s + f.performanceRating, 0) / allFeedback.length) * 20) : 0;
      await storage.updateStudentProfile(input.studentId, { mockScore });
      await recalculatePRS(input.studentId);
      res.status(201).json({ message: 'Feedback submitted' });
    });

    // ===== ADMIN ROUTES =====
    app.get(api.admin.dashboard.path, requireAuth, requireRole('admin'), async (req, res) => {
      res.json({
        totalStudents: await storage.countUsersByRole('student'),
        totalMentors: await storage.countUsersByRole('mentor'),
        totalCompanies: (await storage.getAllCompanies()).length,
        averagePrs: Math.round(await storage.getAveragePRS()),
        topStudents: await Promise.all((await storage.getTopStudents(5)).map(async u => ({ ...u, password: undefined, profile: await storage.getStudentProfile(u.id) }))),
        prsDistribution: await storage.getPRSDistribution(),
        companyAttempts: await storage.getCompanyAttemptStats()
      });
    });

    app.get(api.admin.companies.path, requireAuth, requireRole('admin'), async (req, res) => {
      res.json(await storage.getAllCompanies());
    });

    app.post(api.admin.createCompany.path, requireAuth, requireRole('admin'), async (req, res) => {
      const company = await storage.createCompany(api.admin.createCompany.input.parse(req.body));
      await storage.createQuestion({ companyId: company.id, questionText: 'Define System Design.', correctAnswer: 'Architecture design.', topic: 'System Design', marks: 10 });
      res.status(201).json(company);
    });

    app.get(api.admin.resumes.path, requireAuth, requireRole('admin'), async (req, res) => {
      const resumes = await storage.getAllResumes();
      res.json(await Promise.all(resumes.map(async r => ({ ...r, student: { ...(await storage.getUserById(r.studentId)), password: undefined, profile: await storage.getStudentProfile(r.studentId) } }))));
    });

    app.patch(api.admin.scoreResume.path, requireAuth, requireRole('admin'), async (req, res) => {
      const id = Number(req.params.id);
      const { adminScore } = api.admin.scoreResume.input.parse(req.body);
      const resume = await storage.getResumeById(id);
      if (!resume) return res.status(404).json({ message: 'Not found' });
      const updated = await storage.updateResumeScore(id, adminScore);
      await storage.updateStudentProfile(resume.studentId, { resumeScore: adminScore });
      await recalculatePRS(resume.studentId);
      res.json(updated);
    });

    // Seed check
    const studentCount = await storage.countUsersByRole('student');
    if (studentCount === 0) await seedDatabase();

    return httpServer;
  }

  async function seedDatabase() {
    try {
      const SALT = 10;
      const admin = await storage.getUserByEmail('admin@ami-bridge.com') || await storage.createUser({ name: 'Admin', email: 'admin@ami-bridge.com', password: await bcrypt.hash('12345', SALT), role: 'admin' });
      const mentor = await storage.getUserByEmail('mentor@ami-bridge.com') || await storage.createUser({ name: 'Mentor', email: 'mentor@ami-bridge.com', password: await bcrypt.hash('12345', SALT), role: 'mentor' });
      const students = [
        { name: 'Karan', email: 'demo@ami-bridge.com', branch: 'CSE' },
        { name: 'Alex Kumar', email: 'alex@ami-bridge.com', branch: 'Electronics' }
      ];
      for (const s of students) {
        if (!await storage.getUserByEmail(s.email)) {
          const u = await storage.createUser({ name: s.name, email: s.email, password: await bcrypt.hash('12345', SALT), role: 'student' });
          await storage.createStudentProfile({ userId: u.id, branch: s.branch, year: 3, codingScore: 80, mockScore: 75, resumeScore: 85 });
          await storage.assignMentor(mentor.id, u.id);
          await storage.createResume({ studentId: u.id, filePath: 'uploads/resume.pdf', adminScore: 85 });
          await recalculatePRS(u.id);
        }
      }
      if ((await storage.getAllCompanies()).length === 0) {
        const c = await storage.createCompany({ name: 'Google', description: 'Search', difficultyLevel: 'hard' });
        await storage.createQuestion({ companyId: c.id, questionText: 'Big O?', correctAnswer: 'Complexity', topic: 'Algorithms', marks: 10 });
      }
    } catch (e) { console.error('Seed failed', e); }
  }
  