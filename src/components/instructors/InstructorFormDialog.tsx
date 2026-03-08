import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  loading?: boolean;
  initial?: any;
}

export default function InstructorFormDialog({ open, onClose, onSubmit, loading, initial }: Props) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "",
    hourly_cost: 0, specialties: [] as string[], notes: "",
  });

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial, specialties: initial.specialties || [] });
    else setForm({ first_name: "", last_name: "", phone: "", email: "", hourly_cost: 0, specialties: [], notes: "" });
  }, [initial, open]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const toggleSpecialty = (s: string) => {
    setForm((p) => ({
      ...p,
      specialties: p.specialties.includes(s) ? p.specialties.filter((x) => x !== s) : [...p.specialties, s],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    onSubmit(form);
  };

  const specs = [
    { value: "auto_ecole", label: "Auto-école" },
    { value: "taxi", label: "Taxi" },
    { value: "vtc", label: "VTC" },
    { value: "vmdtr", label: "VMDTR" },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le formateur" : "Nouveau formateur"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prénom *</Label><Input value={form.first_name} onChange={(e) => set("first_name", e.target.value)} required /></div>
            <div><Label>Nom *</Label><Input value={form.last_name} onChange={(e) => set("last_name", e.target.value)} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          </div>
          <div><Label>Coût horaire (€)</Label><Input type="number" min={0} step={0.01} value={form.hourly_cost} onChange={(e) => set("hourly_cost", parseFloat(e.target.value) || 0)} /></div>
          <div>
            <Label>Spécialités</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {specs.map((s) => (
                <button key={s.value} type="button" onClick={() => toggleSpecialty(s.value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.specialties.includes(s.value) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div><Label>Notes</Label><Input value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
