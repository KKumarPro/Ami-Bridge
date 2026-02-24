import { useStudentDashboard } from "@/hooks/use-student";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Code, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function StudentDashboard() {
  const { data, isLoading } = useStudentDashboard();

  if (isLoading) {
    return (
      <ProtectedLayout allowedRoles={["student"]}>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
          </div>
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </ProtectedLayout>
    );
  }

  const profile = data?.profile?.profile;
  const prsColor = profile?.prScore > 75 ? "bg-green-500" : profile?.prScore > 50 ? "bg-yellow-500" : "bg-destructive";

  return (
    <ProtectedLayout allowedRoles={["student"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your progress and placement readiness.</p>
        </div>

        {/* Hero Stat */}
        <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 shadow-lg">
          <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
            <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/50" />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="8" 
                  strokeDasharray={`${(profile?.prScore || 0) * 2.827} 282.7`}
                  className={`${profile?.prScore > 75 ? 'text-green-500' : profile?.prScore > 50 ? 'text-yellow-500' : 'text-destructive'} transition-all duration-1000`} 
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-bold font-display">{profile?.prScore || 0}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">PRS Score</span>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold font-display mb-2">Your Placement Readiness</h2>
              <p className="text-muted-foreground mb-4">
                Your score is calculated based on coding challenges, mock interviews, and resume reviews. Keep practicing to boost your score!
              </p>
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 bg-background/50 px-3 py-1.5 rounded-full border text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="font-medium">Top 20% of class</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub-metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard 
            title="Coding Ability" 
            value={profile?.codingScore || 0} 
            icon={<Code className="w-5 h-5 text-primary" />} 
          />
          <MetricCard 
            title="Mock Interviews" 
            value={profile?.mockScore || 0} 
            icon={<CheckCircle2 className="w-5 h-5 text-secondary" />} 
          />
          <MetricCard 
            title="Resume Strength" 
            value={profile?.resumeScore || 0} 
            icon={<FileText className="w-5 h-5 text-accent-foreground" />} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Recent Attempts</CardTitle>
              <CardDescription>Your latest mock interview sessions.</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.recentAttempts?.length > 0 ? (
                <div className="space-y-4">
                  {data.recentAttempts.map((attempt: any) => (
                    <div key={attempt.id} className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold">{attempt.companyId === 1 ? "Google" : "Microsoft"} Mock</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(attempt.attemptedAt), "MMM d, yyyy")}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{attempt.totalScore}/{attempt.maxScore}</p>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No attempts yet. Start a practice interview!</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Mentor Feedback</CardTitle>
              <CardDescription>Latest insights from your assigned mentor.</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.latestFeedback ? (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                  <div className="flex items-center gap-1 mb-3 text-yellow-500">
                    {Array.from({length: 5}).map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < data.latestFeedback.performanceRating ? 'fill-current' : 'fill-muted text-muted'}`} viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed italic">"{data.latestFeedback.notes}"</p>
                  <p className="text-sm text-muted-foreground mt-4 text-right">— {data.mentor?.name || "Your Mentor"}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  <p>No feedback received yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="shadow-sm overflow-hidden group hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          <span className="font-display font-bold text-3xl">{value}%</span>
        </div>
        <p className="font-semibold text-foreground mb-2">{title}</p>
        <Progress value={value} className="h-2" />
      </CardContent>
    </Card>
  );
}
