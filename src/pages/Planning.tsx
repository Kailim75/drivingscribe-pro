import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { CalendarDays, List, Plus, ChevronLeft, ChevronRight, Clock, CheckCircle2, XCircle, UserX, MessageSquare, Loader2, Pencil, Sparkles } from "lucide-react";
import BulkLessonActions from "@/components/planning/BulkLessonActions";
import { cn } from "@/lib/utils";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuditLog } from "@/hooks/useAuditLog";
import { lessonStatusLabels, lessonStatusColors } from "@/lib/labels";
import LessonFormDialog from "@/components/lessons/LessonFormDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

const statusIcons: Record<string, React.ElementType> = {
  prevu: Clock, effectue: CheckCircle2, annule: XCircle, absent: UserX,
};

type View = "jour" | "liste";

export default function Planning() {
  const [view, setView] = useState<View>("jour");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editLesson, setEditLesson] = useState<any>(null);
  const [statusConfirm, setStatusConfirm] = useState<{ lessonId: string; status: string; label: string } | null>(null);
  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [aiStudent, setAiStudent] = useState("");
  const [aiDuration, setAiDuration] = useState("1");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkPending, setBulkPending] = useState(false);

  const { organization } = useOrg();
  const dateStr = selectedDate.toISOString().split("T")[0];
  const { lessons, isLoading, checkConflicts, create, update, updateStatus } = useLessons(view === "jour" ? { date: dateStr } : undefined);
  const { students } = useStudents();
  const { instructors } = useInstructors();
  const { vehicles } = useVehicles();
  const { log } = useAuditLog();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleBulkStatusChange = useCallback(async (status: string) => {
    setBulkPending(true);
    try {
      for (const id of selectedIds) {
        await updateStatus.mutateAsync({ id, status: status as "prevu" | "effectue" | "annule" | "absent" });
      }
      setSelectedIds([]);
      log({ action: "bulk_update_status", entity: "lesson", details: `${selectedIds.length} séances → ${status}` });
    } catch {
      // errors handled by mutation
    } finally {
      setBulkPending(false);
    }
  }, [selectedIds, updateStatus, log]);

  const handleAiSuggest = async () => {
    if (!aiStudent || !organization?.id) return;
    setAiLoading(true);
    setAiSuggestions([]);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-slots", {
        body: {
          student_id: aiStudent,
          organization_id: organization.id,
          date: dateStr,
          preferred_duration: Number(aiDuration),
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else {
        setAiSuggestions(data?.suggestions || []);
        if ((data?.suggestions || []).length === 0) toast.info("Aucun créneau trouvé");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erreur lors de la suggestion IA");
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseSuggestion = (suggestion: any) => {
    const student = students.find(s => s.id === aiStudent);
    if (!student) return;
    const endTimeParts = suggestion.end_time.split(":");
    const startTimeParts = suggestion.start_time.split(":");
    const durationH = (parseInt(endTimeParts[0]) * 60 + parseInt(endTimeParts[1]) - parseInt(startTimeParts[0]) * 60 - parseInt(startTimeParts[1])) / 60;
    
    create.mutate({
      student_id: aiStudent,
      instructor_id: suggestion.instructor_id,
      vehicle_id: suggestion.vehicle_id,
      date: dateStr,
      start_time: suggestion.start_time,
      end_time: suggestion.end_time,
      duration_hours: durationH,
    }, {
      onSuccess: () => {
        setShowAiSuggest(false);
        setAiSuggestions([]);
        log({ action: "create", entity: "lesson", details: `Séance IA le ${dateStr} ${suggestion.start_time}-${suggestion.end_time}` });
        toast.success("Séance créée depuis la suggestion IA");
      },
    });
  };

  const navigate = (dir: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + dir);
    setSelectedDate(d);
  };

  const handleCreate = (data: any) => {
    create.mutate(data, { onSuccess: () => { setShowForm(false); log({ action: "create", entity: "lesson", details: `Séance le ${data.date} de ${data.start_time} à ${data.end_time}` }); } });
  };

  const handleEdit = (data: any) => {
    if (!editLesson) return;
    update.mutate({ id: editLesson.id, ...data }, { onSuccess: () => { setEditLesson(null); log({ action: "update", entity: "lesson", entity_id: editLesson.id, details: `Séance modifiée le ${data.date}` }); } });
  };

  const handleStatusChange = (lessonId: string, status: string) => {
    updateStatus.mutate({ id: lessonId, status: status as "prevu" | "effectue" | "annule" | "absent" }, { onSuccess: () => { setStatusConfirm(null); log({ action: "update_status", entity: "lesson", entity_id: lessonId, details: `Statut → ${lessonStatusLabels[status]}` }); } });
  };

  const confirmStatus = (lessonId: string, status: string) => {
    const labels: Record<string, string> = { effectue: "Effectué", annule: "Annulé", absent: "Absent" };
    setStatusConfirm({ lessonId, status, label: labels[status] || status });
  };

  const sortedLessons = [...lessons].sort((a: any, b: any) =>
    (a.date || "").localeCompare(b.date || "") || (a.start_time || "").localeCompare(b.start_time || "")
  );

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      <div className="page-header">
        <div className="min-w-0">
          <h1 className="page-title">Planning</h1>
          <p className="page-subtitle truncate">
            {sortedLessons.length} séance{sortedLessons.length > 1 ? "s" : ""}
            {view === "jour" && ` — ${selectedDate.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <BulkLessonActions
            selectedIds={selectedIds}
            totalCount={sortedLessons.filter((l: any) => l.status === "prevu").length}
            onSelectAll={() => setSelectedIds(sortedLessons.filter((l: any) => l.status === "prevu").map((l: any) => l.id))}
            onClearSelection={() => setSelectedIds([])}
            onBulkStatusChange={handleBulkStatusChange}
            isPending={bulkPending}
          />
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button onClick={() => setView("jour")} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors", view === "jour" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <CalendarDays className="w-3.5 h-3.5 sm:mr-1 inline" /><span className="hidden sm:inline">Jour</span>
            </button>
            <button onClick={() => setView("liste")} className={cn("px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors", view === "liste" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
              <List className="w-3.5 h-3.5 sm:mr-1 inline" /><span className="hidden sm:inline">Liste</span>
            </button>
          </div>
          <button onClick={() => { setAiSuggestions([]); setShowAiSuggest(true); }} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium">
            <Sparkles className="w-3.5 h-3.5" /><span className="hidden sm:inline">IA</span>
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Séance</span>
          </button>
        </div>
      </div>

      {view === "jour" && (
        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-2.5">
          <button onClick={() => navigate(-1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={() => setSelectedDate(new Date())} className="text-sm font-medium text-primary hover:underline px-4 py-1">
            Aujourd'hui
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-md hover:bg-muted text-muted-foreground transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {sortedLessons.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-foreground">Aucune séance</p>
            <p className="text-sm text-muted-foreground mt-1">{view === "jour" ? "Pas de séance prévue pour cette date" : "Aucune séance enregistrée"}</p>
          </div>
        ) : (
          sortedLessons.map((lesson: any) => {
            const Icon = statusIcons[lesson.status] || Clock;
            return (
              <div key={lesson.id} onClick={() => selectedIds.length > 0 && lesson.status === "prevu" ? toggleSelect(lesson.id) : undefined}
                className={cn("glass-card rounded-xl p-4 hover:border-primary/20 transition-colors", selectedIds.includes(lesson.id) && "ring-2 ring-primary/40 border-primary/30")}>
                <div className="flex items-start gap-3">
                  {selectedIds.length > 0 && lesson.status === "prevu" && (
                    <button onClick={(e) => { e.stopPropagation(); toggleSelect(lesson.id); }}
                      className="mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                      style={{ borderColor: selectedIds.includes(lesson.id) ? 'hsl(var(--primary))' : 'hsl(var(--border))', background: selectedIds.includes(lesson.id) ? 'hsl(var(--primary))' : 'transparent' }}>
                      {selectedIds.includes(lesson.id) && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                    </button>
                  )}
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
                      <span className={cn("status-badge inline-flex items-center gap-1 flex-shrink-0", lessonStatusColors[lesson.status])}>
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
                    <div className="flex items-center gap-1.5 mt-2.5">
                      {lesson.status === "prevu" && (
                        <>
                          <button onClick={() => confirmStatus(lesson.id, "effectue")} className="text-xs px-3 py-1.5 rounded-lg bg-success/10 text-success hover:bg-success/15 transition-colors font-medium">✓ Effectué</button>
                          <button onClick={() => confirmStatus(lesson.id, "annule")} className="text-xs px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/15 transition-colors font-medium">✗ Annulé</button>
                          <button onClick={() => confirmStatus(lesson.id, "absent")} className="text-xs px-3 py-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/15 transition-colors font-medium">⚠ Absent</button>
                        </>
                      )}
                      <button onClick={() => setEditLesson(lesson)} className="text-xs px-2.5 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium ml-auto">
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </motion.div>

      <LessonFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} onCheckConflicts={checkConflicts} loading={create.isPending} students={students} instructors={instructors.filter((i) => i.status === "actif")} vehicles={vehicles} />
      <LessonFormDialog open={!!editLesson} onClose={() => setEditLesson(null)} onSubmit={handleEdit} onCheckConflicts={checkConflicts} loading={update.isPending} initial={editLesson} students={students} instructors={instructors.filter((i) => i.status === "actif")} vehicles={vehicles} />

      <AlertDialog open={!!statusConfirm} onOpenChange={(v) => !v && setStatusConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le changement de statut</AlertDialogTitle>
            <AlertDialogDescription>
              Marquer cette séance comme « {statusConfirm?.label} » ?
              {statusConfirm?.status === "annule" && " Par défaut, la séance annulée sera facturée à 100%."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => statusConfirm && handleStatusChange(statusConfirm.lessonId, statusConfirm.status)}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Suggestion Dialog */}
      <Dialog open={showAiSuggest} onOpenChange={setShowAiSuggest}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" /> Suggestion IA de créneaux
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              L'IA analyse les disponibilités des formateurs et véhicules pour le {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} et suggère les meilleurs créneaux.
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Élève</label>
              <select value={aiStudent} onChange={(e) => setAiStudent(e.target.value)} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Sélectionner un élève</option>
                {students.filter(s => s.status === "actif").map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Durée</label>
              <select value={aiDuration} onChange={(e) => setAiDuration(e.target.value)} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="1">1 heure</option>
                <option value="1.5">1h30</option>
                <option value="2">2 heures</option>
              </select>
            </div>
            <button onClick={handleAiSuggest} disabled={aiLoading || !aiStudent} className="w-full btn-primary justify-center">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyse en cours...</> : <><Sparkles className="w-4 h-4" /> Trouver les meilleurs créneaux</>}
            </button>

            {aiSuggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Créneaux suggérés :</p>
                {aiSuggestions.map((s: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg border border-border bg-muted/30 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.start_time} — {s.end_time}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">👤 {s.instructor_name}</p>
                        <p className="text-xs text-muted-foreground">🚗 {s.vehicle_name}</p>
                      </div>
                      <button onClick={() => handleUseSuggestion(s)} className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                        Réserver
                      </button>
                    </div>
                    {s.reason && <p className="text-[10px] text-muted-foreground mt-1.5 italic">💡 {s.reason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
