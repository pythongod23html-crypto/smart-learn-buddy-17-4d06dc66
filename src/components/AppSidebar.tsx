import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Settings, ClipboardList, Home, MessagesSquare, LineChart, GraduationCap, Calendar, LayoutDashboard, ShieldCheck } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";

type Item = { title: string; url: string; icon: any; search?: Record<string, string> };

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  const { role } = useAuth();

  const primary: Item[] = [
    { title: role === "parent" ? "Homework mode" : "AI tutor", url: "/chat", icon: BookOpen },
    { title: "Home", url: "/", icon: Home },
  ];

  const roleItems: Item[] = [];
  if (role === "teacher" || role === "admin") {
    roleItems.push({ title: "Weekly quiz", url: "/weekly-quiz", icon: ClipboardList });
    roleItems.push({ title: "Teacher tools", url: "/teacher", icon: GraduationCap });
  }
  if (role === "admin") {
    roleItems.push({ title: "Admin", url: "/admin", icon: ShieldCheck });
  }
  if (role === "parent") {
    roleItems.push({ title: "My child", url: "/parent", icon: LineChart });
    roleItems.push({ title: "Analytics", url: "/parent-dashboard", icon: LayoutDashboard });
    roleItems.push({ title: "Help chat", url: "/parent-chat", icon: MessagesSquare });
  }
  if (role === "student" || !role) {
    roleItems.push({ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard });
    roleItems.push({ title: "Planner", url: "/planner", icon: Calendar });
  }

  const utility: Item[] = [
    { title: "Settings", url: "/settings", icon: Settings },
  ];

  const renderItem = (item: Item) => {
    const active = path === item.url;
    return (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={active} tooltip={item.title}>
          <Link to={item.url} className="flex items-center gap-2">
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Study</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{primary.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {roleItems.length > 0 && (
          <SidebarGroup>
            {!collapsed && <SidebarGroupLabel>Workspace</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>{roleItems.map(renderItem)}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Account</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{utility.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
