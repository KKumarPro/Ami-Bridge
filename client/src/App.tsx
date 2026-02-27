import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Import Pages
import { HomePage } from "@/pages/HomePage";
import { AuthPage } from "@/pages/auth/AuthPage";
import { StudentDashboard } from "@/pages/student/StudentDashboard";
import { PracticeInterviews } from "@/pages/student/PracticeInterviews";
import { CodingChallenges } from "@/pages/student/CodingChallenges";
import { StudentResume } from "@/pages/student/StudentResume";
import { InterviewWizard } from "@/pages/student/InterviewWizard";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ManageCompanies } from "@/pages/admin/ManageCompanies";
import { ReviewResumes } from "@/pages/admin/ReviewResumes";
import { MentorDashboard } from "@/pages/mentor/MentorDashboard";
import { MyStudents } from "@/pages/mentor/MyStudents";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/practice" component={PracticeInterviews} />
      <Route path="/student/coding" component={CodingChallenges} />
      <Route path="/student/interview/:id" component={InterviewWizard} />
      <Route path="/student/resume" component={StudentResume} />

      {/* Mentor Routes */}
      <Route path="/mentor/dashboard" component={MentorDashboard} />
      <Route path="/mentor/students" component={MyStudents} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/companies" component={ManageCompanies} />
      <Route path="/admin/resumes" component={ReviewResumes} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
