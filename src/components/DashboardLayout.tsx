import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, Settings, LogOut, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top bar */}
      <header className="h-12 border-b border-border/20 flex items-center px-4 shrink-0">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold tracking-tight">Supen.io</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <Link
            to="/dashboard/history"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
              location.pathname === "/dashboard/history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
            title="Historique"
          >
            <Clock className="w-4 h-4" />
          </Link>
          <button
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            title="Paramètres"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
            title="Déconnexion"
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
