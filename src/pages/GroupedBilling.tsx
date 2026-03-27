import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Calendar, ChevronRight, Check, Loader2, AlertCircle, Plus, Building2, Pencil } from "lucide-react";
import { usePayers } from "@/hooks/usePayers";
import { useStudents } from "@/hooks/useStudents";
import { useInvoices } from "@/hooks/useInvoices";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

interface BillableLesson {
  id: string;
  date: string;
  duration_hours: number;
  billable_amount: number;
  student_id: string;
  student_name: string;
}

interface BillableFormula {
  id: string;
  offer_name: string;
  total_price: number;
  student_id: string;
  student_name: string;
}

interface PayerPreview {
  payer_id: string;
  payer_name: string;
  students: { id: string; name: string }[];
  lessons: BillableLesson[];
  formulas: BillableFormula[];
  total_ht: number;
}

export default function GroupedBilling() {
  const { payers, create: createPayer, update: updatePayer } = usePayers();
  const { students } = useStudents();
  const { create: createInvoice } = useInvoices();
  const { organization } = useOrg();

  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [previews, setPreviews] = useState<PayerPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [expandedPayer, setExpandedPayer] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());

  // New/Edit payer dialog
  const [payerDialogOpen, setPayerDialogOpen] = useState(false);
  const [editingPayer, setEditingPayer] = useState<string | null>(null);
  const [payerForm, setPayerForm] = useState({ name: "", email: "", phone: "", siret: "", address: "" });

  const studentsWithPayer = useMemo(
    () => students.filter((s) => (s as any).payer_id),
    [students]
  );

  const handleSearch = async () => {
    if (!organization?.id) return;
    setLoading(true);
    setPreviews([]);
    setGenerated(new Set());

    try {
      // Fetch lessons in period that are billable and not yet invoiced
      const { data: lessons, error: lErr } = await supabase
        .from("lessons")
        .select("id, date, duration_hours, billable_amount, student_id, billing_rule")
        .eq("organization_id", organization.id)
        .eq("status", "effectue")
        .neq("billing_rule", "non_facturee")
        .gte("date", dateFrom)
        .lte("date", dateTo);
      if (lErr) throw lErr;

      // Fetch already-invoiced lesson ids
      const { data: invoicedLessons } = await supabase
        .from("invoice_lines")
        .select("source_lesson_id")
        .not("source_lesson_id", "is", null);
      const invoicedLessonIds = new Set((invoicedLessons || []).map((il) => il.source_lesson_id));

      // Fetch formulas not yet invoiced
      const { data: formulas, error: fErr } = await supabase
        .from("student_formulas")
        .select("id, offer_name, total_price, student_id, active")
        .eq("organization_id", organization.id)
        .eq("active", true);
      if (fErr) throw fErr;

      const { data: invoicedFormulas } = await supabase
        .from("invoice_lines")
        .select("source_formula_id")
        .not("source_formula_id", "is", null);
      const invoicedFormulaIds = new Set((invoicedFormulas || []).map((il) => il.source_formula_id));

      // Group by payer
      const payerMap = new Map<string, PayerPreview>();

      for (const s of studentsWithPayer) {
        const payerId = (s as any).payer_id as string;
        const payer = payers.find((p) => p.id === payerId);
        if (!payer) continue;

        if (!payerMap.has(payerId)) {
          payerMap.set(payerId, {
            payer_id: payerId,
            payer_name: payer.name,
            students: [],
            lessons: [],
            formulas: [],
            total_ht: 0,
          });
        }
        const entry = payerMap.get(payerId)!;

        if (!entry.students.find((st) => st.id === s.id)) {
          entry.students.push({ id: s.id, name: `${s.first_name} ${s.last_name}` });
        }

        // Add eligible lessons for this student
        const studentLessons = (lessons || [])
          .filter((l) => l.student_id === s.id && !invoicedLessonIds.has(l.id))
          .map((l) => ({
            ...l,
            student_name: `${s.first_name} ${s.last_name}`,
          }));
        entry.lessons.push(...studentLessons);

        // Add eligible formulas
        const studentFormulas = (formulas || [])
          .filter((f) => f.student_id === s.id && !invoicedFormulaIds.has(f.id))
          .map((f) => ({
            ...f,
            student_name: `${s.first_name} ${s.last_name}`,
          }));
        entry.formulas.push(...studentFormulas);
      }

      // Calculate totals
      for (const entry of payerMap.values()) {
        entry.total_ht = entry.lessons.reduce((s, l) => s + l.billable_amount, 0)
          + entry.formulas.reduce((s, f) => s + f.total_price, 0);
      }

      // Only show payers with something to bill
      const results = Array.from(payerMap.values()).filter((p) => p.lessons.length > 0 || p.formulas.length > 0);
      setPreviews(results);

      if (results.length === 0) {
        toast({ title: "Aucun élément à facturer", description: "Aucune séance ou formule éligible trouvée pour cette période." });
      }
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (preview: PayerPreview) => {
    if (!organization?.id) return;
    setGenerating(preview.payer_id);

    try {
      const tvaRate = organization.tva_rate || 20;

      // Build lines
      const lines: { description: string; quantity: number; unit_price: number; total_ht: number; source_lesson_id?: string; source_formula_id?: string }[] = [];

      for (const lesson of preview.lessons) {
        lines.push({
          description: `Séance conduite – ${lesson.student_name} – ${formatDate(lesson.date)} (${lesson.duration_hours}h)`,
          quantity: 1,
          unit_price: lesson.billable_amount,
          total_ht: lesson.billable_amount,
          source_lesson_id: lesson.id,
        });
      }

      for (const formula of preview.formulas) {
        lines.push({
          description: `${formula.offer_name} – ${formula.student_name}`,
          quantity: 1,
          unit_price: formula.total_price,
          total_ht: formula.total_price,
          source_formula_id: formula.id,
        });
      }

      const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
      const tvaAmount = totalHt * (tvaRate / 100);
      const totalTtc = totalHt + tvaAmount;

      // Get next invoice number
      const { data: number, error: numErr } = await supabase.rpc("next_document_number", {
        _org_id: organization.id,
        _type: "facture",
      });
      if (numErr || !number) throw new Error("Impossible de générer le numéro de facture");

      // Create the invoice with payer_id, student_id = first student (required field)
      const { data: invoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          organization_id: organization.id,
          number: number as string,
          type: "facture" as const,
          status: "brouillon" as const,
          student_id: preview.students[0].id,
          payer_id: preview.payer_id,
          total_ht: totalHt,
          tva_amount: tvaAmount,
          total_ttc: totalTtc,
          remaining_amount: totalTtc,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          notes: `Facturation groupée – ${preview.payer_name} – Période du ${formatDate(dateFrom)} au ${formatDate(dateTo)}`,
        })
        .select()
        .single();
      if (invErr) throw invErr;

      // Insert invoice lines with source traceability
      const { error: linesErr } = await supabase
        .from("invoice_lines")
        .insert(
          lines.map((l) => ({
            invoice_id: invoice.id,
            description: l.description,
            quantity: l.quantity,
            unit_price: l.unit_price,
            total_ht: l.total_ht,
            source_lesson_id: l.source_lesson_id || null,
            source_formula_id: l.source_formula_id || null,
          }))
        );
      if (linesErr) throw linesErr;

      setGenerated((prev) => new Set([...prev, preview.payer_id]));
      toast({ title: "Facture brouillon créée", description: `${number} — ${formatEur(totalTtc)} TTC` });
    } catch (err: any) {
      if (err.message?.includes("unique") || err.code === "23505") {
        toast({ title: "Doublon détecté", description: "Certaines séances ou formules sont déjà facturées.", variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: err.message, variant: "destructive" });
      }
    } finally {
      setGenerating(null);
    }
  };

  const handleOpenEditPayer = (payerId: string) => {
    const payer = payers.find((p) => p.id === payerId);
    if (!payer) return;
    setEditingPayer(payerId);
    setPayerForm({ name: payer.name, email: payer.email || "", phone: payer.phone || "", siret: payer.siret || "", address: payer.address || "" });
    setPayerDialogOpen(true);
  };

  const handleSavePayer = () => {
    if (!payerForm.name.trim()) return;
    if (editingPayer) {
      updatePayer.mutate({ id: editingPayer, ...payerForm }, {
        onSuccess: () => {
          setPayerDialogOpen(false);
          setEditingPayer(null);
          setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" });
        },
      });
    } else {
      createPayer.mutate(payerForm, {
        onSuccess: () => {
          setPayerDialogOpen(false);
          setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" });
        },
      });
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturation groupée</h1>
          <p className="page-subtitle">Générez des factures brouillon par tiers payeur</p>
        </div>
        <Button onClick={() => { setEditingPayer(null); setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" }); setPayerDialogOpen(true); }} variant="outline" className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau payeur
        </Button>
      </div>

      {/* Payers overview */}
      {payers.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {payers.slice(0, 4).map((p) => {
            const count = studentsWithPayer.filter((s) => (s as any).payer_id === p.id).length;
            return (
              <div key={p.id} className="glass-card rounded-xl p-4 group relative">
                <button
                  onClick={() => handleOpenEditPayer(p.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent"
                  title="Modifier"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">{count} apprenant{count > 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Search controls */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Période de facturation
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1">
            <Label className="text-xs">Du</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Au</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Rechercher
          </Button>
        </div>

        {studentsWithPayer.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning">Aucun élève n'est rattaché à un tiers payeur. Assignez un payeur dans la fiche élève.</p>
          </div>
        )}
      </motion.div>

      {/* Results */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{previews.length} payeur{previews.length > 1 ? "s" : ""} éligible{previews.length > 1 ? "s" : ""}</h2>
          {previews.map((preview) => {
            const isExpanded = expandedPayer === preview.payer_id;
            const isGenerated = generated.has(preview.payer_id);
            const isGenerating = generating === preview.payer_id;

            return (
              <motion.div key={preview.payer_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={cn("glass-card rounded-xl overflow-hidden", isGenerated && "border-success/30")}>
                {/* Header */}
                <button onClick={() => setExpandedPayer(isExpanded ? null : preview.payer_id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{preview.payer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {preview.students.length} apprenant{preview.students.length > 1 ? "s" : ""} · {preview.lessons.length} séance{preview.lessons.length > 1 ? "s" : ""} · {preview.formulas.length} forfait{preview.formulas.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-foreground">{formatEur(preview.total_ht)} HT</span>
                    {isGenerated ? (
                      <span className="status-badge rounded-md bg-success/10 text-success flex items-center gap-1">
                        <Check className="w-3 h-3" /> Généré
                      </span>
                    ) : (
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
                    )}
                  </div>
                </button>

                {/* Detail */}
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {/* Students */}
                    <div className="flex flex-wrap gap-1.5">
                      {preview.students.map((s) => (
                        <span key={s.id} className="status-badge rounded-md bg-primary/10 text-primary">
                          <Users className="w-3 h-3" /> {s.name}
                        </span>
                      ))}
                    </div>

                    {/* Lines preview */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Montant HT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.lessons.map((l) => (
                            <tr key={l.id} className="border-t border-border/50">
                              <td className="px-3 py-2 text-foreground">
                                Séance – {l.student_name} – {formatDate(l.date)} ({l.duration_hours}h)
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{formatEur(l.billable_amount)}</td>
                            </tr>
                          ))}
                          {preview.formulas.map((f) => (
                            <tr key={f.id} className="border-t border-border/50">
                              <td className="px-3 py-2 text-foreground">
                                {f.offer_name} – {f.student_name}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{formatEur(f.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-muted/30">
                            <td className="px-3 py-2 font-semibold text-foreground">Total HT</td>
                            <td className="px-3 py-2 text-right font-bold text-foreground">{formatEur(preview.total_ht)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Generate button */}
                    {!isGenerated && (
                      <Button onClick={() => handleGenerate(preview)} disabled={isGenerating} className="w-full gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        Générer la facture brouillon
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New payer dialog */}
      <Dialog open={payerDialogOpen} onOpenChange={setPayerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPayer ? "Modifier le tiers payeur" : "Nouveau tiers payeur"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom / Raison sociale *</Label>
              <Input value={payerForm.name} onChange={(e) => setPayerForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={payerForm.email} onChange={(e) => setPayerForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={payerForm.phone} onChange={(e) => setPayerForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>SIRET</Label>
              <Input value={payerForm.siret} onChange={(e) => setPayerForm((f) => ({ ...f, siret: e.target.value }))} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={payerForm.address} onChange={(e) => setPayerForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayerDialogOpen(false); setEditingPayer(null); }}>Annuler</Button>
            <Button onClick={handleSavePayer} disabled={createPayer.isPending || updatePayer.isPending}>
              {(createPayer.isPending || updatePayer.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {editingPayer ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
