import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import type { InterviewSubmissionRequest } from "@shared/schema";

export function useStudentDashboard() {
  return useQuery({
    queryKey: [api.student.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.student.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}

export function useCompanies() {
  return useQuery({
    queryKey: [api.student.companies.path],
    queryFn: async () => {
      const res = await fetch(api.student.companies.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch companies");
      return res.json();
    },
  });
}

export function useCompanyQuestions(companyId: number) {
  return useQuery({
    queryKey: [buildUrl(api.student.questions.path, { companyId })],
    queryFn: async () => {
      const res = await fetch(buildUrl(api.student.questions.path, { companyId }), { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return res.json();
    },
    enabled: !!companyId,
  });
}

export function useSubmitInterview() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: InterviewSubmissionRequest) => {
      const res = await fetch(api.student.submitInterview.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit interview");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.student.dashboard.path] });
      toast({ title: "Interview Submitted", description: "Your answers have been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    },
  });
}

export function useUploadResume() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch(api.student.uploadResume.path, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to upload resume");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.student.dashboard.path] });
      toast({ title: "Resume Uploaded", description: "Your resume has been successfully submitted." });
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
  });
}
