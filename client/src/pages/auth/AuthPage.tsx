import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useSearch, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, User, GraduationCap, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AuthPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  
  useEffect(() => {
    if (user) {
      setLocation(`/${user.role}/dashboard`);
    }
  }, [user, setLocation]);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const mode = params.get("mode");
    if (mode === "signup") setIsLogin(false);
    else if (mode === "login") setIsLogin(true);
  }, [search]);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "mentor" | "admin">("student");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email, password, role });
      } else {
        await register({ name, email, password, role });
      }
    } catch (err) {
      // Error handled by hook toast
    }
  };

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Back button */}
      <div className="absolute top-8 left-8 z-20">
        <Button variant="ghost" asChild className="gap-2">
          <Link href="/">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </Button>
      </div>

      {/* Decorative background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary/20 blur-[120px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold text-xl shadow-lg">AB</div>
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display text-foreground tracking-tight">
          {isLogin ? "Sign in to your account" : "Create your account"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Card className="border-border/50 shadow-xl shadow-black/5 bg-card/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome back" : "Get started"}</CardTitle>
            <CardDescription>
              {isLogin ? "Enter your credentials to access your dashboard" : "Fill out the form below to register"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label className="mb-3 block text-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Select your role
              </Label>
              <Tabs value={role} onValueChange={(v: any) => setRole(v)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 p-1 bg-muted/50">
                  <TabsTrigger value="student" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <GraduationCap className="w-4 h-4" /> Student
                  </TabsTrigger>
                  <TabsTrigger value="mentor" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <User className="w-4 h-4" /> Mentor
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    <Shield className="w-4 h-4" /> Admin
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="popLayout">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        required 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="bg-background"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && <a href="#" className="text-sm text-primary hover:underline font-medium">Forgot password?</a>}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 text-base font-semibold hover-elevate active-elevate-2 shadow-md shadow-primary/20 mt-6"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isLogin ? (
                  `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                ) : (
                  `Sign Up as ${role.charAt(0).toUpperCase() + role.slice(1)}`
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
