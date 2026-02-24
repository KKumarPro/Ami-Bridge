import { useState } from "react";
import { useLocation } from "wouter";
import { useCompanyQuestions, useSubmitInterview } from "@/hooks/use-student";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

export function InterviewWizard({ params }: { params: { id: string } }) {
  const companyId = parseInt(params.id);
  const [, setLocation] = useLocation();
  const { data: questions, isLoading } = useCompanyQuestions(companyId);
  const submitInterview = useSubmitInterview();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  if (isLoading) return <ProtectedLayout><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div></ProtectedLayout>;
  
  if (!questions || questions.length === 0) {
    return (
      <ProtectedLayout>
        <div className="text-center py-20">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold font-display">No questions available</h2>
          <p className="text-muted-foreground mt-2 mb-6">This company doesn't have practice questions yet.</p>
          <Button onClick={() => setLocation('/student/practice')}>Back to Companies</Button>
        </div>
      </ProtectedLayout>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLast = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (!answers[currentQuestion.id]) return;
    if (isLast) {
      handleSubmit();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSubmit = async () => {
    const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
      questionId: parseInt(qId),
      studentAnswer: ans
    }));
    
    await submitInterview.mutateAsync({ companyId, answers: formattedAnswers });
    setLocation('/student/dashboard');
  };

  return (
    <ProtectedLayout allowedRoles={["student"]}>
      <div className="max-w-3xl mx-auto space-y-8 py-8">
        <div className="space-y-4">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="border-2 shadow-lg shadow-black/5">
          <CardContent className="p-8 md:p-12">
            <div className="mb-8">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                {currentQuestion.topic}
              </span>
              <h2 className="text-2xl md:text-3xl font-bold font-display leading-tight">
                {currentQuestion.questionText}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">Score potential: {currentQuestion.marks} points</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-semibold text-foreground">Your Answer</label>
              <Textarea 
                placeholder="Type your detailed answer here..."
                className="min-h-[200px] text-base resize-y bg-muted/30 focus-visible:bg-background"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
              />
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                size="lg" 
                onClick={handleNext}
                disabled={!answers[currentQuestion.id] || submitInterview.isPending}
                className="hover-elevate active-elevate-2 shadow-md px-8"
              >
                {submitInterview.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                 isLast ? <><CheckCircle2 className="w-5 h-5 mr-2" /> Submit Interview</> : 
                 <>Next Question <ChevronRight className="w-5 h-5 ml-2" /></>}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
