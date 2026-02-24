import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

export function useMentorDashboard() {
  return useQuery({
    queryKey: [api.mentor.dashboard.path],
    queryFn: async () => {
      const res = await fetch(api.mentor.dashboard.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      return res.json();
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { studentId: number; notes: string; performanceRating: number }) => {
      const res = await fetch(api.mentor.submitFeedback.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit feedback");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.mentor.dashboard.path] });
      toast({ title: "Feedback Submitted", description: "Your feedback has been saved." });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    },
  });
}
