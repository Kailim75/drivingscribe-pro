import { motion } from "framer-motion";
import { Search, Plus, Phone, Mail, Loader2, UserCog, Pencil, Archive } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useInstructors } from "@/hooks/useInstructors";
import { useAuditLog } from "@/hooks/useAuditLog";
import { instructorStatusLabels, instructorStatusColors, activityTypeLabels, formatEur } from "@/lib/labels";
import InstructorFormDialog from "@/components/instructors/InstructorFormDialog";
import InstructorAvailabilityDialog from "@/components/instructors/InstructorAvailabilityDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, CalendarClock } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Instructors() {
  const { instructors, isLoading, create, update } = useInstructors();
  const { log } = useAuditLog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [editInstructor, setEditInstructor] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [availabilityInstructor, setAvailabilityInstructor] = useState<any>(null);

  const filtered = instructors.filter((i) => {
    const matchSearch = `${i.first_name} ${i.last_name} ${i.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" ? i.status !== "archive" : i.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (data: any) => {
    create.mutate(data, { onSuccess: () => { setShowForm(false); log({ action: "create", entity: "instructor", details: `${data.first_name} ${data.last_name}` }); } });
  };

  const handleEdit = (data: any) => {
    if (!editInstructor) return;
    update.mutate({ id: editInstructor.id, ...data }, { onSuccess: () => { setEditInstructor(null); log({ action: "update", entity: "instructor", entity_id: editInstructor.id, details: `${data.first_name} ${data.last_name}` }); } });
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    const newStatus = archiveTarget.status === "archive" ? "actif" : "archive";
    update.mutate({ id: archiveTarget.id, status: newStatus }, {
      onSuccess: () => {
        setArchiveTarget(null);
        log({ action: "update_status", entity: "instructor", entity_id: archiveTarget.id, details: `Statut → ${instructorStatusLabels[newStatus]}` });
      },
    });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Formateurs</h1>
          <p className="page-subtitle">{instructors.length} formateur{instructors.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouveau formateur
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un formateur..."
            className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-colors" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="inactif">Inactif</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UserCog className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">{instructors.length === 0 ? "Aucun formateur" : "Aucun résultat"}</p>
            <p className="text-sm text-muted-foreground mt-1">{instructors.length === 0 ? "Ajoutez votre premier formateur" : "Essayez avec d'autres critères"}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm data-table">
              <thead>
                <tr className="border-b border-border text-left">
                  <th>Formateur</th>
                  <th className="hidden md:table-cell">Spécialités</th>
                  <th className="hidden lg:table-cell">Coût/h</th>
                  <th className="hidden sm:table-cell">Statut</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inst) => (
                  <tr key={inst.id} className="cursor-pointer">
                    <td>
                      <p className="font-medium text-foreground">{inst.first_name} {inst.last_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {inst.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {inst.phone}</span>}
                        {inst.email && <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" /> {inst.email}</span>}
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(inst.specialties || []).map((s: string) => (
                          <span key={s} className="status-badge bg-muted text-muted-foreground">{activityTypeLabels[s] || s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="hidden lg:table-cell text-foreground">{formatEur(Number(inst.hourly_cost))}</td>
                    <td className="hidden sm:table-cell">
                      <span className={cn("status-badge", instructorStatusColors[inst.status])}>{instructorStatusLabels[inst.status]}</span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditInstructor(inst)}><Pencil className="w-3.5 h-3.5 mr-2" /> Modifier</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchiveTarget(inst)} className={inst.status === "archive" ? "text-success" : "text-destructive"}>
                            <Archive className="w-3.5 h-3.5 mr-2" /> {inst.status === "archive" ? "Réactiver" : "Supprimer"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <InstructorFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
      <InstructorFormDialog open={!!editInstructor} onClose={() => setEditInstructor(null)} onSubmit={handleEdit} loading={update.isPending} initial={editInstructor} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.status === "archive" ? "Réactiver ce formateur ?" : "Supprimer ce formateur ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.status === "archive"
                ? `${archiveTarget?.first_name} ${archiveTarget?.last_name} sera de nouveau actif.`
                : `${archiveTarget?.first_name} ${archiveTarget?.last_name} sera archivé et n'apparaîtra plus dans les listes actives. Vous pourrez le réactiver à tout moment.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {archiveTarget?.status === "archive" ? "Réactiver" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
