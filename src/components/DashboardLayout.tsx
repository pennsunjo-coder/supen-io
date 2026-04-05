import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Settings, LogOut, Clock, Sun, Moon, Shield } from "lucide-react";
import { LogoFull } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAdmin } from "@/hooks/use-admin";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAdmin();

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
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-1.5 px-2 h-7 rounded-lg text-[10px] font-medium transition-all mr-1",
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
            to="/dashboard/history"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard/history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="History"
          >
            <Clock className="w-4 h-4" />
          </Link>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
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
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
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
