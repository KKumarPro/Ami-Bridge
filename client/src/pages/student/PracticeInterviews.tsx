import { useState } from "react";
import { Link } from "wouter";
import { useCompanies } from "@/hooks/use-student";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PracticeInterviews() {
  const { data: companies, isLoading } = useCompanies();

  return (
    <ProtectedLayout allowedRoles={["student"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Practice Interviews</h1>
          <p className="text-muted-foreground mt-1">Select a company to start a mock interview tailored to their patterns.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies?.map((company: any) => (
              <Card key={company.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow border-border/50 group">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <Badge variant={company.difficultyLevel === 'hard' ? 'destructive' : company.difficultyLevel === 'medium' ? 'default' : 'secondary'} className="capitalize">
                      {company.difficultyLevel}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-display">{company.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{company.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-sm font-medium text-muted-foreground bg-muted/50 p-3 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Interview simulation ready
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full hover-elevate active-elevate-2 shadow-md shadow-primary/20" asChild>
                    <Link href={`/student/interview/${company.id}`}>
                      Start Mock Interview <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
            {(!companies || companies.length === 0) && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <p>No companies available for practice yet. Contact Admin.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
