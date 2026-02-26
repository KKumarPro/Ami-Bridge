import { useState } from "react";
import { useMentorDashboard, useSubmitFeedback } from "@/hooks/use-mentor";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MessageSquare, Star, FileText } from "lucide-react";

export function MentorDashboard() {
  const { data, isLoading } = useMentorDashboard();
  const submitFeedback = useSubmitFeedback();
  
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState([3]);
  const [isOpen, setIsOpen] = useState(false);

  const topScorer = data?.students?.reduce((prev: any, current: any) => 
    ((prev.profile?.prScore || 0) > (current.profile?.prScore || 0)) ? prev : current
  , data?.students?.[0]);

  const handleFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    await submitFeedback.mutateAsync({ studentId: selectedStudent, notes, performanceRating: rating[0] });
    setIsOpen(false);
    setNotes("");
    setRating([3]);
  };

  if (isLoading) return <ProtectedLayout><Skeleton className="h-screen w-full" /></ProtectedLayout>;

  return (
    <ProtectedLayout allowedRoles={["mentor"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Mentor Dashboard</h1>
          <p className="text-muted-foreground mt-1">Review your assigned students and provide feedback.</p>
        </div>

        {topScorer && (
          <Card className="bg-gradient-to-br from-primary to-primary-foreground text-white shadow-xl border-none overflow-hidden">
            <CardContent className="p-8 flex items-center justify-between relative">
              <div className="relative z-10">
                <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs mb-2">Top Performer</p>
                <h2 className="text-4xl font-black font-display mb-1">{topScorer.name}</h2>
                <p className="text-primary-foreground/60">{topScorer.profile?.branch || "General"}</p>
              </div>
              <div className="text-right relative z-10">
                <p className="text-5xl font-black">{topScorer.profile?.prScore || 0}</p>
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/80">Total PSR Score</p>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
            </CardContent>
          </Card>
        )}

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Assigned Students</CardTitle>
            <CardDescription>Review and provide feedback for your students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data?.students?.map((student: any) => (
                <Card key={student.id} className="border-border/50 bg-muted/20 flex flex-col">
                  <CardContent className="p-6 flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{student.name}</h3>
                        <p className="text-sm text-muted-foreground">{student.profile?.branch || "N/A"} - Year {student.profile?.year || "N/A"}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-background rounded-lg p-3 border text-center">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">PSR Score</p>
                        <p className="text-xl font-bold text-primary">{student.profile?.prScore || 0}</p>
                      </div>
                      <div className="bg-background rounded-lg p-3 border text-center">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">Resume</p>
                        <p className="text-xl font-bold">{student.profile?.resumeScore || "—"}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Dialog open={isOpen && selectedStudent === student.id} onOpenChange={(open) => { setIsOpen(open); if(open) setSelectedStudent(student.id); }}>
                        <DialogTrigger asChild>
                          <Button className="w-full hover-elevate shadow-sm" variant="outline">
                            <MessageSquare className="w-4 h-4 mr-2" /> Feedback
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Feedback for {student.name}</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleFeedback} className="space-y-6 pt-4">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center">
                                <Label>Performance Rating</Label>
                                <div className="flex items-center text-yellow-500 font-bold">
                                  {rating[0]} <Star className="w-4 h-4 ml-1 fill-current" />
                                </div>
                              </div>
                              <Slider value={rating} onValueChange={setRating} max={5} min={1} step={1} className="py-2" />
                            </div>
                            
                            <div className="space-y-2">
                              <Label>Detailed Notes</Label>
                              <Textarea 
                                required 
                                value={notes} 
                                onChange={e => setNotes(e.target.value)} 
                                placeholder="Provide actionable advice..."
                                className="h-32"
                              />
                            </div>
                            
                            <Button type="submit" className="w-full" disabled={submitFeedback.isPending}>
                              {submitFeedback.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              Submit Feedback
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="ghost" size="sm" asChild className="w-full justify-start text-xs text-primary hover:text-primary hover:bg-primary/5">
                        <a href={student.profile?.resumePath ? `/${student.profile.resumePath}` : "#"} target="_blank" rel="noreferrer">
                          <FileText className="w-3 h-3 mr-2" /> View Resume
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {(!data?.students || data.students.length === 0) && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p>You have no assigned students yet.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
