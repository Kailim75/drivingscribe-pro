import { motion } from "framer-motion";
import { Search, Plus, Filter, MoreHorizontal, Phone, Mail } from "lucide-react";
import { useState } from "react";

type StudentStatus = "actif" | "en pause" | "terminé" | "archivé";
type ActivityType = "auto-école" | "taxi" | "vtc" | "vmdtr";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  activityType: ActivityType;
  status: StudentStatus;
  hoursBought: number;
  hoursDone: number;
  hoursRemaining: number;
  formula: string;
  balance: number;
}

const mockStudents: Student[] = [
  { id: "1", firstName: "Marie", lastName: "Dupont", phone: "06 12 34 56 78", email: "marie@email.com", activityType: "auto-école", status: "actif", hoursBought: 30, hoursDone: 18, hoursRemaining: 12, formula: "Pack 30h", balance: 0 },
  { id: "2", firstName: "Karim", lastName: "Bensaid", phone: "06 23 45 67 89", email: "karim@email.com", activityType: "taxi", status: "actif", hoursBought: 20, hoursDone: 18, hoursRemaining: 2, formula: "Pack 20h", balance: -150 },
  { id: "3", firstName: "Sophie", lastName: "Martin", phone: "06 34 56 78 90", email: "sophie@email.com", activityType: "auto-école", status: "en pause", hoursBought: 25, hoursDone: 10, hoursRemaining: 15, formula: "Forfait B", balance: -450 },
  { id: "4", firstName: "Lucas", lastName: "Petit", phone: "06 45 67 89 01", email: "lucas@email.com", activityType: "vtc", status: "actif", hoursBought: 40, hoursDone: 32, hoursRemaining: 8, formula: "Pack 40h", balance: 0 },
  { id: "5", firstName: "Amina", lastName: "Youssef", phone: "06 56 78 90 12", email: "amina@email.com", activityType: "vmdtr", status: "actif", hoursBought: 15, hoursDone: 5, hoursRemaining: 10, formula: "À l'heure", balance: 0 },
  { id: "6", firstName: "Thomas", lastName: "Bernard", phone: "06 67 89 01 23", email: "thomas@email.com", activityType: "auto-école", status: "terminé", hoursBought: 30, hoursDone: 30, hoursRemaining: 0, formula: "Forfait B", balance: 0 },
];

const statusColors: Record<StudentStatus, string> = {
  "actif": "bg-success/10 text-success",
  "en pause": "bg-warning/10 text-warning",
  "terminé": "bg-muted text-muted-foreground",
  "archivé": "bg-muted text-muted-foreground",
};

const activityColors: Record<ActivityType, string> = {
  "auto-école": "bg-info/10 text-info",
  "taxi": "bg-primary/10 text-primary",
  "vtc": "bg-success/10 text-success",
  "vmdtr": "bg-accent/10 text-accent",
};

export default function Students() {
  const [search, setSearch] = useState("");

  const filtered = mockStudents.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Élèves</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{mockStudents.length} élèves enregistrés</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nouvel élève
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un élève..."
            className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
        <button className="inline-flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm border border-border hover:bg-secondary/80 transition-colors">
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>

      {/* Table */}
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
              {filtered.map((student) => (
                <tr
                  key={student.id}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{student.firstName} {student.lastName}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {student.phone}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 hidden sm:flex">
                          <Mail className="w-3 h-3" /> {student.email}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${activityColors[student.activityType]}`}>
                      {student.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                    {student.formula}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span className="font-semibold text-foreground">{student.hoursDone}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-muted-foreground">{student.hoursBought}h</span>
                    </div>
                    {student.hoursRemaining <= 3 && student.status === "actif" && (
                      <p className="text-[10px] text-warning mt-0.5">Reste {student.hoursRemaining}h</p>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusColors[student.status]}`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    {student.balance < 0 ? (
                      <span className="text-destructive font-medium">{student.balance} €</span>
                    ) : (
                      <span className="text-muted-foreground">OK</span>
                    )}
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
