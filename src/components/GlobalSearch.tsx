import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useInvoices } from "@/hooks/useInvoices";
import { useVehicles } from "@/hooks/useVehicles";
import {
  LayoutDashboard,
  Users,
  UserCog,
  FileText,
  Car,
  CalendarDays,
  CreditCard,
  TrendingUp,
  FolderOpen,
  Bell,
  Settings,
  Package,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  { label: "Tableau de bord", path: "/tableau-de-bord", icon: LayoutDashboard, keywords: "dashboard accueil synthese" },
  { label: "Élèves", path: "/eleves", icon: Users, keywords: "students apprenants clients dossiers" },
  { label: "Planning", path: "/planning", icon: CalendarDays, keywords: "seances calendrier conduite" },
  { label: "Facturation", path: "/facturation", icon: FileText, keywords: "factures devis documents" },
  { label: "Paiements", path: "/paiements", icon: CreditCard, keywords: "encaissements reglements" },
  { label: "Finances", path: "/rentabilite", icon: TrendingUp, keywords: "rentabilite depenses analyse" },
  { label: "Formateurs", path: "/formateurs", icon: UserCog, keywords: "instructeurs enseignants" },
  { label: "Véhicules", path: "/vehicules", icon: Car, keywords: "voitures motos flotte" },
  { label: "Offres", path: "/offres", icon: Package, keywords: "formules tarifs packs" },
  { label: "Documents", path: "/documents", icon: FolderOpen, keywords: "fichiers pieces justificatifs" },
  { label: "Rappels", path: "/rappels", icon: Bell, keywords: "relances notifications" },
  { label: "Paramètres", path: "/parametres", icon: Settings, keywords: "configuration organisation" },
];

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const matches = (query: string, ...parts: unknown[]) => {
  const q = normalize(query).trim();
  if (!q) return true;
  return normalize(parts.join(" ")).includes(q);
};

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { students } = useStudents();
  const { instructors } = useInstructors();
  const { invoices } = useInvoices();
  const { vehicles } = useVehicles();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const navigation = useMemo(
    () => navigationItems.filter((item) => matches(query, item.label, item.keywords)).slice(0, 8),
    [query]
  );

  const studentResults = useMemo(
    () => students
      .filter((s) => matches(query, s.first_name, s.last_name, s.email, s.phone))
      .slice(0, 8),
    [students, query]
  );

  const invoiceResults = useMemo(
    () => invoices
      .filter((i) => matches(query, i.number, i.status, i.type, i.students?.first_name, i.students?.last_name))
      .slice(0, 8),
    [invoices, query]
  );

  const instructorResults = useMemo(
    () => instructors
      .filter((inst) => matches(query, inst.first_name, inst.last_name, inst.email, inst.phone))
      .slice(0, 8),
    [instructors, query]
  );

  const vehicleResults = useMemo(
    () => vehicles
      .filter((v) => matches(query, v.brand, v.model, v.plate))
      .slice(0, 8),
    [vehicles, query]
  );

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Rechercher un élève, une facture, un formateur..."
      />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        {navigation.length > 0 && (
          <CommandGroup heading="Navigation">
            {navigation.map((item) => (
              <CommandItem key={item.path} value={`${item.label} ${item.keywords}`} onSelect={() => go(item.path)} className="gap-2">
                <item.icon className="w-4 h-4 text-muted-foreground" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {studentResults.length > 0 && (
          <CommandGroup heading="Élèves">
            {studentResults.map((s) => (
              <CommandItem key={s.id} onSelect={() => go(`/eleves/${s.id}`)} className="gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                {s.first_name} {s.last_name}
                {s.email && <span className="text-xs text-muted-foreground ml-auto">{s.email}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {invoiceResults.length > 0 && (
          <CommandGroup heading="Factures">
            {invoiceResults.map((i) => (
              <CommandItem key={i.id} onSelect={() => go("/facturation")} className="gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                {i.number}
                <span className="text-xs text-muted-foreground ml-auto">{i.status}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {instructorResults.length > 0 && (
          <CommandGroup heading="Formateurs">
            {instructorResults.map((inst) => (
              <CommandItem key={inst.id} onSelect={() => go("/formateurs")} className="gap-2">
                <UserCog className="w-4 h-4 text-muted-foreground" />
                {inst.first_name} {inst.last_name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {vehicleResults.length > 0 && (
          <CommandGroup heading="Véhicules">
            {vehicleResults.map((v) => (
              <CommandItem key={v.id} onSelect={() => go("/vehicules")} className="gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                {v.brand} {v.model} ({v.plate})
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
