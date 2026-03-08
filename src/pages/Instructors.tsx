import { motion } from "framer-motion";
import { Plus, Phone, Mail, Star, Clock, CalendarDays } from "lucide-react";
import { instructors, lessons, type InstructorStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusColors: Record<InstructorStatus, string> = {
  actif: "bg-success/10 text-success",
  inactif: "bg-muted text-muted-foreground",
  archivé: "bg-muted text-muted-foreground",
};

export default function Instructors() {
  // Calculate stats per instructor
  const stats = instructors.map((inst) => {
    const instLessons = lessons.filter((l) => l.instructorId === inst.id);
    const done = instLessons.filter((l) => l.status === "effectué");
    const planned = instLessons.filter((l) => l.status === "prévu");
    const totalHours = done.reduce((s, l) => s + l.durationHours, 0);
    const revenue = done.reduce((s, l) => s + l.billedAmount, 0);
    return { ...inst, lessonsDone: done.length, lessonsPlanned: planned.length, totalHours, revenue };
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Formateurs</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{instructors.length} formateurs</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nouveau formateur
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((inst) => (
          <div key={inst.id} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-foreground">
                  {inst.firstName[0]}{inst.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{inst.firstName} {inst.lastName}</p>
                  <p className="text-xs text-muted-foreground">{inst.specialties.join(", ")}</p>
                </div>
              </div>
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", statusColors[inst.status])}>
                {inst.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{inst.phone}</span>
              <span className="flex items-center gap-1 hidden sm:flex"><Mail className="w-3 h-3" />{inst.email.split("@")[0]}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{inst.totalHours}h</p>
                <p className="text-[10px] text-muted-foreground">Heures réalisées</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{inst.lessonsPlanned}</p>
                <p className="text-[10px] text-muted-foreground">Séances prévues</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{inst.hourlyCost} €/h</p>
                <p className="text-[10px] text-muted-foreground">Coût horaire</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-foreground">{inst.lessonsDone}</p>
                <p className="text-[10px] text-muted-foreground">Séances effectuées</p>
              </div>
            </div>

            {inst.notes && (
              <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">{inst.notes}</p>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
