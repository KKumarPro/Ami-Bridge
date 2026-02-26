import { useStudentDashboard, useUploadResume } from "@/hooks/use-student";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Upload, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export function StudentResume() {
  const { data: dashboardData } = useStudentDashboard();
  const uploadResume = useUploadResume();
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    try {
      await uploadResume.mutateAsync(file);
      setFile(null);
    } catch (err) {
      // Error handled by hook
    }
  };

  const profile = dashboardData?.profile?.profile;
  const hasResume = profile?.resumeScore !== null && profile?.resumeScore !== 0;

  return (
    <ProtectedLayout allowedRoles={["student"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">My Resume</h1>
          <p className="text-muted-foreground mt-1">Upload and manage your professional resume for placement.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Upload Resume</CardTitle>
              <CardDescription>Please upload your resume in PDF format (max 10MB).</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="resume">Resume File (PDF)</Label>
                  <Input 
                    id="resume" 
                    type="file" 
                    accept=".pdf" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={!file || uploadResume.isPending}
                  className="w-full sm:w-auto hover-elevate shadow-sm"
                >
                  {uploadResume.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Upload Resume
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Resume Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center text-center p-6 bg-muted/30 rounded-2xl border-2 border-dashed">
                {hasResume ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">Resume Scored!</h3>
                    <p className="text-sm text-muted-foreground mb-4">Your resume has been reviewed by the system.</p>
                    <div className="w-full bg-background rounded-xl p-4 border">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Strength Score</p>
                      <p className="text-3xl font-black text-primary">{profile?.resumeScore}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-xl mb-1">No Resume Yet</h3>
                    <p className="text-sm text-muted-foreground">Upload your resume to get it analyzed and scored.</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
