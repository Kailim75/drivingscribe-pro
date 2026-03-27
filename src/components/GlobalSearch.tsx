import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useInvoices } from "@/hooks/useInvoices";
import { useVehicles } from "@/hooks/useVehicles";
import { Users, UserCog, FileText, Car } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { students } = useStudents();
  const { instructors } = useInstructors();
  const { invoices } = useInvoices();
  const { vehicles } = useVehicles();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const go = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher un élève, une facture, un formateur..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
        <CommandGroup heading="Élèves">
          {students.slice(0, 8).map((s) => (
            <CommandItem key={s.id} onSelect={() => go(`/eleves/${s.id}`)} className="gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              {s.first_name} {s.last_name}
              {s.email && <span className="text-xs text-muted-foreground ml-auto">{s.email}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Factures">
          {invoices.slice(0, 8).map((i) => (
            <CommandItem key={i.id} onSelect={() => go("/facturation")} className="gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              {i.number}
              <span className="text-xs text-muted-foreground ml-auto">{i.status}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Formateurs">
          {instructors.slice(0, 8).map((inst) => (
            <CommandItem key={inst.id} onSelect={() => go("/formateurs")} className="gap-2">
              <UserCog className="w-4 h-4 text-muted-foreground" />
              {inst.first_name} {inst.last_name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Véhicules">
          {vehicles.slice(0, 8).map((v) => (
            <CommandItem key={v.id} onSelect={() => go("/vehicules")} className="gap-2">
              <Car className="w-4 h-4 text-muted-foreground" />
              {v.brand} {v.model} ({v.plate})
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
