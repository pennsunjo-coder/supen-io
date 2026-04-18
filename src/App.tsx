import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { toast } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Tools = lazy(() => import("./pages/Tools.tsx"));
const History = lazy(() => import("./pages/History.tsx"));
const Calendar = lazy(() => import("./pages/Calendar.tsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const FAQ = lazy(() => import("./pages/FAQ.tsx"));
const Contact = lazy(() => import("./pages/Contact.tsx"));
const ContentDetail = lazy(() => import("./pages/ContentDetail.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const IS_DEV = import.meta.env.DEV;

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

const App = () => {
  // Global unhandled promise rejection handler
  useEffect(() => {
    function handleRejection(event: PromiseRejectionEvent) {
      if (IS_DEV) console.error("[Unhandled Promise Rejection]", event.reason);
      const msg = event.reason?.message || "";
      // Skip errors already handled locally (529/overloaded in StudioWizard/InfographicModal,
      // network retries, and normal abort/cancel from AbortController timeouts)
      const isSilent =
        /abort|cancel|aborterror/i.test(msg) ||
        /529|overloaded|surcharge/i.test(msg) ||
        /network|fetch|load failed/i.test(msg);
      if (msg && !isSilent) {
        toast.error("Une erreur inattendue s'est produite");
      }
    }
    function handleError(event: ErrorEvent) {
      if (IS_DEV) console.error("[Window Error]", event.error || event.message);
    }
    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/onboarding" element={<ProtectedRoute skipOnboardingCheck><Onboarding /></ProtectedRoute>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/dashboard/studio" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                    <Route path="/dashboard/tools" element={<ProtectedRoute><Tools /></ProtectedRoute>} />
                    <Route path="/dashboard/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
                    <Route path="/content/:id" element={<ProtectedRoute><ContentDetail /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
