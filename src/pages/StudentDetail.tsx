import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, MapPin, Edit2, Loader2, Clock, CalendarDays, MessageCircle, AlertTriangle, Star, Target } from "lucide-react";
import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useStudentFormulas } from "@/hooks/useStudentFormulas";
import { useLessons } from "@/hooks/useLessons";
import { useSkillCategories, useSkillEvaluations } from "@/hooks/useSkills";
import { studentStatusLabels, studentStatusColors, activityTypeLabels, lessonStatusLabels, lessonStatusColors, offerTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import SkillRadarChart from "@/components/students/SkillRadarChart";
import SkillEvaluationDialog from "@/components/students/SkillEvaluationDialog";
import { Button } from "@/components/ui/button";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, isLoading, update } = useStudents();
  const { formulas } = useStudentFormulas(id);
  const { lessons } = useLessons({ studentId: id });
  const [showEdit, setShowEdit] = useState(false);

  const student = students.find((s) => s.id === id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Élève introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/eleves")}>Retour</Button>
      </div>
    );
  }

  const activeFormulas = formulas.filter((f) => f.active);
  const totalHoursBought = formulas.reduce((s, f) => s + Number(f.hours_bought), 0);
  const completedLessons = lessons.filter((l: any) => l.status === "effectue");
  const totalHoursDone = completedLessons.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
  const totalHoursRemaining = totalHoursBought - totalHoursDone;

  const handleUpdate = (data: any) => {
    update.mutate({ id: student.id, ...data }, { onSuccess: () => setShowEdit(false) });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/eleves")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{student.first_name} {student.last_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("status-badge", studentStatusColors[student.status])}>
              {studentStatusLabels[student.status]}
            </span>
            <span className="text-sm text-muted-foreground">{activityTypeLabels[student.activity_type]}</span>
          </div>
        </div>
        {student.phone && (
          <button
            onClick={() => {
              const cleaned = student.phone.replace(/[\s\-().]/g, "");
              const phone = cleaned.startsWith("+") ? cleaned : cleaned.startsWith("0") && cleaned.length === 10 ? "+33" + cleaned.slice(1) : cleaned;
              window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank");
            }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 className="w-4 h-4 mr-1" /> Modifier
        </Button>
      </div>

      {/* Contact info */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {student.phone && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-4 h-4 text-muted-foreground" /></div>
            <span className="text-foreground">{student.phone}</span>
          </div>
        )}
        {student.email && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Mail className="w-4 h-4 text-muted-foreground" /></div>
            <span className="text-foreground">{student.email}</span>
          </div>
        )}
        {student.address && (
          <div className="flex items-center gap-2.5 text-sm">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><MapPin className="w-4 h-4 text-muted-foreground" /></div>
            <span className="text-foreground">{student.address}</span>
          </div>
        )}
      </motion.div>

      {/* Alert low hours */}
      {totalHoursBought > 0 && totalHoursRemaining <= 3 && (
        <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium", totalHoursRemaining <= 0 ? "bg-destructive/8 text-destructive border border-destructive/15" : "bg-warning/8 text-warning border border-warning/15")}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {totalHoursRemaining <= 0 ? "Forfait épuisé — Proposez un renouvellement de formule" : `Plus que ${totalHoursRemaining}h restantes — Pensez à proposer un renouvellement`}
        </div>
      )}

      {/* Hours summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalHoursBought}h</p>
          <p className="text-xs text-muted-foreground mt-1">Achetées</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalHoursDone}h</p>
          <p className="text-xs text-muted-foreground mt-1">Réalisées</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className={cn("text-2xl font-bold", totalHoursRemaining <= 3 ? "text-warning" : "text-foreground")}>{totalHoursRemaining}h</p>
          <p className="text-xs text-muted-foreground mt-1">Restantes</p>
        </div>
      </div>

      {/* Formulas */}
      <div className="glass-card rounded-xl">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /> Formules</h2>
        </div>
        <div className="p-4">
          {formulas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune formule</p>
          ) : (
            <div className="space-y-2">
              {formulas.map((f) => {
                const fLessons = lessons.filter((l: any) => l.formula_id === f.id && l.status === "effectue");
                const done = fLessons.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                const remaining = Number(f.hours_bought) - done;
                const progress = Number(f.hours_bought) > 0 ? (done / Number(f.hours_bought)) * 100 : 0;
                return (
                  <div key={f.id} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.offer_name}</p>
                        <p className="text-xs text-muted-foreground">{offerTypeLabels[f.offer_type]} · {f.active ? "Active" : "Inactive"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{done}/{f.hours_bought}h</p>
                        <p className={cn("text-xs", remaining <= 3 && remaining > 0 ? "text-warning" : "text-muted-foreground")}>
                          Reste {remaining}h
                        </p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent lessons */}
      <div className="glass-card rounded-xl">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><CalendarDays className="w-4 h-4" /> Séances récentes</h2>
        </div>
        <div className="p-4">
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune séance</p>
          ) : (
            <div className="space-y-1">
              {lessons.slice(0, 10).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-14">
                      <p className="text-xs font-medium text-foreground">
                        {new Date(l.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{l.start_time?.slice(0, 5)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground">
                        {l.instructors?.first_name} {l.instructors?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.vehicles?.brand} {l.vehicles?.model} · {l.duration_hours}h
                      </p>
                    </div>
                  </div>
                  <span className={cn("status-badge", lessonStatusColors[l.status])}>
                    {lessonStatusLabels[l.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {student.notes && (
        <div className="glass-card rounded-xl p-4">
          <h2 className="font-semibold text-foreground mb-2 text-sm">Notes</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{student.notes}</p>
        </div>
      )}

      <StudentFormDialog open={showEdit} onClose={() => setShowEdit(false)} onSubmit={handleUpdate} loading={update.isPending} initial={student} />
    </div>
  );
}
