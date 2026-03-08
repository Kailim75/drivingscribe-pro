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
  });

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial });
    else setForm({ plate: "", brand: "", model: "", category: "auto_ecole", monthly_cost: 0, notes: "" });
  }, [initial, open]);

  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plate.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier le véhicule" : "Nouveau véhicule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div><Label>Immatriculation *</Label><Input value={form.plate} onChange={(e) => set("plate", e.target.value)} required placeholder="AB-123-CD" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Marque</Label><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} /></div>
            <div><Label>Modèle</Label><Input value={form.model} onChange={(e) => set("model", e.target.value)} /></div>
          </div>
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
