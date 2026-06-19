import { useNavigate } from "react-router-dom";
import { Plus, CalendarDays, FileText, Users, CreditCard, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  onNewLesson?: () => void;
  onNewInvoice?: () => void;
  onNewStudent?: () => void;
}

export default function QuickActions({ onNewLesson, onNewInvoice, onNewStudent }: Props) {
  const navigate = useNavigate();

  const actions = [
    { label: "Nouvelle séance", icon: CalendarDays, color: "bg-primary/10 text-primary hover:bg-primary/15", action: () => onNewLesson ? onNewLesson() : navigate("/planning") },
    { label: "Nouvel élève", icon: Users, color: "bg-success/10 text-success hover:bg-success/15", action: () => onNewStudent ? onNewStudent() : navigate("/eleves") },
    { label: "Nouvelle facture", icon: FileText, color: "bg-info/10 text-info hover:bg-info/15", action: () => onNewInvoice ? onNewInvoice() : navigate("/facturation") },
    { label: "Paiement", icon: CreditCard, color: "bg-warning/10 text-warning hover:bg-warning/15", action: () => navigate("/paiements") },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <h2 className="font-semibold text-foreground text-sm">Actions rapides</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map((a) => (
          <button key={a.label} onClick={a.action}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${a.color}`}>
            <a.icon className="w-4 h-4" />
            <span className="truncate">{a.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
