import { NavLink, Outlet, useMatch, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Database,
  GitCompare,
  GitBranch,
  FlaskConical,
  LogOut,
  Moon,
  PlayCircle,
  Server,
  Settings,
  Sun,
  Table2,
  Upload,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { clearStoredToken } from "@/lib/auth";

const NAV = [
  { to: "/simulation", label: "Simulations", icon: PlayCircle },
  { to: "/clusters", label: "Clusters", icon: Server },
  { to: "/jobs", label: "Jobs", icon: Database },
  { to: "/workflows", label: "Workflows", icon: GitBranch },
  { to: "/benchmark", label: "Benchmark", icon: FlaskConical },
  { to: "/traces", label: "Traces", icon: Upload },
  { to: "/experiments", label: "Experiments", icon: BarChart3 },
  { to: "/compare", label: "Compare", icon: GitCompare },
  { to: "/policies", label: "Policies", icon: Settings },
  { to: "/runs", label: "Runs & Analytics", icon: Table2 },
  { to: "/insights", label: "Insights", icon: CheckCircle },
  { to: "/dashboard", label: "Overview", icon: Activity },
];

function SidebarNavLink({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof PlayCircle;
}) {
  const match = useMatch({ path: to, end: true });
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={!!match} tooltip={label}>
        <NavLink to={to}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const logout = () => {
    clearStoredToken();
    navigate("/login", { replace: true });
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border bg-sidebar/95 shadow-[inset_-1px_0_0_0_var(--sidebar-border)]">
        <SidebarHeader className="border-b border-sidebar-border px-2 py-3">
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:justify-center">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-sm shadow-[0_0_18px_-6px_var(--neon-glow)] ring-1 ring-primary/25">
              H
            </div>
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate font-semibold text-sidebar-foreground">HPC Platform</p>
              <p className="truncate text-xs text-muted-foreground">Scheduling lab</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigate</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarNavLink key={item.to} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                tooltip={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? <Sun /> : <Moon />}
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div
          className="dashboard-atmosphere pointer-events-none absolute inset-0 -z-10 opacity-50 dark:opacity-70"
          aria-hidden
        />
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b border-primary/10 bg-background/75 px-4 shadow-[0_1px_0_0_var(--neon-shadow)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/55 dark:border-primary/15">
          <SidebarTrigger className="-ms-1" />
          <div className="flex flex-1 items-center justify-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Account
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
                  Toggle theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} variant="destructive" className="cursor-pointer">
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="relative z-0 flex-1 overflow-x-hidden p-4 md:p-8">
          <div className="mx-auto w-full max-w-[1440px] space-y-8">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
