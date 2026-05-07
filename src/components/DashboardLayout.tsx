import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings, LogOut, LayoutGrid, Sparkles, BarChart3,
  Sun, Moon, Shield, ChevronDown,
} from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { isPlanActive } from "@/lib/stripe";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();
  const { profile } = useProfile();
  const currentPlan = profile?.plan || "free";
  const planIsActive = isPlanActive(profile?.plan, profile?.plan_expires_at);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const initials = (profile?.first_name || profile?.last_name || "")
    .trim()
    .split(/\s+/)
    .map((s) => s.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("") || "U";

  return (
    <div className="h-screen flex flex-col bg-background font-sans">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[9999] noise opacity-[0.015] dark:opacity-[0.02]" />

      {/* Top bar */}
      <header className="h-16 glass border-b border-border/40 flex items-center px-6 shrink-0 z-50">
        <Link to="/dashboard" className="hover:opacity-80 transition-all active:scale-95 shrink-0">
          <LogoFull size="sm" />
        </Link>

        <div className="ml-auto flex items-center gap-2">
          {/* Plan badge */}
          {planIsActive && currentPlan === "plus" && (
            <span className="hidden sm:inline-flex text-[10px] px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold tracking-tight mr-1 uppercase">
              Plus
            </span>
          )}
          {planIsActive && currentPlan === "pro" && (
            <span className="hidden sm:inline-flex text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold tracking-tight mr-1 uppercase">
              Pro
            </span>
          )}

          {/* Primary nav */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/20">
            <Link
              to="/dashboard/studio"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                location.pathname === "/dashboard/studio"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-background",
              )}
              title="Create"
            >
              <Sparkles className="w-4 h-4" />
            </Link>
            <Link
              to="/stats"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                location.pathname === "/stats"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-background",
              )}
              title="Stats"
            >
              <BarChart3 className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
                location.pathname === "/dashboard"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-background",
              )}
              title="My Content"
            >
              <LayoutGrid className="w-4 h-4" />
            </Link>
          </div>

          <div className="w-[1px] h-6 bg-border/40 mx-1 hidden sm:block" />

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1.5 h-10 pl-1 pr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all border border-transparent hover:border-border/40"
              aria-label="Profile menu"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-black flex items-center justify-center border border-primary/20">
                {initials}
              </div>
              <ChevronDown className="w-3.5 h-3.5 opacity-40" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-2xl glass shadow-2xl border-border/40">
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate">{profile?.first_name || "Account"}</span>
                  <span className="text-[10px] text-muted-foreground truncate opacity-70">{profile?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              {!planIsActive && currentPlan === "free" && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="rounded-lg px-3 py-2 cursor-pointer text-primary focus:text-primary focus:bg-primary/10 font-bold text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Upgrade to Premium
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/40" />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-lg px-3 py-2 cursor-pointer text-xs font-medium">
                <Settings className="w-3.5 h-3.5 mr-2 opacity-60" />
                Settings
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="rounded-lg px-3 py-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 text-xs font-medium"
                  >
                    <Shield className="w-3.5 h-3.5 mr-2 opacity-60" />
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem onClick={handleLogout} className="rounded-lg px-3 py-2 cursor-pointer text-xs font-medium text-destructive focus:bg-destructive/10">
                <LogOut className="w-3.5 h-3.5 mr-2 opacity-60" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 flex overflow-hidden relative z-10 bg-background">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
