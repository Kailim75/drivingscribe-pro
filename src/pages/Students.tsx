import { motion } from "framer-motion";
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail } from "lucide-react";
import { useState } from "react";
import { students, studentFormulas, formatEur, type StudentStatus, type ActivityType } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusColors: Record<StudentStatus, string> = {
  actif: "bg-success/10 text-success",
  en_pause: "bg-warning/10 text-warning",
  "terminé": "bg-muted text-muted-foreground",
  "archivé": "bg-muted text-muted-foreground",
};

const statusLabels: Record<StudentStatus, string> = {
  actif: "Actif",
  en_pause: "En pause",
  "terminé": "Terminé",
  "archivé": "Archivé",
};

const activityColors: Record<ActivityType, string> = {
  "auto-école": "bg-info/10 text-info",
  taxi: "bg-primary/10 text-primary",
  vtc: "bg-success/10 text-success",
  vmdtr: "bg-warning/10 text-warning",
};

export default function Students() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tous");

  const filtered = students.filter((s) => {
    const matchSearch = `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Élèves</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{students.length} élèves enregistrés</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nouvel élève
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="en_pause">En pause</option>
          <option value="terminé">Terminé</option>
          <option value="archivé">Archivé</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Élève</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Activité</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Formule</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Heures</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Statut</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden md:table-cell">Solde</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => {
                const formula = studentFormulas.find((sf) => sf.studentId === student.id && sf.active);
                const invoice = undefined; // Would come from invoices lookup
                return (
                  <tr key={student.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>
                          <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" /> {student.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", activityColors[student.activityType])}>{student.activityType}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground">{formula?.offerName || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {formula ? (
                        <div>
                          <div className="inline-flex items-center gap-1">
                            <span className="font-semibold text-foreground">{formula.hoursDone}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{formula.hoursBought}h</span>
                          </div>
                          {formula.hoursRemaining <= 3 && student.status === "actif" && (
                            <p className="text-[10px] text-warning mt-0.5">Reste {formula.hoursRemaining}h</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[student.status])}>{statusLabels[student.status]}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="text-muted-foreground text-xs">—</span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Aucun élève trouvé</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
