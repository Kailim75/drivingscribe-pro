import { motion } from "framer-motion";
import { useState } from "react";
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, UserX, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { lessons, getStudentName, getInstructorName, getVehicleLabel, type LessonStatus } from "@/data/mockData";

const statusConfig: Record<LessonStatus, { label: string; color: string; icon: React.ElementType }> = {
  "prévu": { label: "Prévu", color: "bg-info/10 text-info", icon: Clock },
  "effectué": { label: "Effectué", color: "bg-success/10 text-success", icon: CheckCircle2 },
  "annulé": { label: "Annulé", color: "bg-destructive/10 text-destructive", icon: XCircle },
  "absent": { label: "Absent", color: "bg-warning/10 text-warning", icon: UserX },
};

type View = "jour" | "liste";

export default function Planning() {
  const [view, setView] = useState<View>("jour");
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = selectedDate.toISOString().split("T")[0];
  const dayLessons = lessons
    .filter((l) => (view === "jour" ? l.date === dateStr : true))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planning</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {dayLessons.length} séance{dayLessons.length > 1 ? "s" : ""}
            {view === "jour" && ` — ${selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button onClick={() => setView("jour")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", view === "jour" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <CalendarDays className="w-3.5 h-3.5 inline mr-1" />Jour
            </button>
            <button onClick={() => setView("liste")} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", view === "liste" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <List className="w-3.5 h-3.5 inline mr-1" />Liste
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Séance
          </button>
        </div>
      </div>

      {/* Date navigator (jour view) */}
      {view === "jour" && (
        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="text-sm font-medium text-primary hover:underline">
            Aujourd'hui
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lessons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {dayLessons.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Aucune séance</p>
            <p className="text-xs text-muted-foreground mt-1">Pas de séance prévue pour cette date</p>
          </div>
        ) : (
          dayLessons.map((lesson) => {
            const cfg = statusConfig[lesson.status];
            const Icon = cfg.icon;
            return (
              <div key={lesson.id} className="glass-card rounded-xl p-4 hover:border-primary/20 transition-colors cursor-pointer">
                <div className="flex items-start gap-4">
                  {/* Time block */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-foreground">{lesson.startTime}</p>
                    <p className="text-[10px] text-muted-foreground">{lesson.endTime}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.durationHours}h</p>
                  </div>
                  <div className="w-px h-12 bg-border self-center flex-shrink-0" />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{getStudentName(lesson.studentId)}</p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", cfg.color)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      <span>🚗 {getVehicleLabel(lesson.vehicleId)}</span>
                      <span>👤 {getInstructorName(lesson.instructorId)}</span>
                    </div>
                    {lesson.note && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" /> {lesson.note}
                      </p>
                    )}
                    {view === "liste" && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(lesson.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                  {/* Quick actions (mobile-friendly) */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {lesson.status === "prévu" && (
                      <>
                        <button className="text-[10px] px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors font-medium">
                          ✓ Effectué
                        </button>
                        <button className="text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium">
                          ✗ Annulé
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>
    </div>
  );
}
