import { motion } from "framer-motion";
import { useState } from "react";
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, UserX, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuditLog } from "@/hooks/useAuditLog";
import { lessonStatusLabels, lessonStatusColors } from "@/lib/labels";
import LessonFormDialog from "@/components/lessons/LessonFormDialog";

const statusIcons: Record<string, React.ElementType> = {
  prevu: Clock, effectue: CheckCircle2, annule: XCircle, absent: UserX,
};

type View = "jour" | "liste";

export default function Planning() {
  const [view, setView] = useState<View>("jour");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const dateStr = selectedDate.toISOString().split("T")[0];
  const { lessons, isLoading, checkConflicts, create, updateStatus } = useLessons(view === "jour" ? { date: dateStr } : undefined);
  const { students } = useStudents();
  const { instructors } = useInstructors();
  const { vehicles } = useVehicles();
  const { log } = useAuditLog();

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const handleCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "lesson", details: `Séance le ${data.date} de ${data.start_time} à ${data.end_time}` });
      },
    });
  };

  const handleStatusChange = (lessonId: string, status: string) => {
    updateStatus.mutate({ id: lessonId, status }, {
      onSuccess: () => {
        log({ action: "update_status", entity: "lesson", entity_id: lessonId, details: `Statut → ${lessonStatusLabels[status]}` });
      },
    });
  };

  const sortedLessons = [...lessons].sort((a: any, b: any) =>
    (a.date || "").localeCompare(b.date || "") || (a.start_time || "").localeCompare(b.start_time || "")
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Planning</h1>
          <p className="text-muted-foreground text-xs mt-0.5 truncate">
            {sortedLessons.length} séance{sortedLessons.length > 1 ? "s" : ""}
            {view === "jour" && ` — ${selectedDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button onClick={() => setView("jour")} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors", view === "jour" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <CalendarDays className="w-3.5 h-3.5 sm:mr-1 inline" /><span className="hidden sm:inline">Jour</span>
            </button>
            <button onClick={() => setView("liste")} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors", view === "liste" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <List className="w-3.5 h-3.5 sm:mr-1 inline" /><span className="hidden sm:inline">Liste</span>
            </button>
          </div>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity active:scale-95">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Séance</span>
          </button>
        </div>
      </div>

      {/* Date navigator */}
      {view === "jour" && (
        <div className="flex items-center justify-between glass-card rounded-xl px-3 py-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors active:bg-secondary">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="text-sm font-medium text-primary hover:underline px-4 py-1">
            Aujourd'hui
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-md hover:bg-secondary text-muted-foreground transition-colors active:bg-secondary">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Lessons */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {sortedLessons.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Aucune séance</p>
            <p className="text-xs text-muted-foreground mt-1">
              {view === "jour" ? "Pas de séance prévue pour cette date" : "Aucune séance enregistrée"}
            </p>
          </div>
        ) : (
          sortedLessons.map((lesson: any) => {
            const Icon = statusIcons[lesson.status] || Clock;
            return (
              <div key={lesson.id} className="glass-card rounded-xl p-3 sm:p-4 hover:border-primary/20 transition-colors active:bg-card/90">
                {/* Mobile: stacked layout / Desktop: inline */}
                <div className="flex items-start gap-3">
                  {/* Time block */}
                  <div className="w-12 sm:w-16 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-foreground">{lesson.start_time?.slice(0, 5)}</p>
                    <p className="text-[10px] text-muted-foreground">{lesson.end_time?.slice(0, 5)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.duration_hours}h</p>
                  </div>
                  <div className="w-px h-10 bg-border self-center flex-shrink-0" />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground text-sm truncate">
                        {lesson.students?.first_name} {lesson.students?.last_name}
                      </p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1 flex-shrink-0", lessonStatusColors[lesson.status])}>
                        <Icon className="w-3 h-3" />{lessonStatusLabels[lesson.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                      <span className="truncate">🚗 {lesson.vehicles?.brand} {lesson.vehicles?.model}</span>
                      <span className="truncate">👤 {lesson.instructors?.first_name}</span>
                    </div>
                    {lesson.note && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" /> {lesson.note}
                      </p>
                    )}
                    {view === "liste" && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(lesson.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                      </p>
                    )}
                    {/* Quick actions — inline on mobile for easy thumb access */}
                    {lesson.status === "prevu" && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <button onClick={() => handleStatusChange(lesson.id, "effectue")}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 active:bg-success/30 transition-colors font-medium">
                          ✓ Effectué
                        </button>
                        <button onClick={() => handleStatusChange(lesson.id, "annule")}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 active:bg-destructive/30 transition-colors font-medium">
                          ✗ Annulé
                        </button>
                        <button onClick={() => handleStatusChange(lesson.id, "absent")}
                          className="text-[11px] px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 active:bg-warning/30 transition-colors font-medium">
                          ⚠ Absent
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      <LessonFormDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleCreate}
        onCheckConflicts={checkConflicts}
        loading={create.isPending}
        students={students}
        instructors={instructors.filter((i) => i.status === "actif")}
        vehicles={vehicles}
      />
    </div>
  );
}