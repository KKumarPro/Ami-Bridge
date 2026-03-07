# Ami-Bridge - Student Placement Tracking System

A professional academic-to-industry placement tracking platform built with React, TypeScript, Express.js, PostgreSQL, and modern UI components.

## Overview

Ami-Bridge helps educational institutions track student placement readiness through three role-based dashboards:
- **Student Dashboard**: Practice company interviews, upload resumes, view PRS scores and mentor feedback
- **Mentor Dashboard**: View assigned students, submit performance feedback and ratings
- **Admin Dashboard**: Manage companies, questions, mentor assignments, score resumes, and view analytics

## Key Features

### Placement Readiness Score (PRS)
Automatically calculated using the formula:
```
PRS = (0.5 × coding_score) + (0.3 × mock_score) + (0.2 × resume_score)
```

### Company-Wise Interview System
- Students select a company and answer interview questions
- Automatic scoring based on exact answer matching
- Coding score updates as average of last 5 attempts
- Weak topic identification for improvement suggestions

### Resume Management
- Students upload PDF resumes
- Admins manually score resumes (0-100)
- Resume score automatically updates PRS

### Mentor Feedback System
- Mentors rate student performance (1-5 scale)
- Mock score calculated as average rating × 20
- Performance feedback stored with notes

### Admin Analytics
- Total students, mentors, and companies count
- Average PRS across all students
- Top 5 students by PRS
- PRS distribution graph (using recharts)
- Company attempt frequency chart

## Demo Credentials

### Student
- Email: `demo@ami-bridge.com`
- Password: `12345`

### Mentor
- Email: `mentor@ami-bridge.com`
- Password: `12345`

### Admin
- Email: `admin@ami-bridge.com`
- Password: `12345`

## Technical Stack

### Frontend
- React with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components
- Tailwind CSS for styling
- Recharts for data visualization
- Framer Motion for animations

### Backend
- Node.js with Express
- PostgreSQL database (Drizzle ORM)
- Express-session with HTTP-only cookies
- Bcrypt for password hashing
- Multer for file uploads
- Zod for validation

## Project Structure

```
/client          - React frontend
  /src
    /pages       - Route components
    /components  - Reusable UI components
    /hooks       - Custom React hooks
/server          - Express backend
  db.ts          - Database connection
  storage.ts     - Data access layer
  routes.ts      - API endpoints & authentication
/shared
  schema.ts      - Database schema (Drizzle)
  routes.ts      - API contract (Zod schemas)
/uploads         - Resume storage directory
```

## Database Schema

- **users**: User accounts with role-based access
- **student_profiles**: Student details and scores
- **mentor_assignments**: Mentor-student relationships
- **companies**: Interview companies
- **interview_questions**: Company-specific questions
- **student_attempts**: Interview attempt records
- **attempt_details**: Question-level attempt data
- **resumes**: Student resume records
- **mentor_feedback**: Performance feedback

## Architecture

The application follows a clean MVC-inspired architecture:
- **Models**: Drizzle ORM schemas in `shared/schema.ts`
- **Storage Layer**: Data access interface in `server/storage.ts`
- **Routes**: API endpoints with validation in `server/routes.ts`
- **Frontend**: Role-based dashboards with React components

All business logic resides in the backend. The frontend focuses on presentation and user interaction.

## Recent Changes

- Initial setup with complete database schema
- Authentication system with HTTP-only cookies
- Role-based access control (student, mentor, admin)
- PRS calculation engine
- Company interview system
- Resume upload and scoring
- Mentor feedback system
- Admin analytics dashboard
- Seed data with demo accounts and sample companies

## Development Notes

- The workflow "Start application" runs `npm run dev` which starts both frontend (Vite) and backend (Express) on port 5000
- Database is automatically seeded with demo data on first run
- File uploads are stored in `/uploads` directory
- Sessions are stored in memory (for production, use connect-pg-simple)
