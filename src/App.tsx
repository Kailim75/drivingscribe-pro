import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import ModulePage from "./pages/ModulePage";
import NotFound from "./pages/NotFound";
import {
  UserCog,
  Car,
  CalendarDays,
  Package,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  FolderOpen,
  Bell,
  Upload,
  ClipboardList,
  Settings,
} from "lucide-react";

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
            <Route path="/formateurs" element={<ModulePage title="Formateurs" description="Gérez vos formateurs, disponibilités et statistiques" icon={UserCog} />} />
            <Route path="/vehicules" element={<ModulePage title="Véhicules" description="Parc de véhicules, disponibilité et coûts" icon={Car} />} />
            <Route path="/planning" element={<ModulePage title="Planning" description="Planifiez et gérez les séances individuelles" icon={CalendarDays} />} />
            <Route path="/offres" element={<ModulePage title="Catalogue d'offres" description="Offres à l'heure, packs et forfaits" icon={Package} />} />
            <Route path="/facturation" element={<ModulePage title="Devis & Factures" description="Créez et suivez vos devis et factures" icon={FileText} />} />
            <Route path="/paiements" element={<ModulePage title="Paiements" description="Suivi des paiements et encaissements" icon={CreditCard} />} />
            <Route path="/depenses" element={<ModulePage title="Dépenses" description="Charges directes et fixes" icon={Receipt} />} />
            <Route path="/rentabilite" element={<ModulePage title="Rentabilité" description="Analyse de rentabilité par élève, formateur et véhicule" icon={TrendingUp} />} />
            <Route path="/documents" element={<ModulePage title="Documents" description="Gestion documentaire structurée" icon={FolderOpen} />} />
            <Route path="/rappels" element={<ModulePage title="Rappels" description="Rappels de séance et relances impayés" icon={Bell} />} />
            <Route path="/import" element={<ModulePage title="Import initial" description="Importez vos élèves et données existantes" icon={Upload} />} />
            <Route path="/journal" element={<ModulePage title="Journal d'activité" description="Historique des actions et modifications" icon={ClipboardList} />} />
            <Route path="/parametres" element={<ModulePage title="Paramètres" description="Configuration de votre organisation" icon={Settings} />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
