import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Users, FileText, Calendar, ChevronRight, ChevronDown, Check, Loader2, AlertCircle, Plus, Building2, Pencil, X, UserPlus, Search, Zap } from "lucide-react";
import { usePayers } from "@/hooks/usePayers";
import { useStudents } from "@/hooks/useStudents";
import { useInvoices } from "@/hooks/useInvoices";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

interface BillableLesson {
  id: string; date: string; duration_hours: number; billable_amount: number; student_id: string; student_name: string; excluded?: boolean;
}
interface BillableFormula {
  id: string; offer_name: string; total_price: number; student_id: string; student_name: string; excluded?: boolean;
}
interface PayerPreview {
  payer_id: string; payer_name: string; students: { id: string; name: string; excluded?: boolean }[]; lessons: BillableLesson[]; formulas: BillableFormula[]; total_ht: number;
}

export default function GroupedBillingTab() {
  const { payers, create: createPayer, update: updatePayer } = usePayers();
  const { students, update: updateStudent } = useStudents();
  const { create: createInvoice } = useInvoices();
  const { organization } = useOrg();

  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [previews, setPreviews] = useState<PayerPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [expandedPayer, setExpandedPayer] = useState<string | null>(null);
  const [generated, setGenerated] = useState<Set<string>>(new Set());
  const [payerDialogOpen, setPayerDialogOpen] = useState(false);
  const [editingPayer, setEditingPayer] = useState<string | null>(null);
  const [payerForm, setPayerForm] = useState({ name: "", email: "", phone: "", siret: "", address: "" });
  const [manageStudentsFor, setManageStudentsFor] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, boolean>>({});
  const [savingAssignments, setSavingAssignments] = useState(false);

  const isFranchise = (organization as any)?.tva_regime === "franchise_en_base";
  const tvaRate = isFranchise ? 0 : (organization?.tva_rate || 20);

  const studentsWithPayer = useMemo(() => students.filter((s) => (s as any).payer_id), [students]);

  const handleSearch = async () => {
    if (!organization?.id) return;
    setLoading(true);
    setPreviews([]);
    setGenerated(new Set());
    try {
      const { data: lessons, error: lErr } = await supabase
        .from("lessons").select("id, date, duration_hours, billable_amount, student_id, billing_rule")
        .eq("organization_id", organization.id).eq("status", "effectue").neq("billing_rule", "non_facturee")
        .gte("date", dateFrom).lte("date", dateTo);
      if (lErr) throw lErr;

      const { data: invoicedLessons } = await supabase.from("invoice_lines").select("source_lesson_id").not("source_lesson_id", "is", null);
      const invoicedLessonIds = new Set((invoicedLessons || []).map((il) => il.source_lesson_id));

      const { data: formulas, error: fErr } = await supabase
        .from("student_formulas").select("id, offer_name, total_price, student_id, active")
        .eq("organization_id", organization.id).eq("active", true);
      if (fErr) throw fErr;

      const { data: invoicedFormulas } = await supabase.from("invoice_lines").select("source_formula_id").not("source_formula_id", "is", null);
      const invoicedFormulaIds = new Set((invoicedFormulas || []).map((il) => il.source_formula_id));

      const payerMap = new Map<string, PayerPreview>();
      for (const s of studentsWithPayer) {
        const payerId = (s as any).payer_id as string;
        const payer = payers.find((p) => p.id === payerId);
        if (!payer) continue;
        if (!payerMap.has(payerId)) {
          payerMap.set(payerId, { payer_id: payerId, payer_name: payer.name, students: [], lessons: [], formulas: [], total_ht: 0 });
        }
        const entry = payerMap.get(payerId)!;
        if (!entry.students.find((st) => st.id === s.id)) {
          entry.students.push({ id: s.id, name: `${s.first_name} ${s.last_name}` });
        }
        const studentLessons = (lessons || []).filter((l) => l.student_id === s.id && !invoicedLessonIds.has(l.id)).map((l) => ({ ...l, student_name: `${s.first_name} ${s.last_name}` }));
        entry.lessons.push(...studentLessons);
        const studentFormulas = (formulas || []).filter((f) => f.student_id === s.id && !invoicedFormulaIds.has(f.id)).map((f) => ({ ...f, student_name: `${s.first_name} ${s.last_name}` }));
        entry.formulas.push(...studentFormulas);
      }

      for (const entry of payerMap.values()) {
        entry.total_ht = entry.lessons.reduce((s, l) => s + l.billable_amount, 0) + entry.formulas.reduce((s, f) => s + f.total_price, 0);
      }

      const results = Array.from(payerMap.values()).filter((p) => p.lessons.length > 0 || p.formulas.length > 0);
      setPreviews(results);
      if (results.length === 0) {
        toast.info("Aucun élément à facturer", { description: "Aucune séance ou formule éligible trouvée pour cette période." });
      }
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentExclusion = (payerIdx: number, studentId: string) => {
    setPreviews((prev) => prev.map((p, i) => {
      if (i !== payerIdx) return p;
      const updatedStudents = p.students.map((s) => s.id === studentId ? { ...s, excluded: !s.excluded } : s);
      const excludedStudentIds = new Set(updatedStudents.filter((s) => s.excluded).map((s) => s.id));
      const updatedLessons = p.lessons.map((l) => ({ ...l, excluded: excludedStudentIds.has(l.student_id) }));
      const updatedFormulas = p.formulas.map((f) => ({ ...f, excluded: excludedStudentIds.has(f.student_id) }));
      const total_ht = updatedLessons.filter((l) => !l.excluded).reduce((s, l) => s + l.billable_amount, 0) + updatedFormulas.filter((f) => !f.excluded).reduce((s, f) => s + f.total_price, 0);
      return { ...p, students: updatedStudents, lessons: updatedLessons, formulas: updatedFormulas, total_ht };
    }));
  };

  const toggleLineExclusion = (payerIdx: number, lineType: "lesson" | "formula", lineId: string) => {
    setPreviews((prev) => prev.map((p, i) => {
      if (i !== payerIdx) return p;
      let updatedLessons = p.lessons;
      let updatedFormulas = p.formulas;
      if (lineType === "lesson") {
        updatedLessons = p.lessons.map((l) => l.id === lineId ? { ...l, excluded: !l.excluded } : l);
      } else {
        updatedFormulas = p.formulas.map((f) => f.id === lineId ? { ...f, excluded: !f.excluded } : f);
      }
      const total_ht = updatedLessons.filter((l) => !l.excluded).reduce((s, l) => s + l.billable_amount, 0) + updatedFormulas.filter((f) => !f.excluded).reduce((s, f) => s + f.total_price, 0);
      return { ...p, lessons: updatedLessons, formulas: updatedFormulas, total_ht };
    }));
  };

  const handleGenerate = async (preview: PayerPreview, payerIdx: number) => {
    if (!organization?.id) return;

    const includedLessons = preview.lessons.filter((l) => !l.excluded);
    const includedFormulas = preview.formulas.filter((f) => !f.excluded);

    if (includedLessons.length === 0 && includedFormulas.length === 0) {
      toast.error("Aucune ligne à facturer", { description: "Toutes les lignes ont été exclues." });
      return;
    }

    setGenerating(preview.payer_id);
    try {
      const lines: { description: string; quantity: number; unit_price: number; total_ht: number; source_lesson_id?: string; source_formula_id?: string }[] = [];

      // Group by student for structured lines
      const studentIds = [...new Set([...includedLessons.map((l) => l.student_id), ...includedFormulas.map((f) => f.student_id)])];
      for (const studentId of studentIds) {
        const studentName = includedLessons.find((l) => l.student_id === studentId)?.student_name || includedFormulas.find((f) => f.student_id === studentId)?.student_name || "";
        const sLessons = includedLessons.filter((l) => l.student_id === studentId);
        const sFormulas = includedFormulas.filter((f) => f.student_id === studentId);
        for (const lesson of sLessons) {
          lines.push({ description: `Séance conduite – ${studentName} – ${formatDate(lesson.date)} (${lesson.duration_hours}h)`, quantity: 1, unit_price: lesson.billable_amount, total_ht: lesson.billable_amount, source_lesson_id: lesson.id });
        }
        for (const formula of sFormulas) {
          lines.push({ description: `${formula.offer_name} – ${studentName}`, quantity: 1, unit_price: formula.total_price, total_ht: formula.total_price, source_formula_id: formula.id });
        }
      }

      const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
      const tvaAmount = isFranchise ? 0 : totalHt * (tvaRate / 100);
      const totalTtc = totalHt + tvaAmount;

      const { data: number, error: numErr } = await supabase.rpc("next_document_number", { _org_id: organization.id, _type: "facture" });
      if (numErr || !number) throw new Error("Impossible de générer le numéro de facture");

      const { data: invoice, error: invErr } = await supabase.from("invoices").insert({
        organization_id: organization.id, number: number as string, type: "facture" as const, status: "brouillon" as const,
        student_id: preview.students.find((s) => !s.excluded)?.id || preview.students[0].id,
        payer_id: preview.payer_id, total_ht: totalHt, tva_amount: tvaAmount, total_ttc: totalTtc,
        remaining_amount: totalTtc, issue_date: new Date().toISOString().split("T")[0], due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        notes: `Facturation groupée – ${preview.payer_name} – Période du ${formatDate(dateFrom)} au ${formatDate(dateTo)}${isFranchise ? "\nTVA non applicable, art. 293 B du CGI" : ""}`,
      }).select().single();
      if (invErr) throw invErr;

      const { error: linesErr } = await supabase.from("invoice_lines").insert(
        lines.map((l) => ({ invoice_id: invoice.id, description: l.description, quantity: l.quantity, unit_price: l.unit_price, total_ht: l.total_ht, source_lesson_id: l.source_lesson_id || null, source_formula_id: l.source_formula_id || null }))
      );
      if (linesErr) throw linesErr;

      setGenerated((prev) => new Set([...prev, preview.payer_id]));
      toast.success("Facture brouillon créée", { description: `${number} — ${formatEur(totalTtc)}${isFranchise ? "" : " TTC"}` });
    } catch (err: any) {
      if (err.message?.includes("unique") || err.code === "23505") {
        toast.error("Doublon détecté", { description: "Certaines séances ou formules sont déjà facturées." });
      } else {
        toast.error("Erreur", { description: err.message });
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
      updatePayer.mutate({ id: editingPayer, ...payerForm }, { onSuccess: () => { setPayerDialogOpen(false); setEditingPayer(null); setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" }); } });
    } else {
      createPayer.mutate(payerForm, { onSuccess: () => { setPayerDialogOpen(false); setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" }); } });
    }
  };

  const handleOpenManageStudents = (payerId: string) => {
    const current: Record<string, boolean> = {};
    for (const s of students) {
      current[s.id] = (s as any).payer_id === payerId;
    }
    setPendingAssignments(current);
    setStudentSearch("");
    setManageStudentsFor(payerId);
  };

  const handleSaveAssignments = async () => {
    if (!manageStudentsFor) return;
    setSavingAssignments(true);
    try {
      const updates: Promise<any>[] = [];
      for (const s of students) {
        const wasLinked = (s as any).payer_id === manageStudentsFor;
        const willBeLinked = pendingAssignments[s.id];
        if (wasLinked && !willBeLinked) {
          updates.push(updateStudent.mutateAsync({ id: s.id, payer_id: null } as any));
        } else if (!wasLinked && willBeLinked) {
          updates.push(updateStudent.mutateAsync({ id: s.id, payer_id: manageStudentsFor } as any));
        }
      }
      await Promise.all(updates);
      toast.success("Rattachements mis à jour", { description: `${updates.length} modification${updates.length > 1 ? "s" : ""}` });
      setManageStudentsFor(null);
    } catch (err: any) {
      toast.error("Erreur", { description: err.message });
    } finally {
      setSavingAssignments(false);
    }
  };

  const handleBulkGenerate = async () => {
    setBulkGenerating(true);
    try {
      for (let i = 0; i < previews.length; i++) {
        const p = previews[i];
        if (generated.has(p.payer_id)) continue;
        if (p.lessons.filter((l) => !l.excluded).length === 0 && p.formulas.filter((f) => !f.excluded).length === 0) continue;
        await handleGenerate(p, i);
      }
    } finally {
      setBulkGenerating(false);
    }
  };

  // Build sub-totals per student for a given preview
  const getStudentSubtotals = (preview: PayerPreview) => {
    const map = new Map<string, { name: string; total: number; excluded: boolean }>();
    for (const s of preview.students) {
      map.set(s.id, { name: s.name, total: 0, excluded: !!s.excluded });
    }
    for (const l of preview.lessons) {
      if (l.excluded) continue;
      const entry = map.get(l.student_id);
      if (entry) entry.total += l.billable_amount;
    }
    for (const f of preview.formulas) {
      if (f.excluded) continue;
      const entry = map.get(f.student_id);
      if (entry) entry.total += f.total_price;
    }
    return Array.from(map.values());
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Générez des factures brouillon par tiers payeur</p>
        <Button onClick={() => { setEditingPayer(null); setPayerForm({ name: "", email: "", phone: "", siret: "", address: "" }); setPayerDialogOpen(true); }} variant="outline" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Nouveau payeur
        </Button>
      </div>

      {payers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {payers.map((p) => {
            const linkedStudents = studentsWithPayer.filter((s) => (s as any).payer_id === p.id);
            const count = linkedStudents.length;
            return (
              <div key={p.id} className="glass-card rounded-xl p-4 group relative space-y-2">
                <button onClick={() => handleOpenEditPayer(p.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-accent" title="Modifier le payeur">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-foreground truncate">{p.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {count} apprenant{count > 1 ? "s" : ""} rattaché{count > 1 ? "s" : ""}
                </p>
                {count > 0 && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {linkedStudents.slice(0, 3).map((s) => `${s.first_name} ${s.last_name}`).join(", ")}
                    {count > 3 && ` +${count - 3}`}
                  </p>
                )}
                <Button onClick={() => handleOpenManageStudents(p.id)} variant="outline" size="sm" className="w-full gap-1.5 mt-1 h-8 text-xs">
                  <UserPlus className="w-3.5 h-3.5" /> Gérer les apprenants
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Période de facturation</h2>
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1"><Label className="text-xs">Du</Label><Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></div>
          <div className="flex-1"><Label className="text-xs">Au</Label><Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></div>
          <Button onClick={handleSearch} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Rechercher
          </Button>
        </div>
        {studentsWithPayer.length === 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning">Aucun élève n'est rattaché à un tiers payeur. Assignez un payeur dans la fiche élève.</p>
          </div>
        )}
        {isFranchise && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-700 dark:text-amber-300">Franchise en base de TVA — les factures seront générées sans TVA avec la mention légale obligatoire.</p>
          </div>
        )}
      </motion.div>

      {previews.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{previews.length} payeur{previews.length > 1 ? "s" : ""} éligible{previews.length > 1 ? "s" : ""}</h2>
          {previews.map((preview, payerIdx) => {
            const isExpanded = expandedPayer === preview.payer_id;
            const isGenerated = generated.has(preview.payer_id);
            const isGenerating = generating === preview.payer_id;
            const includedLessons = preview.lessons.filter((l) => !l.excluded);
            const includedFormulas = preview.formulas.filter((f) => !f.excluded);
            const hasIncluded = includedLessons.length > 0 || includedFormulas.length > 0;
            const subtotals = getStudentSubtotals(preview);
            const tvaAmount = isFranchise ? 0 : preview.total_ht * (tvaRate / 100);

            return (
              <motion.div key={preview.payer_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn("glass-card rounded-xl overflow-hidden", isGenerated && "border-success/30")}>
                <button onClick={() => setExpandedPayer(isExpanded ? null : preview.payer_id)} className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-semibold text-foreground">{preview.payer_name}</p>
                      <p className="text-xs text-muted-foreground">{preview.students.filter((s) => !s.excluded).length} apprenant{preview.students.filter((s) => !s.excluded).length > 1 ? "s" : ""} · {includedLessons.length} séance{includedLessons.length > 1 ? "s" : ""} · {includedFormulas.length} forfait{includedFormulas.length > 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-bold text-foreground">{formatEur(preview.total_ht)}{!isFranchise && " HT"}</span>
                      {!isFranchise && <span className="block text-[11px] text-muted-foreground">{formatEur(preview.total_ht + tvaAmount)} TTC</span>}
                    </div>
                    {isGenerated ? (
                      <span className="status-badge rounded-md bg-success/10 text-success flex items-center gap-1"><Check className="w-3 h-3" /> Généré</span>
                    ) : (
                      isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {/* Students with checkboxes */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Apprenants inclus</p>
                      <div className="flex flex-wrap gap-2">
                        {preview.students.map((s) => (
                          <label
                            key={s.id}
                            className={cn(
                              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors text-xs font-medium",
                              s.excluded
                                ? "border-border bg-muted/30 text-muted-foreground line-through"
                                : "border-primary/20 bg-primary/5 text-primary"
                            )}
                          >
                            <Checkbox
                              checked={!s.excluded}
                              onCheckedChange={() => toggleStudentExclusion(payerIdx, s.id)}
                              className="w-3.5 h-3.5"
                            />
                            <Users className="w-3 h-3" /> {s.name}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Lines table with individual exclusion */}
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="w-8 px-2 py-2" />
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Description</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground hidden sm:table-cell">Apprenant</th>
                            <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">{isFranchise ? "Montant" : "Montant HT"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.lessons.map((l) => (
                            <tr key={l.id} className={cn("border-t border-border/50", l.excluded && "opacity-40")}>
                              <td className="px-2 py-2 text-center">
                                <Checkbox checked={!l.excluded} onCheckedChange={() => toggleLineExclusion(payerIdx, "lesson", l.id)} className="w-3.5 h-3.5" />
                              </td>
                              <td className="px-3 py-2 text-foreground">Séance – {formatDate(l.date)} ({l.duration_hours}h)</td>
                              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{l.student_name}</td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{formatEur(l.billable_amount)}</td>
                            </tr>
                          ))}
                          {preview.formulas.map((f) => (
                            <tr key={f.id} className={cn("border-t border-border/50", f.excluded && "opacity-40")}>
                              <td className="px-2 py-2 text-center">
                                <Checkbox checked={!f.excluded} onCheckedChange={() => toggleLineExclusion(payerIdx, "formula", f.id)} className="w-3.5 h-3.5" />
                              </td>
                              <td className="px-3 py-2 text-foreground">{f.offer_name}</td>
                              <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{f.student_name}</td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">{formatEur(f.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Sub-totals per student */}
                    {subtotals.filter((s) => !s.excluded && s.total > 0).length > 1 && (
                      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Sous-totaux par apprenant</p>
                        {subtotals.filter((s) => !s.excluded && s.total > 0).map((s) => (
                          <div key={s.name} className="flex justify-between text-xs">
                            <span className="text-foreground">{s.name}</span>
                            <span className="font-medium text-foreground">{formatEur(s.total)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Totals */}
                    <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{isFranchise ? "Total" : "Total HT"}</span>
                        <span className="font-medium text-foreground">{formatEur(preview.total_ht)}</span>
                      </div>
                      {!isFranchise && (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">TVA ({tvaRate}%)</span>
                            <span className="font-medium text-foreground">{formatEur(tvaAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-border">
                            <span className="text-foreground">Total TTC</span>
                            <span className="text-primary">{formatEur(preview.total_ht + tvaAmount)}</span>
                          </div>
                        </>
                      )}
                      {isFranchise && (
                        <p className="text-[10px] text-muted-foreground">TVA non applicable, art. 293 B du CGI</p>
                      )}
                    </div>

                    {/* Warnings */}
                    {!hasIncluded && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                        <p className="text-xs text-destructive">Toutes les lignes ont été exclues. Incluez au moins une ligne pour générer la facture.</p>
                      </div>
                    )}

                    {!isGenerated && (
                      <Button onClick={() => handleGenerate(preview, payerIdx)} disabled={isGenerating || !hasIncluded} className="w-full gap-2">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} Générer la facture brouillon
                      </Button>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={payerDialogOpen} onOpenChange={setPayerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{editingPayer ? "Modifier le tiers payeur" : "Nouveau tiers payeur"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nom / Raison sociale *</Label><Input value={payerForm.name} onChange={(e) => setPayerForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input value={payerForm.email} onChange={(e) => setPayerForm((f) => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Téléphone</Label><Input value={payerForm.phone} onChange={(e) => setPayerForm((f) => ({ ...f, phone: e.target.value }))} /></div>
            </div>
            <div><Label>SIRET</Label><Input value={payerForm.siret} onChange={(e) => setPayerForm((f) => ({ ...f, siret: e.target.value }))} /></div>
            <div><Label>Adresse</Label><Input value={payerForm.address} onChange={(e) => setPayerForm((f) => ({ ...f, address: e.target.value }))} /></div>
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
