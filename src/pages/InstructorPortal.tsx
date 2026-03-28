import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, XCircle, UserX, Clock, Loader2, Star, ChevronLeft, ChevronRight, MessageSquare, BarChart3, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useSkillCategories, useSkillEvaluations } from "@/hooks/useSkills";
import { useAuth } from "@/contexts/AuthContext";
import { lessonStatusLabels, lessonStatusColors } from "@/lib/labels";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import SkillEvaluationDialog from "@/components/students/SkillEvaluationDialog";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const statusIcons: Record<string, React.ElementType> = {
  prevu: Clock, effectue: CheckCircle2, annule: XCircle, absent: UserX,
};

function getWeekDates(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function InstructorPortal() {
  const { user } = useAuth();
  const { instructors } = useInstructors();
  const myInstructor = instructors.find((i) => i.user_id === user?.id);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusConfirm, setStatusConfirm] = useState<{ lessonId: string; status: string; label: string } | null>(null);
  const [evalLesson, setEvalLesson] = useState<any>(null);
  const [viewTab, setViewTab] = useState("jour");
  const { log } = useAuditLog();

  const dateStr = selectedDate.toISOString().split("T")[0];
  const { lessons, isLoading, updateStatus } = useLessons(myInstructor ? { date: dateStr, instructorId: myInstructor.id } : { date: dateStr });
  
  // Get all lessons for the week for weekly view & stats
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);
  const weekStart = weekDates[0].toISOString().split("T")[0];
  const weekEnd = weekDates[6].toISOString().split("T")[0];
  const { lessons: weekLessons } = useLessons(myInstructor ? { instructorId: myInstructor.id, dateFrom: weekStart, dateTo: weekEnd } : { dateFrom: weekStart, dateTo: weekEnd });
  
  const weekFilteredLessons = useMemo(() => 
    weekLessons.filter((l: any) => l.date >= weekStart && l.date <= weekEnd),
    [weekLessons, weekStart, weekEnd]
  );

  const { students } = useStudents();
  const { categories } = useSkillCategories();
  const { evaluate } = useSkillEvaluations(evalLesson?.student_id);

  // Stats
  const stats = useMemo(() => {
    const thisWeek = weekFilteredLessons;
    const done = thisWeek.filter((l: any) => l.status === "effectue");
    const planned = thisWeek.filter((l: any) => l.status === "prevu");
    const cancelled = thisWeek.filter((l: any) => l.status === "annule" || l.status === "absent");
    const hoursDone = done.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
    const hoursPlanned = planned.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
    const uniqueStudents = new Set(thisWeek.map((l: any) => l.student_id)).size;
    return { done: done.length, planned: planned.length, cancelled: cancelled.length, hoursDone, hoursPlanned, uniqueStudents };
  }, [weekFilteredLessons]);

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const navigateWeek = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir * 7);
    setSelectedDate(d);
  };

  const confirmStatus = (lessonId: string, status: string) => {
    const labels: Record<string, string> = { effectue: "Effectué", annule: "Annulé", absent: "Absent" };
    setStatusConfirm({ lessonId, status, label: labels[status] || status });
  };

  const handleStatusChange = (lessonId: string, status: string) => {
    updateStatus.mutate(
      { id: lessonId, status: status as any },
      {
        onSuccess: () => {
          setStatusConfirm(null);
          log({ action: "update_status", entity: "lesson", entity_id: lessonId, details: `Statut → ${lessonStatusLabels[status]}` });
          if (status === "effectue") {
            const lesson = lessons.find((l: any) => l.id === lessonId);
            if (lesson && categories.length > 0) setEvalLesson(lesson);
          }
        },
      }
    );
  };

  const handleEvalSubmit = (evaluations: { category_id: string; score: number }[]) => {
    if (!evalLesson) return;
    evaluate.mutate(
      { student_id: evalLesson.student_id, lesson_id: evalLesson.id, instructor_id: myInstructor?.id, evaluations },
      { onSuccess: () => setEvalLesson(null) }
    );
  };

  const sortedLessons = [...lessons].sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));

  if (!myInstructor) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto">
        <div className="glass-card rounded-xl p-8 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Portail Formateur</h2>
          <p className="text-sm text-muted-foreground mt-2">Votre compte n'est pas lié à un profil formateur. Contactez votre administrateur.</p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  const renderLessonCard = (lesson: any) => {
    const Icon = statusIcons[lesson.status] || Clock;
    const student = students.find((s) => s.id === lesson.student_id);
    return (
      <div key={lesson.id} className="glass-card rounded-xl p-4 hover:border-primary/20 transition-colors">
        <div className="flex items-start gap-3">
          <div className="w-14 flex-shrink-0 text-center">
            <p className="text-sm font-bold text-foreground">{lesson.start_time?.slice(0, 5)}</p>
            <p className="text-[10px] text-muted-foreground">{lesson.end_time?.slice(0, 5)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{lesson.duration_hours}h</p>
          </div>
          <div className="w-px h-10 bg-border self-center flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground text-sm truncate">
                {lesson.students?.first_name} {lesson.students?.last_name}
              </p>
              <span className={cn("status-badge inline-flex items-center gap-1", lessonStatusColors[lesson.status])}>
                <Icon className="w-3 h-3" />{lessonStatusLabels[lesson.status]}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">🚗 {lesson.vehicles?.brand} {lesson.vehicles?.model}</p>
            {lesson.note && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                <MessageSquare className="w-3 h-3 flex-shrink-0" /> {lesson.note}
              </p>
            )}
            {student?.phone && <p className="text-xs text-muted-foreground mt-0.5">📱 {student.phone}</p>}
            {lesson.status === "prevu" && (
              <div className="flex items-center gap-1.5 mt-2.5">
                <button onClick={() => confirmStatus(lesson.id, "effectue")} className="text-xs px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/15 transition-colors font-medium">✓ Effectué</button>
                <button onClick={() => confirmStatus(lesson.id, "annule")} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors font-medium">✗ Annulé</button>
                <button onClick={() => confirmStatus(lesson.id, "absent")} className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors font-medium">⚠ Absent</button>
              </div>
            )}
            {lesson.status === "effectue" && categories.length > 0 && (
              <button onClick={() => setEvalLesson(lesson)} className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium flex items-center gap-1">
                <Star className="w-3 h-3" /> Évaluer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto space-y-4">
      <div>
        <h1 className="page-title">Mon Planning</h1>
        <p className="page-subtitle">Bonjour {myInstructor.first_name}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1"><Clock className="w-3.5 h-3.5" /><span className="text-[11px]">Heures</span></div>
          <p className="text-lg font-bold text-foreground">{stats.hoursDone}<span className="text-sm font-normal text-muted-foreground">/{stats.hoursDone + stats.hoursPlanned}h</span></p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1"><CheckCircle2 className="w-3.5 h-3.5" /><span className="text-[11px]">Effectuées</span></div>
          <p className="text-lg font-bold text-success">{stats.done}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1"><CalendarDays className="w-3.5 h-3.5" /><span className="text-[11px]">Prévues</span></div>
          <p className="text-lg font-bold text-foreground">{stats.planned}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1"><Users className="w-3.5 h-3.5" /><span className="text-[11px]">Élèves</span></div>
          <p className="text-lg font-bold text-foreground">{stats.uniqueStudents}</p>
        </div>
      </div>

      {/* View tabs */}
      <Tabs value={viewTab} onValueChange={setViewTab}>
        <TabsList className="w-full">
          <TabsTrigger value="jour" className="flex-1">Jour</TabsTrigger>
          <TabsTrigger value="semaine" className="flex-1">Semaine</TabsTrigger>
        </TabsList>

        <TabsContent value="jour" className="space-y-3 mt-3">
          {/* Day navigator */}
          <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
            <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <button onClick={() => setSelectedDate(new Date())} className="text-xs text-primary hover:underline">Aujourd'hui</button>
            </div>
            <button onClick={() => navigate(1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-muted-foreground">{sortedLessons.length} séance{sortedLessons.length !== 1 ? "s" : ""}</p>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {sortedLessons.length === 0 ? (
              <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-foreground">Pas de séance</p>
                <p className="text-sm text-muted-foreground mt-1">Aucune séance prévue pour cette date</p>
              </div>
            ) : sortedLessons.map(renderLessonCard)}
          </motion.div>
        </TabsContent>

        <TabsContent value="semaine" className="space-y-3 mt-3">
          {/* Week navigator */}
          <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
            <button onClick={() => navigateWeek(-1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Semaine du {weekDates[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} au {weekDates[6].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
              </p>
              <button onClick={() => setSelectedDate(new Date())} className="text-xs text-primary hover:underline">Cette semaine</button>
            </div>
            <button onClick={() => navigateWeek(1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {weekDates.map((day) => {
              const dayStr = day.toISOString().split("T")[0];
              const dayLessons = weekFilteredLessons
                .filter((l: any) => l.date === dayStr)
                .sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));
              const isToday = dayStr === new Date().toISOString().split("T")[0];
              return (
                <div key={dayStr}>
                  <div className={cn("flex items-center gap-2 mb-1.5", isToday && "text-primary")}>
                    <p className={cn("text-xs font-semibold uppercase", isToday ? "text-primary" : "text-muted-foreground")}>
                      {day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" })}
                    </p>
                    <span className="text-[10px] text-muted-foreground">{dayLessons.length} séance{dayLessons.length !== 1 ? "s" : ""}</span>
                    {isToday && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Aujourd'hui</span>}
                  </div>
                  {dayLessons.length === 0 ? (
                    <div className="glass-card rounded-lg p-3 text-center text-xs text-muted-foreground">Pas de séance</div>
                  ) : (
                    <div className="space-y-1.5">{dayLessons.map(renderLessonCard)}</div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Status confirmation */}
      <AlertDialog open={!!statusConfirm} onOpenChange={(v) => !v && setStatusConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement</AlertDialogTitle>
            <AlertDialogDescription>Marquer cette séance comme « {statusConfirm?.label} » ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => statusConfirm && handleStatusChange(statusConfirm.lessonId, statusConfirm.status)}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SkillEvaluationDialog open={!!evalLesson} onClose={() => setEvalLesson(null)} categories={categories} onSubmit={handleEvalSubmit} loading={evaluate.isPending} />
    </div>
  );
}
