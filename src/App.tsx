
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AccessibilityProvider } from "@/contexts/AccessibilityContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";

const queryClient = new QueryClient();

// Componente interno para usar hooks
const AppContent = () => {
  useRealtimeUpdates();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div id="main-content">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
      <Analytics />
      <SpeedInsights />
    </>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AccessibilityProvider>
          <TooltipProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppContent />
              </NotificationProvider>
            </AuthProvider>
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
