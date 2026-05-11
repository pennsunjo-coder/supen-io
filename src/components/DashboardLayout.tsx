import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Settings, LogOut, LayoutGrid, Sparkles, BarChart3,
  Sun, Moon, Shield, ChevronDown, Plus,
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
import { Button } from "@/components/ui/button";

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

  const navItems = [
    { to: "/dashboard", label: "Library", icon: LayoutGrid },
    { to: "/dashboard/studio", label: "Studio", icon: Sparkles },
    { to: "/stats", label: "Insights", icon: BarChart3 },
  ];

  return (
    <div className="h-screen flex flex-col bg-background font-sans overflow-hidden selection:bg-primary/30">
      {/* Premium Background Mesh handled in index.css body */}

      {/* Header — Re-engineered for minimal elegance */}
      <header className="h-20 glass border-b border-white/5 flex items-center px-8 shrink-0 z-50">
        <Link to="/dashboard" className="hover:opacity-80 transition-all active:scale-95 shrink-0">
          <LogoFull size="sm" />
        </Link>

        {/* Central Navigation — The Apple way */}
        <nav className="hidden md:flex items-center gap-1 mx-auto bg-card/20 p-1.5 rounded-2xl border border-border/40">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                )}
              >
                <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "opacity-60")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          {/* Quick Create — Prioritized CTA */}
          <Button 
            onClick={() => navigate("/dashboard/studio")}
            className="hidden sm:flex h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold gap-2 shadow-lg shadow-primary/20 border-none transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>

          <div className="w-[1px] h-6 bg-white/10 mx-1 hidden sm:block" />

          {/* User & Settings */}
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme} 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card/20 transition-all border border-border/40"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 h-10 pl-1 pr-3 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/20 transition-all border border-border/40"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                  {initials}
                </div>
                <span className="text-xs font-bold hidden lg:inline-block truncate max-w-[100px]">
                  {profile?.first_name || "Account"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-40" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 rounded-[1.5rem] bg-card border-border/40 shadow-2xl mt-2">
                <DropdownMenuLabel className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-foreground">{profile?.first_name || "Profile"}</span>
                    <span className="text-[11px] text-muted-foreground opacity-70 truncate">{profile?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/20 mx-2" />
                
                {planIsActive ? (
                  <div className="px-4 py-2 mt-1">
                    <div className="text-[10px] uppercase tracking-widest font-black text-primary mb-1">Active Plan</div>
                    <div className="text-xs font-bold text-foreground capitalize">{currentPlan} Member</div>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate("/settings")}
                    className="rounded-xl px-4 py-2.5 cursor-pointer text-primary focus:text-primary focus:bg-primary/10 font-bold text-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-2" />
                    Upgrade to Premium
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-border/20 mx-2" />
                
                <DropdownMenuItem onClick={() => navigate("/settings")} className="rounded-xl px-4 py-2.5 cursor-pointer text-xs font-semibold">
                  <Settings className="w-3.5 h-3.5 mr-2 opacity-60" />
                  Settings
                </DropdownMenuItem>
                
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="rounded-xl px-4 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-500/10 text-xs font-semibold"
                  >
                    <Shield className="w-3.5 h-3.5 mr-2 opacity-60" />
                    Admin Panel
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator className="bg-border/20 mx-2" />
                
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-4 py-2.5 cursor-pointer text-xs font-semibold text-destructive focus:bg-destructive/10">
                  <LogOut className="w-3.5 h-3.5 mr-2 opacity-60" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex overflow-hidden relative z-10 bg-transparent">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
