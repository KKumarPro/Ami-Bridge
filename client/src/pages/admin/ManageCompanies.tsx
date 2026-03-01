import { useCompanies, useCreateCompany } from "@/hooks/use-admin";
import { ProtectedLayout } from "@/components/layout/ProtectedLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function ManageCompanies() {
  const { data: companies, isLoading } = useCompanies();
  
  const createCompany = useCreateCompany();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    difficultyLevel: "medium"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCompany.mutateAsync(formData as any);
    setIsOpen(false);
    setFormData({ name: "", description: "", difficultyLevel: "medium" });
  };

  return (
    <ProtectedLayout allowedRoles={["admin"]}>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Manage Companies</h1>
            <p className="text-muted-foreground mt-1">Register local companies looking for student interns.</p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="hover-elevate shadow-md shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Add Company
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Company</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description</Label>
                  <Textarea 
                    id="desc" 
                    required 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={formData.difficultyLevel} 
                    onValueChange={v => setFormData({...formData, difficultyLevel: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={createCompany.isPending}>
                  {createCompany.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Company
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies?.map((company: any) => (
            <Card key={company.id} className="shadow-sm border-border/50">
              <CardHeader className="pb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <Building2 className="w-5 h-5" />
                </div>
                <CardTitle>{company.name}</CardTitle>
                <CardDescription className="line-clamp-2">{company.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Level:</span>
                  <span className="text-xs font-bold uppercase text-primary">{company.difficultyLevel}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </ProtectedLayout>
  );
}
