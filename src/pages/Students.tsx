import { motion } from "framer-motion";
import { Search, Plus, Phone, Mail, MoreHorizontal, Loader2, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useStudents } from "@/hooks/useStudents";
import { useAuditLog } from "@/hooks/useAuditLog";
import { studentStatusLabels, studentStatusColors, activityTypeLabels, activityTypeColors } from "@/lib/labels";
import StudentFormDialog from "@/components/students/StudentFormDialog";

export default function Students() {
  const { students, isLoading, create } = useStudents();
  const { log } = useAuditLog();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);

  const filtered = students.filter((s) => {
    const matchSearch = `${s.first_name} ${s.last_name} ${s.email}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "student", details: `${data.first_name} ${data.last_name}` });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Élèves</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{students.length} élève{students.length > 1 ? "s" : ""} enregistré{students.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nouvel élève
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève..."
            className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_pause">En pause</option>
          <option value="termine">Terminé</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">{students.length === 0 ? "Aucun élève" : "Aucun résultat"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {students.length === 0 ? "Créez votre premier élève pour commencer" : "Essayez avec d'autres critères"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Élève</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Activité</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Statut</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((student) => (
                  <tr key={student.id} onClick={() => navigate(`/eleves/${student.id}`)}
                    className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{student.first_name} {student.last_name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {student.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>}
                        {student.email && <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" /> {student.email}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", activityTypeColors[student.activity_type] || "bg-muted text-muted-foreground")}>
                        {activityTypeLabels[student.activity_type] || student.activity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", studentStatusColors[student.status])}>
                        {studentStatusLabels[student.status]}
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

      <StudentFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
    </div>
  );
}
