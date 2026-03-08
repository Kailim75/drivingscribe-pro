import { motion } from "framer-motion";
import { Plus, Car, Wrench, AlertTriangle } from "lucide-react";
import { vehicles, lessons, type VehicleStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusConfig: Record<VehicleStatus, { label: string; color: string; icon: React.ElementType }> = {
  actif: { label: "Actif", color: "bg-success/10 text-success", icon: Car },
  indisponible: { label: "Indisponible", color: "bg-warning/10 text-warning", icon: AlertTriangle },
  maintenance: { label: "Maintenance", color: "bg-destructive/10 text-destructive", icon: Wrench },
  archivé: { label: "Archivé", color: "bg-muted text-muted-foreground", icon: Car },
};

export default function Vehicles() {
  const stats = vehicles.map((v) => {
    const vLessons = lessons.filter((l) => l.vehicleId === v.id);
    const done = vLessons.filter((l) => l.status === "effectué");
    const planned = vLessons.filter((l) => l.status === "prévu");
    const totalHours = done.reduce((s, l) => s + l.durationHours, 0);
    return { ...v, totalHours, lessonsDone: done.length, lessonsPlanned: planned.length };
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Véhicules</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{vehicles.length} véhicules</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nouveau véhicule
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((v) => {
          const cfg = statusConfig[v.status];
          const Icon = cfg.icon;
          return (
            <div key={v.id} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{v.brand} {v.model}</p>
                  <p className="text-xs text-muted-foreground font-mono">{v.plate}</p>
                </div>
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", cfg.color)}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground mb-4 capitalize">{v.category}</p>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-secondary/50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-foreground">{v.totalHours}h</p>
                  <p className="text-[10px] text-muted-foreground">Utilisé</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-2 text-center">
                  <p className="text-base font-bold text-foreground">{v.monthlyCost} €</p>
                  <p className="text-[10px] text-muted-foreground">/mois</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
                <span>{v.lessonsDone} effectuée{v.lessonsDone > 1 ? "s" : ""}</span>
                <span>·</span>
                <span>{v.lessonsPlanned} prévue{v.lessonsPlanned > 1 ? "s" : ""}</span>
              </div>

              {v.notes && <p className="text-xs text-muted-foreground mt-2">{v.notes}</p>}
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
