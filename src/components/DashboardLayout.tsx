import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, BookOpen, Wand2, Wrench, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Notebook", icon: BookOpen, path: "/dashboard" },
  { label: "Studio", icon: Wand2, path: "/dashboard/studio" },
  { label: "Outils", icon: Wrench, path: "/dashboard/tools" },
];

const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar — compact & clean */}
      <aside className="w-16 border-r border-border/20 flex flex-col items-center py-4 shrink-0">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-6 hover:bg-primary/15 transition-colors"
        >
          <Zap className="w-4 h-4 text-primary" />
        </Link>

        {/* Nav icons */}
        <nav className="flex-1 flex flex-col items-center gap-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === "/dashboard" && location.pathname === "/dashboard");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all group relative",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className="w-[18px] h-[18px]" />
                {/* Tooltip */}
                <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg border border-border/30">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className="flex flex-col items-center gap-1">
          <Link
            to="/dashboard/settings"
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <Settings className="w-[18px] h-[18px]" />
          </Link>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
};

export default DashboardLayout;
