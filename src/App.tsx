import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrgProvider, useOrg } from "@/contexts/OrgContext";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import StudentDetail from "@/pages/StudentDetail";
import Instructors from "@/pages/Instructors";
import Vehicles from "@/pages/Vehicles";
import Planning from "@/pages/Planning";
import Offers from "@/pages/Offers";
import Invoicing from "@/pages/Invoicing";
import Payments from "@/pages/Payments";
import Expenses from "@/pages/Expenses";
import Profitability from "@/pages/Profitability";
import Documents from "@/pages/Documents";
import Reminders from "@/pages/Reminders";
import Import from "@/pages/Import";
import ActivityLog from "@/pages/ActivityLog";
import SettingsPage from "@/pages/SettingsPage";
import AuthPage from "@/pages/AuthPage";
import OnboardingPage from "@/pages/OnboardingPage";
import PublicInvoice from "@/pages/PublicInvoice";
import LandingPage from "@/pages/LandingPage";
import SuperAdminPage from "@/pages/SuperAdminPage";
import SuspendedPage from "@/pages/SuspendedPage";
import NotFound from "@/pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading } = useOrg();

  if (authLoading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/connexion" replace />;
  if (!organization) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/connexion" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/p/facture" element={<PublicInvoice />} />
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<SuperAdminPage />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/tableau-de-bord" element={<Dashboard />} />
        <Route path="/eleves" element={<Students />} />
        <Route path="/eleves/:id" element={<StudentDetail />} />
        <Route path="/formateurs" element={<Instructors />} />
        <Route path="/vehicules" element={<Vehicles />} />
        <Route path="/planning" element={<Planning />} />
        <Route path="/offres" element={<Offers />} />
        <Route path="/facturation" element={<Invoicing />} />
        <Route path="/paiements" element={<Payments />} />
        <Route path="/depenses" element={<Expenses />} />
        <Route path="/rentabilite" element={<Profitability />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/rappels" element={<Reminders />} />
        <Route path="/import" element={<Import />} />
        <Route path="/journal" element={<ActivityLog />} />
        <Route path="/parametres" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <OrgProvider>
            <AppRoutes />
          </OrgProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
