import { motion } from "framer-motion";
import { Bell, Plus, Send, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";
import { reminders, getStudentName, formatDate, type Reminder } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusConfig = {
  planifié: { label: "Planifié", color: "bg-info/10 text-info", icon: Clock },
  envoyé: { label: "Envoyé", color: "bg-success/10 text-success", icon: CheckCircle2 },
  échoué: { label: "Échoué", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const typeLabels = {
  séance: "Rappel séance",
  impayé: "Relance impayé",
  document: "Rappel document",
  autre: "Autre",
};

export default function Reminders() {
  const planned = reminders.filter((r) => r.status === "planifié");
  const sent = reminders.filter((r) => r.status !== "planifié");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rappels & Relances</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{planned.length} planifié{planned.length > 1 ? "s" : ""} · {sent.length} envoyé{sent.length > 1 ? "s" : ""}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nouveau rappel
        </button>
      </div>

      {/* Planned */}
      {planned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">À envoyer</h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {planned.map((rem) => (
              <ReminderCard key={rem.id} reminder={rem} />
            ))}
          </motion.div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Historique</h2>
        <div className="space-y-2">
          {sent.map((rem) => (
            <ReminderCard key={rem.id} reminder={rem} />
          ))}
        </div>
      </div>

      {/* Future channels info */}
      <div className="glass-card rounded-xl p-4 border-dashed">
        <p className="text-xs text-muted-foreground text-center">
          📧 Email disponible · 📱 SMS et WhatsApp prévus en v2
        </p>
      </div>
    </div>
  );
}

function ReminderCard({ reminder }: { reminder: Reminder }) {
  const cfg = statusConfig[reminder.status];
  const Icon = cfg.icon;
  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-4 hover:border-primary/20 transition-colors">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {typeLabels[reminder.type]}
          </span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Mail className="w-3 h-3" />Email</span>
        </div>
        <p className="text-sm text-foreground mt-1.5">{reminder.message}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {reminder.studentId && <span>{getStudentName(reminder.studentId)}</span>}
          <span>{reminder.sentAt ? `Envoyé le ${formatDate(reminder.sentAt)}` : `Prévu le ${formatDate(reminder.scheduledAt)}`}</span>
        </div>
      </div>
      {reminder.status === "planifié" && (
        <button className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          <Send className="w-3 h-3" /> Envoyer
        </button>
      )}
    </div>
  );
}
