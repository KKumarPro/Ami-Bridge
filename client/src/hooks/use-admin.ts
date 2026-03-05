import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InsertCompany, InsertQuestion, ScoreResumeRequest } from "@shared/schema";

export function useAdminDashboard() {
  return useQuery({
    queryKey: [api.admin.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.admin.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}

export function useResumes() {
  return useQuery({
    queryKey: [api.admin.resumes.path],
    queryFn: async () => {
      const res = await fetch(api.admin.resumes.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch resumes");
      return res.json();
    },
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: [api.admin.companies.path],
    queryFn: async () => {
      const res = await fetch(api.admin.companies.path, { credentials: "include" });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch companies');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertCompany) => {
      const res = await fetch(api.admin.createCompany.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              throw new Error(errorData.message || "Failed to create company");
            }
      return res.json();
    },
    onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
          },
          onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.dashboard.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.companies.path] });
      queryClient.invalidateQueries({ queryKey: [api.student.companies.path] });
      toast({ title: "Company Created", description: "Company has been added to the system." });
    },
  });
}

export function useCreateQuestion() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InsertQuestion) => {
      const res = await fetch(api.admin.createQuestion.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to add question");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Question Added", description: "The question was successfully created." });
    },
  });
}

export function useScoreResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ScoreResumeRequest }) => {
      const res = await fetch(buildUrl(api.admin.scoreResume.path, { id }), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to score resume");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.resumes.path] });
      toast({ title: "Resume Scored", description: "The score has been updated." });
    },
  });
}
