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

export default function VehicleFormDialog({ open, onClose, onSubmit, loading, initial }: Props) {
  const [form, setForm] = useState({
    plate: "", brand: "", model: "", category: "auto_ecole", monthly_cost: 0, notes: "",
    next_maintenance_date: "", last_maintenance_date: "", insurance_expiry: "", technical_control_date: "",
  });

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial, monthly_cost: Number(initial.monthly_cost) || 0 });
    else setForm({ plate: "", brand: "", model: "", category: "auto_ecole", monthly_cost: 0, notes: "", next_maintenance_date: "", last_maintenance_date: "", insurance_expiry: "", technical_control_date: "" });
  }, [initial, open]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate.trim()) return;
    // Convert empty strings to null for date fields
    const payload = {
      ...form,
      next_maintenance_date: form.next_maintenance_date || null,
      last_maintenance_date: form.last_maintenance_date || null,
      insurance_expiry: form.insurance_expiry || null,
      technical_control_date: form.technical_control_date || null,
    };
    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le véhicule" : "Nouveau véhicule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Identification */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identification</p>
            <div><Label>Immatriculation *</Label><Input value={form.plate} onChange={(e) => set("plate", e.target.value)} required placeholder="AB-123-CD" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Marque</Label><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Renault" /></div>
              <div><Label>Modèle</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="Clio" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <select value={form.category} onChange={(e) => set("category", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="auto_ecole">Auto-école</option>
                  <option value="taxi">Taxi</option>
                  <option value="vtc">VTC</option>
                  <option value="vmdtr">VMDTR</option>
                </select>
              </div>
              <div><Label>Coût mensuel (€)</Label><Input type="number" min={0} step={0.01} value={form.monthly_cost} onChange={(e) => set("monthly_cost", parseFloat(e.target.value) || 0)} /></div>
            </div>
          </div>

          {/* Dates d'entretien */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Entretien & Suivi</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Dernier entretien</Label><Input type="date" value={form.last_maintenance_date} onChange={(e) => set("last_maintenance_date", e.target.value)} /></div>
              <div><Label>Prochain entretien</Label><Input type="date" value={form.next_maintenance_date} onChange={(e) => set("next_maintenance_date", e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Contrôle technique</Label><Input type="date" value={form.technical_control_date} onChange={(e) => set("technical_control_date", e.target.value)} /></div>
              <div><Label>Échéance assurance</Label><Input type="date" value={form.insurance_expiry} onChange={(e) => set("insurance_expiry", e.target.value)} /></div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Label>Notes</Label>
            <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Informations complémentaires..." />
          </div>

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