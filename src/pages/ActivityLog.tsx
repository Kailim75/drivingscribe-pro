import { motion } from "framer-motion";
import { ClipboardList, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

const entityIcons: Record<string, string> = {
  lesson: "📅",
  payment: "💳",
  invoice: "📄",
  reminder: "🔔",
  student: "👤",
  vehicle: "🚗",
  document: "📎",
  import: "📥",
};

const formatDateTime = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function ActivityLog() {
  const { organization } = useOrg();
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit_logs", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("organization_id", organization!.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const filtered = logs.filter((l) =>
    l.action.toLowerCase().includes(search.toLowerCase()) || (l.details || "").toLowerCase().includes(search.toLowerCase()) || (l.user_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-5">
      <div>
        <h1 className="page-title">Journal</h1>
        <p className="page-subtitle">Historique des actions importantes</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans le journal..." className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-shadow" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl divide-y divide-border/60">
        {filtered.map((log) => (
          <div key={log.id} className="flex items-start gap-3 p-4 hover:bg-accent/30 transition-colors">
            <span className="text-lg flex-shrink-0 mt-0.5">{entityIcons[log.entity] || "📌"}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground"><span className="font-semibold">{log.action}</span></p>
              {log.details && <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                <span className="font-medium">{log.user_name || "Système"}</span>
                <span>·</span>
                <span>{formatDateTime(log.created_at)}</span>
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