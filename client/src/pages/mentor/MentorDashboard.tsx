import { useState } from "react";
import { useMentorDashboard } from "@/hooks/use-mentor";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, TrendingUp, Users, Award } from "lucide-react";

export function MentorDashboard() {
  const { data, isLoading } = useMentorDashboard();
  
  const topScorer = data?.students && data.students.length > 0 
    ? data.students.reduce((prev: any, current: any) => 
        ((prev.profile?.prScore || 0) > (current.profile?.prScore || 0)) ? prev : current
      )
    : null;

  if (isLoading) return <ProtectedLayout><Skeleton className="h-screen w-full" /></ProtectedLayout>;

  return (
    <ProtectedLayout allowedRoles={["mentor"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Mentor Insights</h1>
          <p className="text-muted-foreground mt-1">Overview of your assigned student performance and key metrics.</p>
        </div>

        {topScorer && (
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-white shadow-xl border-none overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between relative">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Placement Readiness Score</p>
                <h2 className="text-4xl font-black font-display mb-1">{topScorer.name}</h2>
                <p className="text-white/60 font-medium">{topScorer.profile?.branch || "General Engineering"}</p>
              </div>
              <div className="text-right relative z-10">
                <p className="text-6xl font-black">{topScorer.profile?.prScore || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80">Placement Readiness Score</p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Total Mentees</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">{data?.students?.length || 0}</div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Active students in pool</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Avg. PRS Score</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-primary">
                {data?.students?.length 
                  ? Math.round(data.students.reduce((acc: number, s: any) => acc + (s.profile?.prScore || 0), 0) / data.students.length)
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Cohort average performance</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <FileText className="w-4 h-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-wider">Resumes Scored</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-foreground">
                {data?.students?.filter((s: any) => (s.profile?.resumeScore || 0) > 0).length || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Completed resume reviews</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
