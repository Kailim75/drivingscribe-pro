import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Building2, Users } from "lucide-react";
import { usePayers } from "@/hooks/usePayers";
import { useStudents } from "@/hooks/useStudents";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export default function BulkAssignPayerDialog({ open, onOpenChange }: Props) {
  const { payers } = usePayers();
  const { students } = useStudents();
  const { organization } = useOrg();
  const { log } = useAuditLog();
  const qc = useQueryClient();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payerId, setPayerId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const activeStudents = students.filter((s) => s.status !== "archive");

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === activeStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeStudents.map((s) => s.id)));
    }
  };

  const handleAssign = async () => {
    if (selectedIds.size === 0 || !payerId) return;
    setLoading(true);
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase
        .from("students")
        .update({ payer_id: payerId === "__none__" ? null : payerId })
        .in("id", ids)
        .eq("organization_id", organization!.id);
      if (error) throw error;

      const payerName = payerId === "__none__"
        ? "Aucun"
        : payers.find((p) => p.id === payerId)?.name || "";

      log({
        action: "bulk_assign_payer",
        entity: "student",
        details: `${ids.length} élève(s) → ${payerName}`,
      });

      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success(`${ids.length} élève(s) mis à jour`);
      setSelectedIds(new Set());
      setPayerId("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Assigner un tiers payeur en lot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Payer selector */}
          <div>
            <Label>Tiers payeur à assigner</Label>
            <select
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Choisir un payeur —</option>
              <option value="__none__">❌ Retirer le tiers payeur</option>
              {payers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Student list */}
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">
              {selectedIds.size} / {activeStudents.length} sélectionné(s)
            </Label>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
              {selectedIds.size === activeStudents.length ? "Tout désélectionner" : "Tout sélectionner"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 border border-border rounded-lg p-2 min-h-0">
            {activeStudents.map((s) => {
              const currentPayer = payers.find((p) => p.id === s.payer_id);
              return (
                <label
                  key={s.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedIds.has(s.id)}
                    onCheckedChange={() => toggleStudent(s.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {s.first_name} {s.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {currentPayer ? `Payeur : ${currentPayer.name}` : "Aucun payeur"}
                    </p>
                  </div>
                </label>
              );
            })}
            {activeStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aucun élève actif</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={handleAssign} disabled={loading || selectedIds.size === 0 || !payerId}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Assigner ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
