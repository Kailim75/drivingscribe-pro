import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, PackageCheck } from "lucide-react";
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
  const [form, setForm] = useState({
    student_id: "", instructor_id: "", vehicle_id: "",
    date: new Date().toISOString().split("T")[0],
    start_time: "09:00", end_time: "10:00", duration_hours: 1, note: "",
    formula_id: "",
  });
  const [conflicts, setConflicts] = useState<LessonConflict[]>([]);
  const [checking, setChecking] = useState(false);

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
      });
    } else {
      setForm({
        student_id: "", instructor_id: "", vehicle_id: "",
        date: new Date().toISOString().split("T")[0],
        start_time: "09:00", end_time: "10:00", duration_hours: 1, note: "",
        formula_id: "",
      });
    }
    setConflicts([]);
  }, [initial, open]);

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
  const selectedOffer = offers.find(o => o.id === form.formula_id);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier la séance" : "Nouvelle séance"}</DialogTitle>
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

          {/* Offer selection */}
          {offers.length > 0 && (
            <div>
              <Label className="flex items-center gap-1.5">
                <PackageCheck className="w-3.5 h-3.5 text-muted-foreground" />
                Offre associée
              </Label>
              <select value={form.formula_id} onChange={(e) => set("formula_id", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Aucune offre</option>
                {offers.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({offerTypeLabels[o.type] || o.type}{o.hours ? ` — ${o.hours}h` : ""} — {o.price}€)
                  </option>
                ))}
              </select>
              {selectedOffer && (
                <p className="text-xs text-muted-foreground mt-1">
                  {offerTypeLabels[selectedOffer.type] || selectedOffer.type}
                  {selectedOffer.hours ? ` • ${selectedOffer.hours}h incluses` : ""}
                  {" • "}{selectedOffer.price}€
                </p>
              )}
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
              {initial ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
