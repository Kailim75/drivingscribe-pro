import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "sonner";
import { Loader2, Archive, CheckCircle2, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

interface InactiveStudent {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
  last_lesson_date: string | null;
  days_inactive: number;
  selected: boolean;
}

const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BulkArchiveStudentsDialog({ open, onOpenChange }: Props) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [students, setStudents] = useState<InactiveStudent[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open && organization?.id) loadInactiveStudents();
  }, [open, organization?.id]);

  const loadInactiveStudents = async () => {
    setLoading(true);
    try {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const cutoff = threeMonthsAgo.toISOString().split("T")[0];

      // Get non-archived students
      const { data: allStudents, error: sErr } = await supabase
        .from("students")
        .select("id, first_name, last_name, status, updated_at")
        .eq("organization_id", organization!.id)
        .neq("status", "archive");
      if (sErr) throw sErr;

      // Get latest lesson date per student
      const { data: lessons, error: lErr } = await supabase
        .from("lessons")
        .select("student_id, date")
        .eq("organization_id", organization!.id)
        .order("date", { ascending: false });
      if (lErr) throw lErr;

      const lastLessonMap = new Map<string, string>();
      for (const l of lessons || []) {
        if (!lastLessonMap.has(l.student_id)) {
          lastLessonMap.set(l.student_id, l.date);
        }
      }

      const now = new Date();
      const inactive: InactiveStudent[] = [];

      for (const s of allStudents || []) {
        const lastDate = lastLessonMap.get(s.id);
        const refDate = lastDate || s.updated_at.split("T")[0];

        if (refDate <= cutoff) {
          const days = Math.floor((now.getTime() - new Date(refDate).getTime()) / 86400000);
          inactive.push({
            id: s.id,
            first_name: s.first_name,
            last_name: s.last_name,
            status: s.status,
            last_lesson_date: lastDate || null,
            days_inactive: days,
            selected: true,
          });
        }
      }

      inactive.sort((a, b) => b.days_inactive - a.days_inactive);
      setStudents(inactive);
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setStudents((s) => s.map((st) => st.id === id ? { ...st, selected: !st.selected } : st));
  };

  const toggleAll = () => {
    const allSelected = students.every((s) => s.selected);
    setStudents((s) => s.map((st) => ({ ...st, selected: !allSelected })));
  };

  const selected = students.filter((s) => s.selected);

  const handleArchive = async () => {
    setConfirmOpen(false);
    setArchiving(true);
    try {
      const ids = selected.map((s) => s.id);
      const { error } = await supabase
        .from("students")
        .update({ status: "archive" as any })
        .in("id", ids)
        .eq("organization_id", organization!.id);
      if (error) throw error;

      for (const s of selected) {
        log({
          action: "Archivage en lot",
          entity: "student",
          entity_id: s.id,
          details: `${s.first_name} ${s.last_name} — inactif depuis ${s.days_inactive}j`,
        });
      }

      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(`${selected.length} élève${selected.length > 1 ? "s" : ""} archivé${selected.length > 1 ? "s" : ""}`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    } finally {
      setArchiving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-warning" />
              Archivage en lot — Élèves inactifs
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mb-2 text-success" />
              <p className="text-sm font-medium">Aucun élève inactif depuis plus de 3 mois</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button onClick={toggleAll} className="text-primary hover:underline font-medium">
                  {students.every((s) => s.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <span className="text-muted-foreground">
                  {selected.length}/{students.length} sélectionné{selected.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
                {students.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={cn(
                      "w-full text-left rounded-lg p-3 transition-all border-2",
                      s.selected ? "border-warning/40 bg-warning/5" : "border-transparent hover:border-border bg-card"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">{s.first_name} {s.last_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {s.last_lesson_date
                            ? `Dernière séance : ${formatDate(s.last_lesson_date)}`
                            : "Aucune séance enregistrée"}
                        </p>
                      </div>
                      <span className={cn(
                        "text-xs font-semibold px-2 py-1 rounded-md",
                        s.days_inactive > 180 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
                      )}>
                        {s.days_inactive}j inactif
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={selected.length === 0 || archiving}
                className="w-full btn-primary justify-center bg-warning hover:bg-warning/90 text-warning-foreground"
              >
                {archiving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Archivage...</>
                ) : (
                  <><Archive className="w-4 h-4" /> Archiver {selected.length} élève{selected.length > 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'archivage en lot</AlertDialogTitle>
            <AlertDialogDescription>
              {selected.length} élève{selected.length > 1 ? "s" : ""} inactif{selected.length > 1 ? "s" : ""} seront archivé{selected.length > 1 ? "s" : ""}. 
              Vous pourrez les réactiver individuellement à tout moment depuis le filtre « Archivé ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archiver</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
