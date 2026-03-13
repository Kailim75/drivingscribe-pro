import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { offerSchema, type OfferFormData } from "@/lib/validations";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: OfferFormData) => void;
  loading?: boolean;
  initial?: Partial<OfferFormData>;
}

export default function OfferFormDialog({ open, onClose, onSubmit, loading, initial }: Props) {
  const [form, setForm] = useState<OfferFormData>({
    name: "", type: "heure", price: 0, hours: 1,
    tva_rate: 20, deposit_percent: 0, cancellation_policy: "", activity_type: "auto_ecole", active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initial) setForm((f) => ({ ...f, ...initial }));
    else setForm({ name: "", type: "heure", price: 0, hours: 1, tva_rate: 20, deposit_percent: 0, cancellation_policy: "", activity_type: "auto_ecole", active: true });
    setErrors({});
  }, [initial, open]);

  const set = (k: keyof OfferFormData, v: string | number | boolean | null) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, hours: form.type === "heure" ? 1 : form.hours };
    const result = offerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as string;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      toast.error(result.error.errors[0].message);
      return;
    }
    onSubmit(result.data);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier l'offre" : "Nouvelle offre"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Nom *</Label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Pack 20h Auto-école" maxLength={200} />
            {errors.name && <p className="text-xs text-destructive mt-0.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="heure">À l'heure</option>
                <option value="pack">Pack</option>
                <option value="forfait">Forfait</option>
              </select>
            </div>
            <div>
              <Label>Activité</Label>
              <select value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="auto_ecole">Auto-école</option>
                <option value="taxi">Taxi</option>
                <option value="vtc">VTC</option>
                <option value="vmdtr">VMDTR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Prix TTC (€)</Label><Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} /></div>
            {form.type !== "heure" && (
              <div><Label>Heures incluses</Label><Input type="number" min={1} value={form.hours ?? 1} onChange={(e) => set("hours", parseInt(e.target.value) || 1)} /></div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>TVA (%)</Label><Input type="number" min={0} max={100} step={0.1} value={form.tva_rate} onChange={(e) => set("tva_rate", parseFloat(e.target.value) || 0)} /></div>
            <div><Label>Acompte (%)</Label><Input type="number" min={0} max={100} value={form.deposit_percent} onChange={(e) => set("deposit_percent", parseFloat(e.target.value) || 0)} /></div>
          </div>
          <div><Label>Conditions d'annulation</Label><Input value={form.cancellation_policy} onChange={(e) => set("cancellation_policy", e.target.value)} maxLength={1000} /></div>
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
