import { Link, useLocation } from "wouter";
import { 
  Home, 
  Briefcase, 
  FileText, 
  Users, 
  BarChart, 
  Building,
  LogOut,
  Settings
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const getLinks = () => {
    switch (user.role) {
      case "student":
        return [
          { title: "Dashboard", url: "/student/dashboard", icon: Home },
          { title: "Practice Interviews", url: "/student/practice", icon: Briefcase },
          { title: "Coding Challenges", url: "/student/coding", icon: Settings },
          { title: "My Resume", url: "/student/resume", icon: FileText },
        ];
      case "mentor":
        return [
          { title: "Dashboard", url: "/mentor/dashboard", icon: Home },
          { title: "My Students", url: "/mentor/students", icon: Users },
        ];
      case "admin":
        return [
          { title: "Dashboard", url: "/admin/dashboard", icon: BarChart },
          { title: "Manage Companies", url: "/admin/companies", icon: Building },
          { title: "Review Resumes", url: "/admin/resumes", icon: FileText },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <Sidebar>
      <SidebarContent>
        <div className="p-4 mb-4">
          <h2 className="text-2xl font-bold text-primary font-display flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm">SB</span>
            SkillBridge
          </h2>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {links.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location === item.url}
                    className="hover-elevate active-elevate-2 transition-all duration-200"
                  >
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full flex items-center gap-3 text-muted-foreground hover:text-foreground hover-elevate">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => logout()} 
              className="w-full flex items-center gap-3 text-destructive hover:text-destructive hover-elevate"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
