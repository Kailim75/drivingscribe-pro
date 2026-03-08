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

export default function StudentFormDialog({ open, onClose, onSubmit, loading, initial }: Props) {
  const [form, setForm] = useState({
    first_name: "", last_name: "", phone: "", email: "", address: "",
    activity_type: "auto_ecole", notes: "",
  });

  useEffect(() => {
    if (initial) setForm({ ...form, ...initial });
    else setForm({ first_name: "", last_name: "", phone: "", email: "", address: "", activity_type: "auto_ecole", notes: "" });
  }, [initial, open]);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) return;
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Modifier l'élève" : "Nouvel élève"}</DialogTitle>
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
          <div><Label>Adresse</Label><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></div>
          <div>
            <Label>Type d'activité</Label>
            <select value={form.activity_type} onChange={(e) => set("activity_type", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <option value="auto_ecole">Auto-école</option>
              <option value="taxi">Taxi</option>
              <option value="vtc">VTC</option>
              <option value="vmdtr">VMDTR</option>
            </select>
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
