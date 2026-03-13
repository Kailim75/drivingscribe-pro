import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, XCircle, UserX, Clock, Loader2, Star, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
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

const statusIcons: Record<string, React.ElementType> = {
  prevu: Clock, effectue: CheckCircle2, annule: XCircle, absent: UserX,
};

export default function InstructorPortal() {
  const { user } = useAuth();
  const { instructors } = useInstructors();
  const myInstructor = instructors.find((i) => i.user_id === user?.id);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statusConfirm, setStatusConfirm] = useState<{ lessonId: string; status: string; label: string } | null>(null);
  const [evalLesson, setEvalLesson] = useState<any>(null);
  const { log } = useAuditLog();

  const dateStr = selectedDate.toISOString().split("T")[0];
  const { lessons, isLoading, updateStatus } = useLessons(myInstructor ? { date: dateStr, instructorId: myInstructor.id } : { date: dateStr });
  const { students } = useStudents();
  const { categories } = useSkillCategories();
  const { evaluate } = useSkillEvaluations(evalLesson?.student_id);

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
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
          // If status is effectue, prompt evaluation
          if (status === "effectue") {
            const lesson = lessons.find((l: any) => l.id === lessonId);
            if (lesson && categories.length > 0) {
              setEvalLesson(lesson);
            }
          }
        },
      }
    );
  };

  const handleEvalSubmit = (evaluations: { category_id: string; score: number }[]) => {
    if (!evalLesson) return;
    evaluate.mutate(
      {
        student_id: evalLesson.student_id,
        lesson_id: evalLesson.id,
        instructor_id: myInstructor?.id,
        evaluations,
      },
      { onSuccess: () => setEvalLesson(null) }
    );
  };

  const sortedLessons = [...lessons].sort((a: any, b: any) =>
    (a.start_time || "").localeCompare(b.start_time || "")
  );

  if (!myInstructor) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto">
        <div className="glass-card rounded-xl p-8 text-center">
          <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Portail Formateur</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Votre compte n'est pas lié à un profil formateur. Contactez votre administrateur.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto space-y-4">
      <div>
        <h1 className="page-title">Mon Planning</h1>
        <p className="page-subtitle">Bonjour {myInstructor.first_name} — {sortedLessons.length} séance{sortedLessons.length !== 1 ? "s" : ""} aujourd'hui</p>
      </div>

      <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <button onClick={() => setSelectedDate(new Date())} className="text-xs text-primary hover:underline">
            Aujourd'hui
          </button>
        </div>
        <button onClick={() => navigate(1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {sortedLessons.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">Pas de séance</p>
            <p className="text-sm text-muted-foreground mt-1">Aucune séance prévue pour cette date</p>
          </div>
        ) : (
          sortedLessons.map((lesson: any) => {
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
                    <p className="text-xs text-muted-foreground mt-0.5">
                      🚗 {lesson.vehicles?.brand} {lesson.vehicles?.model}
                    </p>
                    {lesson.note && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" /> {lesson.note}
                      </p>
                    )}
                    {student?.phone && (
                      <p className="text-xs text-muted-foreground mt-0.5">📱 {student.phone}</p>
                    )}

                    {lesson.status === "prevu" && (
                      <div className="flex items-center gap-1.5 mt-2.5">
                        <button onClick={() => confirmStatus(lesson.id, "effectue")} className="text-xs px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/15 transition-colors font-medium">✓ Effectué</button>
                        <button onClick={() => confirmStatus(lesson.id, "annule")} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors font-medium">✗ Annulé</button>
                        <button onClick={() => confirmStatus(lesson.id, "absent")} className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors font-medium">⚠ Absent</button>
                      </div>
                    )}
                    {lesson.status === "effectue" && categories.length > 0 && (
                      <button
                        onClick={() => setEvalLesson(lesson)}
                        className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium flex items-center gap-1"
                      >
                        <Star className="w-3 h-3" /> Évaluer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

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

      {/* Skill evaluation dialog */}
      <SkillEvaluationDialog
        open={!!evalLesson}
        onClose={() => setEvalLesson(null)}
        categories={categories}
        onSubmit={handleEvalSubmit}
        loading={evaluate.isPending}
      />
    </div>
  );
}
