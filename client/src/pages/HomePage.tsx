import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ShieldCheck, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function HomePage() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (!isLoading && user) {
    setLocation(`/${user.role}/dashboard`);
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">AB</div>
            <span className="font-display font-bold text-xl tracking-tight">Ami-Bridge</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild className="hidden sm:inline-flex hover-elevate">
              <Link href="/auth?mode=login">Sign In</Link>
            </Button>
            <Button asChild className="hover-elevate active-elevate-2 shadow-lg shadow-primary/20">
              <Link href="/auth?mode=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold font-display tracking-tight text-foreground max-w-4xl mx-auto leading-tight"
            >
              Master your tech career with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ami-Bridge</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              The complete platform for students to practice interviews, receive mentor feedback, and track their Placement Readiness Score (PRS).
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" className="h-14 px-8 text-lg hover-elevate active-elevate-2 shadow-xl shadow-primary/25" asChild>
                <Link href="/auth?mode=signup">
                  Start Practicing <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <section className="py-20 bg-muted/50 border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Track PRS Score</h3>
                <p className="text-muted-foreground leading-relaxed">Your Placement Readiness Score gives you a clear metric on how prepared you are for top tech companies.</p>
              </div>
              <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-6">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Mock Interviews</h3>
                <p className="text-muted-foreground leading-relaxed">Practice company-specific interview questions and get scored automatically to improve your skills.</p>
              </div>
              <div className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600 mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">Mentor Feedback</h3>
                <p className="text-muted-foreground leading-relaxed">Get assigned to industry mentors who review your performance and provide actionable insights.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
