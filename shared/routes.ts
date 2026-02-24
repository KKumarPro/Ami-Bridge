import { z } from 'zod';
import { 
  insertUserSchema, 
  insertCompanySchema, 
  insertQuestionSchema,
  insertFeedbackSchema,
  users,
  companies,
  interviewQuestions,
  mentorFeedback,
  studentAttempts,
  resumes,
  studentProfiles
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  forbidden: z.object({
    message: z.string(),
  })
};

// Types for responses - using z.any() as placeholder since these are type-safe in the backend
const UserResponse = z.any();
const ProfileResponse = z.any();
const CompanyResponse = z.any();
const QuestionResponse = z.any();
const AttemptResponse = z.any();
const ResumeResponse = z.any();
const FeedbackResponse = z.any();

const FullStudentProfileResponse = z.any();

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema.extend({
        branch: z.string().optional(),
        year: z.number().optional()
      }),
      responses: {
        201: UserResponse,
        400: errorSchemas.validation,
      }
    },
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({
        email: z.string().email(),
        password: z.string()
      }),
      responses: {
        200: UserResponse,
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ message: z.string() }),
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: UserResponse,
        401: errorSchemas.unauthorized,
      }
    }
  },
  student: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/student/dashboard' as const,
      responses: {
        200: z.object({
          profile: FullStudentProfileResponse,
          mentor: UserResponse.nullable(),
          recentAttempts: z.array(AttemptResponse),
          latestFeedback: FeedbackResponse.nullable()
        }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    companies: {
      method: 'GET' as const,
      path: '/api/student/companies' as const,
      responses: {
        200: z.array(CompanyResponse),
      }
    },
    questions: {
      method: 'GET' as const,
      path: '/api/student/companies/:companyId/questions' as const,
      responses: {
        200: z.array(z.any()),
        404: errorSchemas.notFound,
      }
    },
    submitInterview: {
      method: 'POST' as const,
      path: '/api/student/interviews/submit' as const,
      input: z.object({
        companyId: z.number(),
        answers: z.array(z.object({
          questionId: z.number(),
          studentAnswer: z.string()
        }))
      }),
      responses: {
        200: z.object({
          attempt: AttemptResponse,
          details: z.array(z.any())
        }),
      }
    },
    uploadResume: {
      method: 'POST' as const,
      path: '/api/student/resume' as const,
      // Input is FormData, so we don't strictly type it here
      responses: {
        201: ResumeResponse,
        400: errorSchemas.validation,
      }
    }
  },
  mentor: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/mentor/dashboard' as const,
      responses: {
        200: z.object({
          students: z.array(FullStudentProfileResponse)
        }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    submitFeedback: {
      method: 'POST' as const,
      path: '/api/mentor/feedback' as const,
      input: insertFeedbackSchema.omit({ mentorId: true }),
      responses: {
        201: FeedbackResponse,
        400: errorSchemas.validation,
      }
    }
  },
  admin: {
    dashboard: {
      method: 'GET' as const,
      path: '/api/admin/dashboard' as const,
      responses: {
        200: z.object({
          totalStudents: z.number(),
          totalMentors: z.number(),
          totalCompanies: z.number(),
          averagePrs: z.number(),
          topStudents: z.array(FullStudentProfileResponse),
          prsDistribution: z.array(z.object({
            range: z.string(),
            count: z.number()
          })),
          companyAttempts: z.array(z.object({
            name: z.string(),
            count: z.number()
          }))
        }),
        401: errorSchemas.unauthorized,
        403: errorSchemas.forbidden,
      }
    },
    createCompany: {
      method: 'POST' as const,
      path: '/api/admin/companies' as const,
      input: insertCompanySchema,
      responses: {
        201: CompanyResponse,
      }
    },
    createQuestion: {
      method: 'POST' as const,
      path: '/api/admin/questions' as const,
      input: insertQuestionSchema,
      responses: {
        201: QuestionResponse,
      }
    },
    assignMentor: {
      method: 'POST' as const,
      path: '/api/admin/assign-mentor' as const,
      input: z.object({
        mentorId: z.number(),
        studentId: z.number()
      }),
      responses: {
        200: z.object({ message: z.string() })
      }
    },
    resumes: {
      method: 'GET' as const,
      path: '/api/admin/resumes' as const,
      responses: {
        200: z.array(z.any()),
      }
    },
    scoreResume: {
      method: 'PATCH' as const,
      path: '/api/admin/resumes/:id/score' as const,
      input: z.object({ adminScore: z.number().min(0).max(100) }),
      responses: {
        200: ResumeResponse,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
