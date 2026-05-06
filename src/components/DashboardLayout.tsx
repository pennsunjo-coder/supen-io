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
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 border-b border-border/20 flex items-center px-4 shrink-0">
        <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
          <LogoFull size="sm" />
        </Link>

        <div className="ml-auto flex items-center gap-1">
          {/* Plan badge — kept visible (drives upgrades) */}
          {planIsActive && currentPlan === "plus" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium mr-1">
              Plus
            </span>
          )}
          {planIsActive && currentPlan === "pro" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium mr-1">
              Pro
            </span>
          )}

          {/* Primary nav — always visible */}
          <Link
            to="/dashboard/studio"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard/studio"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="Create"
          >
            <Sparkles className="w-4 h-4" />
          </Link>
          <Link
            to="/stats"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/stats"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="Stats"
          >
            <BarChart3 className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="My Content"
          >
            <LayoutGrid className="w-4 h-4" />
          </Link>

          {/* Profile dropdown — collects everything system-level */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="ml-1 flex items-center gap-1 h-8 pl-1 pr-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
              aria-label="Profile menu"
            >
              <div className="w-6 h-6 rounded-md bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
                {initials}
              </div>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">
                {profile?.first_name || "Account"}
                {planIsActive && (currentPlan === "plus" || currentPlan === "pro") && (
                  <span className="ml-2 text-[9px] font-bold text-primary normal-case tracking-normal">{currentPlan.toUpperCase()}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {!planIsActive && currentPlan === "free" && (
                <>
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="cursor-pointer text-primary focus:text-primary"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Upgrade plan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="w-3.5 h-3.5 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={toggleTheme} className="cursor-pointer">
                {theme === "dark" ? <Sun className="w-3.5 h-3.5 mr-2" /> : <Moon className="w-3.5 h-3.5 mr-2" />}
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer text-red-400 focus:text-red-400"
                  >
                    <Shield className="w-3.5 h-3.5 mr-2" />
                    Admin
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
};

export default DashboardLayout;
