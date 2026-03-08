import { motion } from "framer-motion";
import { Search, Plus, Phone, Mail, Loader2, UserCog, Pencil, Archive } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useInstructors } from "@/hooks/useInstructors";
import { useAuditLog } from "@/hooks/useAuditLog";
import { instructorStatusLabels, instructorStatusColors, activityTypeLabels, formatEur } from "@/lib/labels";
import InstructorFormDialog from "@/components/instructors/InstructorFormDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function Instructors() {
  const { instructors, isLoading, create, update } = useInstructors();
  const { log } = useAuditLog();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editInstructor, setEditInstructor] = useState<any>(null);

  const filtered = instructors.filter((i) =>
    `${i.first_name} ${i.last_name} ${i.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "instructor", details: `${data.first_name} ${data.last_name}` });
      },
    });
  };

  const handleEdit = (data: any) => {
    if (!editInstructor) return;
    update.mutate({ id: editInstructor.id, ...data }, {
      onSuccess: () => {
        setEditInstructor(null);
        log({ action: "update", entity: "instructor", entity_id: editInstructor.id, details: `${data.first_name} ${data.last_name}` });
      },
    });
  };

  const handleArchive = (inst: any) => {
    const newStatus = inst.status === "archive" ? "actif" : "archive";
    update.mutate({ id: inst.id, status: newStatus }, {
      onSuccess: () => log({ action: "update_status", entity: "instructor", entity_id: inst.id, details: `Statut → ${instructorStatusLabels[newStatus]}` }),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Formateurs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{instructors.length} formateur{instructors.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nouveau formateur
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un formateur..."
          className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCog className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">{instructors.length === 0 ? "Aucun formateur" : "Aucun résultat"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {instructors.length === 0 ? "Ajoutez votre premier formateur" : "Essayez avec d'autres critères"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Formateur</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Spécialités</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Coût/h</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Statut</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => (
                  <tr key={inst.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{inst.first_name} {inst.last_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {inst.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {inst.phone}</span>}
                        {inst.email && <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" /> {inst.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(inst.specialties || []).map((s: string) => (
                          <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {activityTypeLabels[s] || s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-foreground">{formatEur(Number(inst.hourly_cost))}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", instructorStatusColors[inst.status])}>
                        {instructorStatusLabels[inst.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <InstructorFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
    </div>
  );
}
