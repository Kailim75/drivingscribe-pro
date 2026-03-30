import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, PackageCheck, Clock, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import type { LessonConflict } from "@/hooks/useLessons";

interface Offer {
  id: string;
  name: string;
  type: string;
  price: number;
  hours: number | null;
  active: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onCheckConflicts: (params: any) => Promise<LessonConflict[]>;
  loading?: boolean;
  initial?: any;
  students: { id: string; first_name: string; last_name: string }[];
  instructors: { id: string; first_name: string; last_name: string }[];
  vehicles: { id: string; brand: string; model: string; plate: string; status: string }[];
  offers?: Offer[];
}

export default function LessonFormDialog({ open, onClose, onSubmit, onCheckConflicts, loading, initial, students, instructors, vehicles, offers = [] }: Props) {
  const { organization } = useOrg();
  const orgId = organization?.id;

  const [form, setForm] = useState({
    student_id: "", instructor_id: "", vehicle_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00", end_time: "10:00", duration_hours: 1, note: "",
    formula_id: "", offer_id: "",
  });
  const [conflicts, setConflicts] = useState<LessonConflict[]>([]);
  const [checking, setChecking] = useState(false);

  // Fetch student's active formulas when a student is selected
  const studentId = form.student_id;
  const { data: studentFormulas = [] } = useQuery({
    queryKey: ["student_formulas", orgId, studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_formulas")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("student_id", studentId)
        .eq("active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!orgId && !!studentId && open,
  });

  // Fetch hours consumed per formula (sum of duration_hours from linked lessons)
  const formulaIds = useMemo(() => studentFormulas.map(f => f.id), [studentFormulas]);
  const { data: hoursConsumedMap = {} } = useQuery({
    queryKey: ["formula_hours_consumed", formulaIds],
    queryFn: async () => {
      if (formulaIds.length === 0) return {};
      const { data, error } = await supabase
        .from("lessons")
        .select("formula_id, duration_hours, status")
        .in("formula_id", formulaIds)
        .in("status", ["prevu", "effectue"]);
      if (error) throw error;
      const map: Record<string, number> = {};
      (data || []).forEach((l) => {
        if (l.formula_id) {
          // If editing, exclude current lesson's hours from count
          map[l.formula_id] = (map[l.formula_id] || 0) + Number(l.duration_hours);
        }
      });
      return map;
    },
    enabled: formulaIds.length > 0 && open,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        student_id: initial.student_id || "",
        instructor_id: initial.instructor_id || "",
        vehicle_id: initial.vehicle_id || "",
        date: initial.date || new Date().toISOString().split("T")[0],
        start_time: initial.start_time?.slice(0, 5) || "09:00",
        end_time: initial.end_time?.slice(0, 5) || "10:00",
        duration_hours: initial.duration_hours || 1,
        note: initial.note || "",
        formula_id: initial.formula_id || "",
        offer_id: "",
      });
    } else {
      setForm({
        student_id: "", instructor_id: "", vehicle_id: "",
        date: new Date().toISOString().split("T")[0],
        start_time: "09:00", end_time: "10:00", duration_hours: 1, note: "",
        formula_id: "", offer_id: "",
      });
    }
    setConflicts([]);
  }, [initial, open]);

  // Reset formula_id when student changes
  useEffect(() => {
    if (!initial) {
      setForm(p => ({ ...p, formula_id: "" }));
    }
  }, [form.student_id]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  // Auto-calculate duration
  useEffect(() => {
    const [sh, sm] = form.start_time.split(":").map(Number);
    const [eh, em] = form.end_time.split(":").map(Number);
    const dur = (eh * 60 + em - sh * 60 - sm) / 60;
    if (dur > 0) set("duration_hours", Math.round(dur * 100) / 100);
  }, [form.start_time, form.end_time]);

  const handleCheck = async () => {
    if (!form.instructor_id || !form.vehicle_id || !form.date) return;
    setChecking(true);
    try {
      const c = await onCheckConflicts({
        instructor_id: form.instructor_id,
        vehicle_id: form.vehicle_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        exclude_lesson_id: initial?.id,
      });
      setConflicts(c);
    } catch { setConflicts([]); }
    setChecking(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.student_id || !form.instructor_id || !form.vehicle_id) return;
    if (form.instructor_id && form.vehicle_id) {
      setChecking(true);
      try {
        const c = await onCheckConflicts({
          instructor_id: form.instructor_id,
          vehicle_id: form.vehicle_id,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time,
          exclude_lesson_id: initial?.id,
        });
        setConflicts(c);
        if (c.length > 0) { setChecking(false); return; }
      } catch { /* proceed */ }
      setChecking(false);
    }
    const submitData = { ...form };
    if (!submitData.formula_id) delete (submitData as any).formula_id;
    onSubmit(submitData);
  };

  const availableVehicles = vehicles.filter((v) => v.status === "actif");

  const offerTypeLabels: Record<string, string> = { heure: "Heure", pack: "Pack", forfait: "Forfait" };

  // Compute balance for selected formula
  const selectedFormula = studentFormulas.find(f => f.id === form.formula_id);
  const selectedFormulaConsumed = selectedFormula ? (hoursConsumedMap[selectedFormula.id] || 0) : 0;
  const selectedFormulaRemaining = selectedFormula ? Number(selectedFormula.hours_bought) - selectedFormulaConsumed : null;
  const willExceed = selectedFormulaRemaining !== null && selectedFormulaRemaining < form.duration_hours;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Modifier la séance" : "Nouvelle séance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Élève *</Label>
            <select value={form.student_id} onChange={(e) => set("student_id", e.target.value)} required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="">Sélectionner un élève</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Formateur *</Label>
              <select value={form.instructor_id} onChange={(e) => set("instructor_id", e.target.value)} required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Sélectionner</option>
                {instructors.map((i) => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
              </select>
            </div>
            <div>
              <Label>Véhicule *</Label>
              <select value={form.vehicle_id} onChange={(e) => set("vehicle_id", e.target.value)} required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Sélectionner</option>
                {availableVehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>)}
              </select>
            </div>
          </div>

          {/* Formula selection — only when student has active formulas */}
          {form.student_id && studentFormulas.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-muted-foreground" />
                Formule / Pack de l'élève
              </Label>
              <select value={form.formula_id} onChange={(e) => set("formula_id", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Aucune formule</option>
                {studentFormulas.map((f) => {
                  const consumed = hoursConsumedMap[f.id] || 0;
                  const remaining = Number(f.hours_bought) - consumed;
                  return (
                    <option key={f.id} value={f.id}>
                      {f.offer_name} ({offerTypeLabels[f.offer_type] || f.offer_type}) — {remaining}h/{f.hours_bought}h restantes
                    </option>
                  );
                })}
              </select>

              {/* Balance indicator */}
              {selectedFormula && (
                <div className={`flex items-center gap-2 mt-1.5 px-3 py-2 rounded-lg text-xs ${
                  willExceed 
                    ? "bg-warning/10 border border-warning/20 text-warning" 
                    : "bg-primary/5 border border-primary/10 text-primary"
                }`}>
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold">{selectedFormulaRemaining}h</span> restantes sur {selectedFormula.hours_bought}h
                    <span className="text-muted-foreground ml-1">({selectedFormulaConsumed}h consommées)</span>
                  </div>
                </div>
              )}

              {willExceed && (
                <div className="flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Cette séance ({form.duration_hours}h) dépassera le solde restant ({selectedFormulaRemaining}h)</span>
                </div>
              )}
            </div>
          )}

          {/* Show available offers to buy if student has no formulas */}
          {form.student_id && studentFormulas.length === 0 && offers.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-xs text-muted-foreground">
              <PackageCheck className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Cet élève n'a aucune formule active. Facturez un pack/forfait pour en créer une.</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required /></div>
            <div><Label>Début *</Label><Input type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} required /></div>
            <div><Label>Fin *</Label><Input type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} required /></div>
          </div>
          {form.duration_hours > 0 && (
            <p className="text-xs text-muted-foreground">Durée : {form.duration_hours}h</p>
          )}
          <div><Label>Note</Label><Input value={form.note} onChange={(e) => set("note", e.target.value)} placeholder="Note sur la séance..." /></div>

          {/* Conflict check */}
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={handleCheck} disabled={checking || !form.instructor_id || !form.vehicle_id}>
              {checking ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Vérifier les conflits
            </Button>
          </div>

          {conflicts.length > 0 && (
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 space-y-1">
              {conflicts.map((c, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-destructive">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>Conflit {c.conflict_type === "instructor" ? "formateur" : "véhicule"} : {c.conflicting_label}</span>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading || conflicts.length > 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial?.id ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
