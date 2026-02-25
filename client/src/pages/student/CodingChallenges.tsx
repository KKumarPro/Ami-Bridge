import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const CHALLENGES = [
  {
    id: 1,
    title: "Two Sum",
    topic: "Arrays",
    difficulty: "Easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    points: 50,
  },
  {
    id: 2,
    title: "Reverse Linked List",
    topic: "Linked Lists",
    difficulty: "Medium",
    description: "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    points: 100,
  },
  {
    id: 3,
    title: "Binary Tree Level Order Traversal",
    topic: "Trees",
    difficulty: "Medium",
    description: "Given the root of a binary tree, return the level order traversal of its nodes' values.",
    points: 150,
  }
];

export function CodingChallenges() {
  return (
    <ProtectedLayout allowedRoles={["student"]}>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Coding Challenges</h1>
          <p className="text-muted-foreground mt-1">Improve your coding skills with topic-specific challenges.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CHALLENGES.map((challenge) => (
            <Card key={challenge.id} className="flex flex-col shadow-sm hover:shadow-lg transition-shadow border-border/50 group">
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <Badge variant={challenge.difficulty === 'Hard' ? 'destructive' : challenge.difficulty === 'Medium' ? 'default' : 'secondary'} className="capitalize">
                    {challenge.difficulty}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-display">{challenge.title}</CardTitle>
                <CardDescription>{challenge.topic}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {challenge.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <span>{challenge.points} Points</span>
                </div>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button className="w-full hover-elevate active-elevate-2 shadow-md shadow-primary/20 gap-2">
                  <Play className="w-4 h-4" /> Start Challenge
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
