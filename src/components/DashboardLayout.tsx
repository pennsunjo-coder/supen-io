import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, LogOut, LayoutGrid, Sun, Moon, Shield, CalendarDays } from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { isPlanActive } from "@/lib/stripe";

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

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 border-b border-border/20 flex items-center px-4 shrink-0">
        <Link to="/dashboard" className="hover:opacity-80 transition-opacity">
          <LogoFull size="sm" />
        </Link>

        <div className="ml-auto flex items-center gap-1">
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
          {!planIsActive && currentPlan === "free" && (
            <button
              onClick={() => navigate("/settings")}
              className="text-[10px] px-2 py-0.5 rounded-full text-muted-foreground/50 hover:text-primary hover:bg-primary/5 transition-all mr-1"
            >
              Upgrade
            </button>
          )}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "hidden md:flex items-center gap-1.5 px-2 h-7 rounded-lg text-[10px] font-medium transition-all mr-1",
                location.pathname === "/admin"
                  ? "bg-red-500/15 text-red-400"
                  : "bg-red-500/10 text-red-400/70 hover:bg-red-500/15 hover:text-red-400",
              )}
              title="Admin"
            >
              <Shield className="w-3 h-3" />
              Admin
            </Link>
          )}
          <Link
            to="/dashboard/calendar"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard/calendar"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="Calendar"
          >
            <CalendarDays className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard/history"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard/history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="My Content"
          >
            <LayoutGrid className="w-4 h-4" />
          </Link>
          <button
            onClick={toggleTheme}
            className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            <div className="transition-transform duration-300 hover:rotate-[360deg]">
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </div>
          </button>
          <button
            onClick={() => navigate("/settings")}
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/settings"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content area */}
      <main className="flex-1 flex overflow-hidden">{children}</main>
    </div>
  );
};

export default DashboardLayout;
