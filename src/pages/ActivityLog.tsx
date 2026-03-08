import { motion } from "framer-motion";
import { ClipboardList, Search } from "lucide-react";
import { useState } from "react";
import { auditLogs, formatDateTime } from "@/data/mockData";

const entityIcons: Record<string, string> = {
  lesson: "📅",
  payment: "💳",
  invoice: "📄",
  reminder: "🔔",
  student: "👤",
  vehicle: "🚗",
};

export default function ActivityLog() {
  const [search, setSearch] = useState("");

  const sorted = [...auditLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const filtered = sorted.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) || l.details.toLowerCase().includes(search.toLowerCase()) || l.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Journal d'activité</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Historique des actions importantes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans le journal..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1">
        {filtered.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors">
            <span className="text-lg flex-shrink-0 mt-0.5">{entityIcons[log.entity] || "📌"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{log.action}</span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span>{log.userName}</span>
                <span>·</span>
                <span>{formatDateTime(log.timestamp)}</span>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ClipboardList className="w-10 h-10 opacity-40 mb-3" />
            <p className="text-sm">Aucune entrée trouvée</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
