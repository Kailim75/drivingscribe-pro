import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Instructors from "./pages/Instructors";
import Vehicles from "./pages/Vehicles";
import Planning from "./pages/Planning";
import Offers from "./pages/Offers";
import Invoicing from "./pages/Invoicing";
import Payments from "./pages/Payments";
import Expenses from "./pages/Expenses";
import Profitability from "./pages/Profitability";
import Documents from "./pages/Documents";
import Reminders from "./pages/Reminders";
import Import from "./pages/Import";
import ActivityLog from "./pages/ActivityLog";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/tableau-de-bord" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/tableau-de-bord" element={<Dashboard />} />
            <Route path="/eleves" element={<Students />} />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
