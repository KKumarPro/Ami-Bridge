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
import { Loader2, MessageSquare, Star, FileText, UserCircle } from "lucide-react";

export function MyStudents() {
  const { data, isLoading } = useMentorDashboard();
  const submitFeedback = useSubmitFeedback();
  
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState([3]);
  const [isOpen, setIsOpen] = useState(false);

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
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">My Students</h1>
          <p className="text-muted-foreground mt-1">Detailed list of students assigned to you for mentorship.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.students?.map((student: any) => (
            <Card key={student.id} className="border-border/50 bg-card hover:border-primary/30 transition-colors flex flex-col shadow-sm group">
              <CardContent className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-none mb-1">{student.name}</h3>
                    <p className="text-sm text-muted-foreground font-medium">{student.profile?.branch || "N/A"} • Year {student.profile?.year || "N/A"}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-muted/30 rounded-xl p-3 text-center border border-transparent hover:border-border transition-colors">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">PRS Score</p>
                    <p className="text-2xl font-black text-primary">{student.profile?.prScore || 0}</p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3 text-center border border-transparent hover:border-border transition-colors">
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Resume</p>
                    <p className="text-2xl font-black text-foreground">{student.profile?.resumeScore || "—"}%</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Dialog open={isOpen && selectedStudent === student.id} onOpenChange={(open) => { setIsOpen(open); if(open) setSelectedStudent(student.id); }}>
                    <DialogTrigger asChild>
                      <Button className="w-full hover-elevate shadow-sm font-bold" variant="outline">
                        <MessageSquare className="w-4 h-4 mr-2" /> Provide Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-primary" />
                          Feedback for {student.name}
                        </DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleFeedback} className="space-y-6 pt-4">
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <Label className="font-bold">Performance Rating</Label>
                            <div className="flex items-center text-yellow-500 font-black bg-yellow-500/10 px-2 py-1 rounded-lg">
                              {rating[0]} <Star className="w-4 h-4 ml-1 fill-current" />
                            </div>
                          </div>
                          <Slider value={rating} onValueChange={setRating} max={5} min={1} step={1} className="py-2" />
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-bold">Detailed Notes</Label>
                          <Textarea 
                            required 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            placeholder="Share specific areas for improvement..."
                            className="h-32 bg-muted/20"
                          />
                        </div>
                        
                        <Button type="submit" className="w-full font-bold h-12" disabled={submitFeedback.isPending}>
                          {submitFeedback.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          Submit Evaluation
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" size="sm" asChild className="w-full justify-start text-xs font-bold text-primary hover:text-primary hover:bg-primary/5">
                    <a href={student.profile?.resumePath ? `/${student.profile.resumePath}` : "#"} target="_blank" rel="noreferrer">
                      <FileText className="w-3 h-3 mr-2" /> View Full Resume
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {(!data?.students || data.students.length === 0) && (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-3xl bg-muted/10">
              <UserCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">You have no assigned students in your cohort yet.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedLayout>
  );
}
