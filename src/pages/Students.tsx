import { motion } from "framer-motion";
import { Search, Plus, Phone, Mail, MoreHorizontal, Loader2, Users, MessageCircle, Pencil, Archive } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useStudents } from "@/hooks/useStudents";
import { useLessons } from "@/hooks/useLessons";
import { useStudentFormulas } from "@/hooks/useStudentFormulas";
import { useSkillCategories, useSkillEvaluations } from "@/hooks/useSkills";
import { computeHealthScore } from "@/hooks/useStudentHealthScore";
import StudentHealthBadge from "@/components/students/StudentHealthBadge";
import { useAuditLog } from "@/hooks/useAuditLog";
import { studentStatusLabels, studentStatusColors, activityTypeLabels, activityTypeColors } from "@/lib/labels";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import { PaginationControls, usePagination } from "@/components/PaginationControls";
import type { StudentFormData } from "@/lib/validations";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Students() {
  const { students, isLoading, create, update, archive } = useStudents();
  const { lessons } = useLessons({});
  const { formulas } = useStudentFormulas();
  const { categories } = useSkillCategories();
  const { log } = useAuditLog();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [activityFilter, setActivityFilter] = useState("tous");
  const [editStudent, setEditStudent] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);
  const [page, setPage] = useState(1);

  const filtered = students.filter((s) => {
    const matchSearch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" ? s.status !== "archive" : s.status === statusFilter;
    const matchActivity = activityFilter === "tous" || s.activity_type === activityFilter;
    return matchSearch && matchStatus && matchActivity;
  });

  const { paginated, total } = usePagination(filtered, page);

  // Reset page when filters change
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleStatusFilter = (v: string) => { setStatusFilter(v); setPage(1); };
  const handleActivityFilter = (v: string) => { setActivityFilter(v); setPage(1); };

  const handleCreate = (data: StudentFormData & { payer_id?: string | null }) => {
    const { payer_id, ...studentData } = data;
    create.mutate({ ...studentData, payer_id: payer_id || null } as any, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "student", details: `${data.first_name} ${data.last_name}` });
      },
    });
  };

  const handleEdit = (data: StudentFormData & { payer_id?: string | null }) => {
    if (!editStudent) return;
    const { payer_id, ...studentData } = data;
    update.mutate({ id: editStudent.id, ...studentData, payer_id: payer_id || null } as any, {
      onSuccess: () => {
        setEditStudent(null);
        log({ action: "update", entity: "student", entity_id: editStudent.id, details: `${data.first_name} ${data.last_name}` });
      },
    });
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    const newStatus = archiveTarget.status === "archive" ? "actif" : "archive";
    update.mutate({ id: archiveTarget.id, status: newStatus }, {
      onSuccess: () => {
        setArchiveTarget(null);
        log({ action: "archive", entity: "student", entity_id: archiveTarget.id, details: `${archiveTarget.first_name} ${archiveTarget.last_name} → ${newStatus}` });
      },
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Élèves</h1>
          <p className="page-subtitle">{students.length} élève{students.length > 1 ? "s" : ""} enregistré{students.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvel élève
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)} placeholder="Rechercher un élève..."
            className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-colors" />
        </div>
        <select value={statusFilter} onChange={(e) => handleStatusFilter(e.target.value)}
          className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_pause">En pause</option>
          <option value="termine">Terminé</option>
          <option value="archive">Archivé</option>
        </select>
        <select value={activityFilter} onChange={(e) => handleActivityFilter(e.target.value)}
          className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Toutes les activités</option>
          <option value="taxi">Taxi</option>
          <option value="vtc">VTC</option>
          <option value="vmdtr">VMDTR</option>
          <option value="auto_ecole">Auto-école</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">{students.length === 0 ? "Aucun élève" : "Aucun résultat"}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {students.length === 0 ? "Créez votre premier élève pour commencer" : "Essayez avec d'autres critères"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm data-table">
                <thead>
                   <tr className="border-b border-border text-left">
                     <th>Élève</th>
                     <th className="hidden lg:table-cell">Santé</th>
                     <th className="hidden md:table-cell">Activité</th>
                     <th className="hidden sm:table-cell">Statut</th>
                     <th className="w-10"></th>
                   </tr>
                 </thead>
                 <tbody>
                   {paginated.map((student) => {
                     const sLessons = lessons.filter((l: any) => l.student_id === student.id);
                     const sFormulas = formulas.filter((f: any) => f.student_id === student.id);
                     const score = computeHealthScore(sLessons, sFormulas, [], categories.length);
                     return (
                     <tr key={student.id} onClick={() => navigate(`/eleves/${student.id}`)}
                       className="cursor-pointer">
                       <td>
                         <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
                         <div className="flex items-center gap-3 mt-0.5">
                           {student.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>}
                           {student.email && <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" /> {student.email}</span>}
                         </div>
                       </td>
                       <td className="hidden lg:table-cell">
                         <StudentHealthBadge score={score} compact />
                       </td>
                       <td className="hidden md:table-cell">
                         <span className={cn("status-badge", activityTypeColors[student.activity_type] || "bg-muted text-muted-foreground")}>
                           {activityTypeLabels[student.activity_type] || student.activity_type}
                         </span>
                       </td>
                       <td className="hidden sm:table-cell">
                         <span className={cn("status-badge", studentStatusColors[student.status])}>
                           {studentStatusLabels[student.status]}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {student.phone && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const cleaned = student.phone.replace(/[\s\-().]/g, "");
                                const phone = cleaned.startsWith("+") ? cleaned : cleaned.startsWith("0") && cleaned.length === 10 ? "+33" + cleaned.slice(1) : cleaned;
                                window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank");
                              }}
                              title="WhatsApp"
                              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#25D366]/10 text-[#25D366] transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditStudent(student); }}>
                                <Pencil className="w-3.5 h-3.5 mr-2" /> Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setArchiveTarget(student); }} className={student.status === "archive" ? "text-success" : "text-warning"}>
                                <Archive className="w-3.5 h-3.5 mr-2" /> {student.status === "archive" ? "Réactiver" : "Supprimer"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <PaginationControls page={page} total={total} onChange={setPage} />
          </>
        )}
      </motion.div>

      <StudentFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
      <StudentFormDialog open={!!editStudent} onClose={() => setEditStudent(null)} onSubmit={handleEdit} loading={update.isPending} initial={editStudent} />

      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.status === "archive" ? "Réactiver cet élève ?" : "Supprimer cet élève ?"}
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
