import { useResumes, useScoreResume } from "@/hooks/use-admin";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Loader2, Search, Filter } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReviewResumes() {
  const { data: resumes, isLoading } = useResumes();
  const scoreResume = useScoreResume();
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("all");
  const [selectedResume, setSelectedResume] = useState<number | null>(null);
  const [score, setScore] = useState("");

  const handleScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResume) return;
    await scoreResume.mutateAsync({ id: selectedResume, data: { adminScore: Number(score) } });
    setSelectedResume(null);
    setScore("");
  };

  const branches = Array.from(new Set(resumes?.map((r: any) => r.student.profile?.branch).filter(Boolean) || []));

  const filteredResumes = resumes?.filter((r: any) => {
    const matchesSearch = r.student.name.toLowerCase().includes(search.toLowerCase()) ||
                         r.student.email.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === "all" || r.student.profile?.branch === branchFilter;
    return matchesSearch && matchesBranch;
  });

  return (
    <ProtectedLayout allowedRoles={["admin"]}>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Review Resumes</h1>
            <p className="text-muted-foreground mt-1">Review and score resumes for registered students.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-10" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b: any) => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResumes?.map((resume: any) => (
            <Card key={resume.id} className="shadow-sm border-border/50 overflow-hidden">
              <div className="h-2 bg-primary/20" />
              <CardHeader>
                <CardTitle className="text-lg">{resume.student.name}</CardTitle>
                <CardDescription>
                  <span className="font-medium text-primary">{resume.student.profile?.branch || "N/A"}</span>
                  <br />
                  {resume.student.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium truncate max-w-[120px]">Resume.pdf</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                    <a href={`/${resume.filePath}`} target="_blank" rel="noreferrer">
                      <Download className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Score</p>
                    <p className="text-2xl font-black text-primary">{resume.adminScore ?? "—"}<span className="text-xs text-muted-foreground font-normal">%</span></p>
                  </div>
                  <Dialog open={selectedResume === resume.id} onOpenChange={(open) => { if(!open) setSelectedResume(null); }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedResume(resume.id)}>
                        Score
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Score Resume: {resume.student.name}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleScore} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Score (0-100)</Label>
                          <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            required 
                            value={score} 
                            onChange={e => setScore(e.target.value)} 
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={scoreResume.isPending}>
                          {scoreResume.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Save Score
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
