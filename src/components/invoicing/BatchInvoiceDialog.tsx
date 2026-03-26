import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useQueryClient } from "@tanstack/react-query";
import { useAuditLog } from "@/hooks/useAuditLog";
import { toast } from "@/hooks/use-toast";
import { Loader2, Zap, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type InvoiceType = Database["public"]["Enums"]["invoice_type"];
type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

interface UnbilledLesson {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  billable_amount: number;
  student_id: string;
  students: { first_name: string; last_name: string };
  instructors: { first_name: string; last_name: string };
}

interface StudentGroup {
  student_id: string;
  student_name: string;
  lessons: UnbilledLesson[];
  total_ht: number;
  selected: boolean;
}

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BatchInvoiceDialog({ open, onOpenChange }: Props) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (open && organization?.id) {
      loadUnbilledLessons();
    }
  }, [open, organization?.id]);

  const loadUnbilledLessons = async () => {
    setLoading(true);
    try {
      // Get all completed lessons
      const { data: lessons, error } = await supabase
        .from("lessons")
        .select("id, date, start_time, end_time, duration_hours, billable_amount, student_id, students(first_name, last_name), instructors(first_name, last_name)")
        .eq("organization_id", organization!.id)
        .eq("status", "effectue")
        .order("date", { ascending: true });
      if (error) throw error;

      // Get already billed lesson IDs
      const { data: billedLines, error: blErr } = await supabase
        .from("invoice_lines")
        .select("source_lesson_id, invoice_id")
        .not("source_lesson_id", "is", null);
      if (blErr) throw blErr;

      const billedIds = new Set((billedLines || []).map((l) => l.source_lesson_id));
      const unbilled = (lessons || []).filter((l) => !billedIds.has(l.id)) as unknown as UnbilledLesson[];

      // Group by student
      const map = new Map<string, StudentGroup>();
      for (const l of unbilled) {
        const key = l.student_id;
        if (!map.has(key)) {
          map.set(key, {
            student_id: key,
            student_name: `${l.students.first_name} ${l.students.last_name}`,
            lessons: [],
            total_ht: 0,
            selected: true,
          });
        }
        const g = map.get(key)!;
        g.lessons.push(l);
        g.total_ht += l.billable_amount || (l.duration_hours * 50); // fallback price
      }
      setGroups(Array.from(map.values()).sort((a, b) => a.student_name.localeCompare(b.student_name)));
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleGroup = (studentId: string) => {
    setGroups((g) => g.map((gr) => gr.student_id === studentId ? { ...gr, selected: !gr.selected } : gr));
  };

  const toggleAll = () => {
    const allSelected = groups.every((g) => g.selected);
    setGroups((g) => g.map((gr) => ({ ...gr, selected: !allSelected })));
  };

  const selectedGroups = groups.filter((g) => g.selected);
  const tvaRate = organization?.tva_rate || 20;

  const handleGenerate = async () => {
    setConfirmOpen(false);
    setGenerating(true);
    let created = 0;

    try {
      for (const group of selectedGroups) {
        const { data: number, error: numErr } = await supabase.rpc("next_document_number", {
          _org_id: organization!.id,
          _type: "facture",
        });
        if (numErr || !number) throw new Error("Erreur numérotation");

        const totalHt = group.total_ht;
        const tvaAmount = totalHt * (tvaRate / 100);
        const totalTtc = totalHt + tvaAmount;

        const invoiceType: InvoiceType = "facture";
        const invoiceStatus: InvoiceStatus = "brouillon";

        const { data: invoice, error: invErr } = await supabase
          .from("invoices")
          .insert({
            organization_id: organization!.id,
            number: number as string,
            type: invoiceType,
            student_id: group.student_id,
            status: invoiceStatus,
            total_ht: totalHt,
            tva_amount: tvaAmount,
            total_ttc: totalTtc,
            remaining_amount: totalTtc,
            issue_date: new Date().toISOString().split("T")[0],
            due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          })
          .select()
          .single();
        if (invErr || !invoice) throw new Error("Erreur création facture");

        const lines = group.lessons.map((l) => ({
          invoice_id: invoice.id,
          description: `Séance du ${formatDate(l.date)} (${l.start_time.slice(0, 5)}-${l.end_time.slice(0, 5)}) — ${l.instructors.first_name} ${l.instructors.last_name}`,
          quantity: l.duration_hours,
          unit_price: l.billable_amount ? l.billable_amount / l.duration_hours : 50,
          total_ht: l.billable_amount || l.duration_hours * 50,
          source_lesson_id: l.id,
        }));

        const { error: lineErr } = await supabase.from("invoice_lines").insert(lines);
        if (lineErr) throw new Error("Erreur lignes facture");

        log({
          action: "Facture auto créée",
          entity: "invoice",
          entity_id: invoice.id,
          details: `${number} — ${group.student_name} — ${group.lessons.length} séance(s) — ${formatEur(totalTtc)}`,
        });

        created++;
      }

      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: `${created} facture${created > 1 ? "s" : ""} créée${created > 1 ? "s" : ""}` });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Facturation automatique en lot
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 mb-2 text-success" />
              <p className="text-sm font-medium">Toutes les séances sont déjà facturées</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <button onClick={toggleAll} className="text-primary hover:underline font-medium">
                  {groups.every((g) => g.selected) ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <span className="text-muted-foreground">
                  {selectedGroups.length} élève{selectedGroups.length > 1 ? "s" : ""} · {selectedGroups.reduce((s, g) => s + g.lessons.length, 0)} séance(s)
                </span>
              </div>

              {groups.map((g) => (
                <button
                  key={g.student_id}
                  onClick={() => toggleGroup(g.student_id)}
                  className={cn(
                    "w-full text-left glass-card rounded-lg p-3 transition-all border-2",
                    g.selected ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-border"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">{g.student_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.lessons.length} séance{g.lessons.length > 1 ? "s" : ""} · {formatDate(g.lessons[0].date)}
                        {g.lessons.length > 1 && ` → ${formatDate(g.lessons[g.lessons.length - 1].date)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-foreground">{formatEur(g.total_ht * (1 + tvaRate / 100))}</p>
                      <p className="text-[10px] text-muted-foreground">{formatEur(g.total_ht)} HT</p>
                    </div>
                  </div>
                </button>
              ))}

              <div className="glass-card rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total HT</span>
                  <span className="font-medium">{formatEur(selectedGroups.reduce((s, g) => s + g.total_ht, 0))}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">TVA ({tvaRate}%)</span>
                  <span className="font-medium">{formatEur(selectedGroups.reduce((s, g) => s + g.total_ht, 0) * (tvaRate / 100))}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-border font-bold">
                  <span>Total TTC</span>
                  <span>{formatEur(selectedGroups.reduce((s, g) => s + g.total_ht, 0) * (1 + tvaRate / 100))}</span>
                </div>
              </div>

              <button
                onClick={() => setConfirmOpen(true)}
                disabled={selectedGroups.length === 0 || generating}
                className="w-full btn-primary justify-center"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</>
                ) : (
                  <><FileText className="w-4 h-4" /> Générer {selectedGroups.length} facture{selectedGroups.length > 1 ? "s" : ""}</>
                )}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la génération en lot</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedGroups.length} facture{selectedGroups.length > 1 ? "s" : ""} brouillon vont être créées pour un total de{" "}
              <strong>{formatEur(selectedGroups.reduce((s, g) => s + g.total_ht, 0) * (1 + tvaRate / 100))}</strong> TTC.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleGenerate}>Générer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
