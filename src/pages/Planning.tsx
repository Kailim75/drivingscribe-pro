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
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Planning</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {sortedLessons.length} séance{sortedLessons.length > 1 ? "s" : ""}
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
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Séance
          </button>
        </div>
      </div>

      {/* Date navigator */}
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
              <div key={lesson.id} className="glass-card rounded-xl p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Time */}
                  <div className="w-16 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-foreground">{lesson.start_time?.slice(0, 5)}</p>
                    <p className="text-[10px] text-muted-foreground">{lesson.end_time?.slice(0, 5)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.duration_hours}h</p>
                  </div>
                  <div className="w-px h-12 bg-border self-center flex-shrink-0" />
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">
                        {lesson.students?.first_name} {lesson.students?.last_name}
                      </p>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", lessonStatusColors[lesson.status])}>
                        <Icon className="w-3 h-3" />{lessonStatusLabels[lesson.status]}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      <span>🚗 {lesson.vehicles?.brand} {lesson.vehicles?.model}</span>
                      <span>👤 {lesson.instructors?.first_name} {lesson.instructors?.last_name}</span>
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
                  {/* Quick actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    {lesson.status === "prevu" && (
                      <>
                        <button onClick={() => handleStatusChange(lesson.id, "effectue")}
                          className="text-[10px] px-2 py-1 rounded bg-success/10 text-success hover:bg-success/20 transition-colors font-medium">
                          ✓ Effectué
                        </button>
                        <button onClick={() => handleStatusChange(lesson.id, "annule")}
                          className="text-[10px] px-2 py-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium">
                          ✗ Annulé
                        </button>
                        <button onClick={() => handleStatusChange(lesson.id, "absent")}
                          className="text-[10px] px-2 py-1 rounded bg-warning/10 text-warning hover:bg-warning/20 transition-colors font-medium">
                          ⚠ Absent
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
