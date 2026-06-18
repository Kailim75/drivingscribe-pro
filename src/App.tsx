import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrgProvider, useOrg } from "@/contexts/OrgContext";
import AppLayout from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Students = lazy(() => import("@/pages/Students"));
const StudentDetail = lazy(() => import("@/pages/StudentDetail"));
const Instructors = lazy(() => import("@/pages/Instructors"));
const Vehicles = lazy(() => import("@/pages/Vehicles"));
const Planning = lazy(() => import("@/pages/Planning"));
const Offers = lazy(() => import("@/pages/Offers"));
const Invoicing = lazy(() => import("@/pages/Invoicing"));
const GroupedBilling = lazy(() => import("@/pages/GroupedBilling"));
const Payments = lazy(() => import("@/pages/Payments"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const Profitability = lazy(() => import("@/pages/Profitability"));
const Documents = lazy(() => import("@/pages/Documents"));
const Reminders = lazy(() => import("@/pages/Reminders"));
const Import = lazy(() => import("@/pages/Import"));
const ActivityLog = lazy(() => import("@/pages/ActivityLog"));
const SettingsPage = lazy(() => import("@/pages/SettingsPage"));
const InstructorPortal = lazy(() => import("@/pages/InstructorPortal"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const OnboardingPage = lazy(() => import("@/pages/OnboardingPage"));
const PublicInvoice = lazy(() => import("@/pages/PublicInvoice"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const SuperAdminPage = lazy(() => import("@/pages/SuperAdminPage"));
const SuspendedPage = lazy(() => import("@/pages/SuspendedPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { organization, loading: orgLoading, userSuspended, orgSuspended } = useOrg();

  if (authLoading || orgLoading) {
    return <FullPageLoader />;
  }

  if (!user) return <Navigate to="/connexion" replace />;
  if (!organization) return <Navigate to="/onboarding" replace />;
  if (userSuspended || orgSuspended) return <Navigate to="/suspendu" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route path="/connexion" element={<AuthPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/p/facture" element={<PublicInvoice />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<SuperAdminPage />} />
        <Route path="/suspendu" element={<SuspendedPage />} />
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/tableau-de-bord" element={<Dashboard />} />
          <Route path="/eleves" element={<Students />} />
          <Route path="/eleves/:id" element={<StudentDetail />} />
          <Route path="/formateurs" element={<Instructors />} />
          <Route path="/vehicules" element={<Vehicles />} />
          <Route path="/planning" element={<Planning />} />
          <Route path="/offres" element={<Offers />} />
          <Route path="/facturation" element={<Invoicing />} />
          <Route path="/facturation-groupee" element={<GroupedBilling />} />
          <Route path="/paiements" element={<Payments />} />
          <Route path="/depenses" element={<Expenses />} />
          <Route path="/rentabilite" element={<Profitability />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/rappels" element={<Reminders />} />
          <Route path="/import" element={<Import />} />
          <Route path="/journal" element={<ActivityLog />} />
          <Route path="/parametres" element={<SettingsPage />} />
          <Route path="/portail-formateur" element={<InstructorPortal />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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
