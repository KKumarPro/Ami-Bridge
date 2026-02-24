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
    secret: process.env.SESSION_SECRET || 'skillbridge-secret-key-change-in-production',
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
      if (existing) {
        return res.status(400).json({ message: 'Email already exists', field: 'email' });
      }

      const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);
      const user = await storage.createUser({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role
      });

      if (input.role === 'student' && input.branch && input.year) {
        await storage.createStudentProfile({
          userId: user.id,
          branch: input.branch,
          year: input.year
        });
      }

      req.session.userId = user.id;
      res.status(201).json({ ...user, password: undefined });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.')
        });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      
      const user = await storage.getUserByEmail(input.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(input.password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      req.session.userId = user.id;
      res.json({ ...user, password: undefined });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.auth.logout.path, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get(api.auth.me.path, requireAuth, async (req, res) => {
    const user = await storage.getUserById(req.session.userId!);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    res.json({ ...user, password: undefined });
  });

  // ===== STUDENT ROUTES =====
  app.get(api.student.dashboard.path, requireAuth, requireRole('student'), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUserById(userId);
      const profile = await storage.getStudentProfile(userId);
      const mentor = await storage.getMentorForStudent(userId);
      const recentAttempts = await storage.getRecentAttempts(userId, 3);
      const latestFeedback = await storage.getLatestFeedback(userId);

      res.json({
        profile: { ...user, password: undefined, profile },
        mentor: mentor ? { ...mentor, password: undefined } : null,
        recentAttempts,
        latestFeedback
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(api.student.companies.path, requireAuth, requireRole('student'), async (req, res) => {
    const companies = await storage.getAllCompanies();
    res.json(companies);
  });

  app.get(api.student.questions.path, requireAuth, requireRole('student'), async (req, res) => {
    const companyId = Number(req.params.companyId);
    const questions = await storage.getQuestionsForCompany(companyId);
    
    // Remove correct answers before sending to student
    const sanitized = questions.map(q => {
      const { correctAnswer, ...rest } = q;
      return rest;
    });
    
    res.json(sanitized);
  });

  app.post(api.student.submitInterview.path, requireAuth, requireRole('student'), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const input = api.student.submitInterview.input.parse(req.body);

      const questions = await storage.getQuestionsForCompany(input.companyId);
      let totalScore = 0;
      let maxScore = 0;

      const attempt = await storage.createAttempt({
        studentId: userId,
        companyId: input.companyId,
        totalScore: 0,
        maxScore: 0
      });

      const details = [];
      for (const answer of input.answers) {
        const question = questions.find(q => q.id === answer.questionId);
        if (!question) continue;

        maxScore += question.marks;
        const correct = answer.studentAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();
        const scoreAwarded = correct ? question.marks : 0;
        totalScore += scoreAwarded;

        const detail = await storage.createAttemptDetail({
          attemptId: attempt.id,
          questionId: answer.questionId,
          studentAnswer: answer.studentAnswer,
          scoreAwarded
        });
        details.push(detail);
      }

      // Update attempt with final scores
      await storage.createAttempt({
        ...attempt,
        totalScore,
        maxScore
      });

      // Update coding score (average of last 5 attempts)
      const lastFive = await storage.getLastFiveAttempts(userId);
      const avgScore = lastFive.length > 0 
        ? Math.round(lastFive.reduce((sum, a) => sum + (a.totalScore / a.maxScore) * 100, 0) / lastFive.length)
        : 0;
      
      await storage.updateStudentProfile(userId, { codingScore: avgScore });
      await recalculatePRS(userId);

      res.json({ attempt: { ...attempt, totalScore, maxScore }, details });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.student.uploadResume.path, requireAuth, requireRole('student'), upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const userId = req.session.userId!;
      const resume = await storage.createResume({
        studentId: userId,
        filePath: req.file.path
      });

      res.status(201).json(resume);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ===== MENTOR ROUTES =====
  app.get(api.mentor.dashboard.path, requireAuth, requireRole('mentor'), async (req, res) => {
    try {
      const mentorId = req.session.userId!;
      const studentUsers = await storage.getStudentsForMentor(mentorId);
      
      const students = await Promise.all(
        studentUsers.map(async (user) => {
          const profile = await storage.getStudentProfile(user.id);
          return { ...user, password: undefined, profile };
        })
      );

      res.json({ students });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.mentor.submitFeedback.path, requireAuth, requireRole('mentor'), async (req, res) => {
    try {
      const mentorId = req.session.userId!;
      const input = api.mentor.submitFeedback.input.parse(req.body);

      const feedback = await storage.createFeedback({
        mentorId,
        studentId: input.studentId,
        notes: input.notes,
        performanceRating: input.performanceRating
      });

      // Update mock score (average of all performance ratings * 20)
      const allFeedback = await storage.getAllFeedbackForStudent(input.studentId);
      const avgRating = allFeedback.reduce((sum, f) => sum + f.performanceRating, 0) / allFeedback.length;
      const mockScore = Math.round(avgRating * 20);

      await storage.updateStudentProfile(input.studentId, { mockScore });
      await recalculatePRS(input.studentId);

      res.status(201).json(feedback);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // ===== ADMIN ROUTES =====
  app.get(api.admin.dashboard.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const totalStudents = await storage.countUsersByRole('student');
      const totalMentors = await storage.countUsersByRole('mentor');
      const totalCompanies = (await storage.getAllCompanies()).length;
      const averagePrs = await storage.getAveragePRS();
      
      const topStudentUsers = await storage.getTopStudents(5);
      const topStudents = await Promise.all(
        topStudentUsers.map(async (user) => {
          const profile = await storage.getStudentProfile(user.id);
          return { ...user, password: undefined, profile };
        })
      );

      const prsDistribution = await storage.getPRSDistribution();
      const companyAttempts = await storage.getCompanyAttemptStats();

      res.json({
        totalStudents,
        totalMentors,
        totalCompanies,
        averagePrs: Math.round(averagePrs),
        topStudents,
        prsDistribution,
        companyAttempts
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.admin.createCompany.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const input = api.admin.createCompany.input.parse(req.body);
      const company = await storage.createCompany(input);
      res.status(201).json(company);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.admin.createQuestion.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const input = api.admin.createQuestion.input.parse(req.body);
      const question = await storage.createQuestion(input);
      res.status(201).json(question);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post(api.admin.assignMentor.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const input = api.admin.assignMentor.input.parse(req.body);
      await storage.assignMentor(input.mentorId, input.studentId);
      res.json({ message: 'Mentor assigned successfully' });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get(api.admin.resumes.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const resumes = await storage.getAllResumes();
      const resumesWithStudent = await Promise.all(
        resumes.map(async (resume) => {
          const student = await storage.getUserById(resume.studentId);
          return { ...resume, student: { ...student, password: undefined } };
        })
      );
      res.json(resumesWithStudent);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.patch(api.admin.scoreResume.path, requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const id = Number(req.params.id);
      const input = api.admin.scoreResume.input.parse(req.body);

      const resume = await storage.getResumeById(id);
      if (!resume) {
        return res.status(404).json({ message: 'Resume not found' });
      }

      const updated = await storage.updateResumeScore(id, input.adminScore);
      
      // Update student's resume score
      await storage.updateStudentProfile(resume.studentId, { resumeScore: input.adminScore });
      await recalculatePRS(resume.studentId);

      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      console.error(err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Seed database with demo data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingUsers = await storage.getAllStudents();
    if (existingUsers.length > 0) return;

    console.log('Seeding database with demo data...');

    // Create admin
    const admin = await storage.createUser({
      name: 'Admin User',
      email: 'admin@skillbridge.com',
      password: await bcrypt.hash('12345', SALT_ROUNDS),
      role: 'admin'
    });

    // Create mentor
    const mentor = await storage.createUser({
      name: 'Dr. Sarah Johnson',
      email: 'mentor@skillbridge.com',
      password: await bcrypt.hash('12345', SALT_ROUNDS),
      role: 'mentor'
    });

    // Create students
    const student1 = await storage.createUser({
      name: 'Demo Student',
      email: 'demo@skillbridge.com',
      password: await bcrypt.hash('12345', SALT_ROUNDS),
      role: 'student'
    });

    const student2 = await storage.createUser({
      name: 'Alex Kumar',
      email: 'alex@student.com',
      password: await bcrypt.hash('12345', SALT_ROUNDS),
      role: 'student'
    });

    const student3 = await storage.createUser({
      name: 'Maria Garcia',
      email: 'maria@student.com',
      password: await bcrypt.hash('12345', SALT_ROUNDS),
      role: 'student'
    });

    // Create student profiles
    await storage.createStudentProfile({
      userId: student1.id,
      branch: 'Computer Science',
      year: 3
    });

    await storage.createStudentProfile({
      userId: student2.id,
      branch: 'Information Technology',
      year: 4
    });

    await storage.createStudentProfile({
      userId: student3.id,
      branch: 'Computer Science',
      year: 2
    });

    // Assign mentor to students
    await storage.assignMentor(mentor.id, student1.id);
    await storage.assignMentor(mentor.id, student2.id);
    await storage.assignMentor(mentor.id, student3.id);

    // Create companies
    const google = await storage.createCompany({
      name: 'Google',
      description: 'Leading tech company specializing in search, cloud computing, and AI',
      difficultyLevel: 'hard'
    });

    const microsoft = await storage.createCompany({
      name: 'Microsoft',
      description: 'Global technology company creating software, hardware, and cloud services',
      difficultyLevel: 'medium'
    });

    // Create interview questions for Google
    await storage.createQuestion({
      companyId: google.id,
      questionText: 'What is the time complexity of binary search?',
      correctAnswer: 'O(log n)',
      topic: 'Algorithms',
      marks: 10
    });

    await storage.createQuestion({
      companyId: google.id,
      questionText: 'Explain the difference between stack and heap memory.',
      correctAnswer: 'Stack is used for static memory allocation and heap for dynamic memory allocation',
      topic: 'Memory Management',
      marks: 15
    });

    await storage.createQuestion({
      companyId: google.id,
      questionText: 'What is polymorphism in OOP?',
      correctAnswer: 'The ability of objects to take on multiple forms',
      topic: 'Object-Oriented Programming',
      marks: 10
    });

    // Create interview questions for Microsoft
    await storage.createQuestion({
      companyId: microsoft.id,
      questionText: 'What is a RESTful API?',
      correctAnswer: 'An architectural style for building web services using HTTP methods',
      topic: 'Web Development',
      marks: 10
    });

    await storage.createQuestion({
      companyId: microsoft.id,
      questionText: 'Explain the SOLID principles.',
      correctAnswer: 'Five design principles for writing maintainable software',
      topic: 'Software Design',
      marks: 15
    });

    await storage.createQuestion({
      companyId: microsoft.id,
      questionText: 'What is a database index?',
      correctAnswer: 'A data structure that improves the speed of data retrieval operations',
      topic: 'Databases',
      marks: 10
    });

    // Add some feedback for demo student
    await storage.createFeedback({
      mentorId: mentor.id,
      studentId: student1.id,
      notes: 'Great progress on problem-solving skills. Keep practicing data structures.',
      performanceRating: 4
    });

    // Update mock score for demo student
    await storage.updateStudentProfile(student1.id, { mockScore: 80 });
    await recalculatePRS(student1.id);

    console.log('Database seeded successfully!');
  } catch (err) {
    console.error('Error seeding database:', err);
  }
}
