import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useOffers } from "@/hooks/useOffers";
import { toast } from "@/hooks/use-toast";

const formatEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

interface Line {
  description: string;
  quantity: number;
  unit_price: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  docType: "devis" | "facture";
  students: { id: string; first_name: string; last_name: string }[];
  onCreate: (data: any, opts: { onSuccess: () => void }) => void;
  isPending: boolean;
  editInvoice?: any;
  onEdit?: (data: any, opts: { onSuccess: () => void }) => void;
  isEditPending?: boolean;
}

export default function InvoiceCreateDialog({ open, onOpenChange, docType, students, onCreate, isPending, editInvoice, onEdit, isEditPending }: Props) {
  const { organization } = useOrg();
  const { offers } = useOffers();
  const activeOffers = offers.filter((o) => o.active);
  const [studentId, setStudentId] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ description: "", quantity: 1, unit_price: 0 }]);

  const applyOffer = (offerId: string) => {
    const offer = activeOffers.find((o) => o.id === offerId);
    if (!offer) return;
    setSelectedOfferId(offerId);
    const desc = offer.type === "heure"
      ? `${offer.name} — 1h`
      : offer.type === "pack"
      ? `${offer.name} — Pack ${offer.hours || ""}h`
      : `${offer.name} — Forfait`;
    const qty = offer.type === "heure" ? 1 : 1;
    const price = Number(offer.price) || 0;
    setLines([{ description: desc, quantity: qty, unit_price: price }]);
  };

  const isEditing = !!editInvoice;

  useEffect(() => {
    if (editInvoice && open) {
      setStudentId(editInvoice.student_id);
      setDueDate(editInvoice.due_date || "");
      setNotes(editInvoice.notes || "");
      const existingLines = editInvoice.invoice_lines?.map((l: any) => ({
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
      })) || [{ description: "", quantity: 1, unit_price: 0 }];
      setLines(existingLines.length > 0 ? existingLines : [{ description: "", quantity: 1, unit_price: 0 }]);
    }
  }, [editInvoice, open]);

  const resetForm = () => {
    setStudentId("");
    setDueDate("");
    setNotes("");
    setLines([{ description: "", quantity: 1, unit_price: 0 }]);
  };

  const addLine = () => setLines((l) => [...l, { description: "", quantity: 1, unit_price: 0 }]);
  const removeLine = (idx: number) => setLines((l) => l.filter((_, i) => i !== idx));
  const updateLine = (idx: number, field: keyof Line, value: string | number) => {
    setLines((l) => l.map((line, i) => (i === idx ? { ...line, [field]: value } : line)));
  };

  const tvaRegime = (organization as any)?.tva_regime || "assujetti";
  const isFranchise = tvaRegime === "franchise_en_base";
  const tvaRate = isFranchise ? 0 : (organization?.tva_rate || 20);
  const totalHt = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
  const tvaAmount = isFranchise ? 0 : totalHt * (tvaRate / 100);
  const totalTtc = totalHt + tvaAmount;

  const handleSubmit = async () => {
    if (!studentId || lines.every((l) => !l.description)) return;
    const validLines = lines.filter((l) => l.description).map((l) => ({ ...l, total_ht: l.quantity * l.unit_price }));

    if (isEditing && onEdit) {
      onEdit(
        {
          id: editInvoice.id,
          due_date: dueDate || editInvoice.due_date,
          notes,
          lines: validLines,
        },
        {
          onSuccess: () => {
            resetForm();
            onOpenChange(false);
          },
        }
      );
      return;
    }

    const { data: numberResult, error: numberError } = await supabase.rpc("next_document_number", {
      _org_id: organization!.id,
      _type: docType,
    });
    if (numberError || !numberResult) {
      toast({ title: "Erreur", description: "Impossible de générer le numéro", variant: "destructive" });
      return;
    }

    onCreate(
      {
        number: numberResult as string,
        type: docType,
        student_id: studentId,
        total_ht: totalHt,
        tva_amount: tvaAmount,
        total_ttc: totalTtc,
        issue_date: new Date().toISOString().split("T")[0],
        due_date: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        notes,
        lines: validLines,
      },
      {
        onSuccess: () => {
          resetForm();
          onOpenChange(false);
        },
      }
    );
  };

  const pending = isEditing ? isEditPending : isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? `Modifier ${editInvoice.type === "devis" ? "le devis" : "la facture"} ${editInvoice.number}`
              : docType === "devis" ? "Nouveau devis" : "Nouvelle facture"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          {/* Student */}
          <div className="space-y-1.5">
            <Label>Élève *</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={isEditing}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un élève..." />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label>Date d'échéance</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          {/* Lines */}
          <div className="space-y-2">
            <Label>Lignes de facturation</Label>
            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Description de la prestation"
                      value={line.description}
                      onChange={(e) => updateLine(i, "description", e.target.value)}
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[11px] text-muted-foreground">Quantité</span>
                        <Input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) => updateLine(i, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Prix unitaire HT</span>
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          value={line.unit_price}
                          onChange={(e) => updateLine(i, "unit_price", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-muted-foreground">Total HT</span>
                        <div className="h-10 flex items-center text-sm font-medium">
                          {formatEur(line.quantity * line.unit_price)}
                        </div>
                      </div>
                    </div>
                  </div>
                  {lines.length > 1 && (
                    <Button variant="ghost" size="icon" className="shrink-0 mt-1 text-muted-foreground hover:text-destructive" onClick={() => removeLine(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={addLine} className="w-full">
              <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une ligne
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes (optionnel)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Conditions, remarques..." rows={2} />
          </div>

          {/* Totals */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{isFranchise ? "Total" : "Total HT"}</span>
              <span className="font-medium">{formatEur(totalHt)}</span>
            </div>
            {!isFranchise && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">TVA ({tvaRate}%)</span>
                <span className="font-medium">{formatEur(tvaAmount)}</span>
              </div>
            )}
            {!isFranchise && (
              <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                <span>Total TTC</span>
                <span className="text-primary">{formatEur(totalTtc)}</span>
              </div>
            )}
            {isFranchise && (
              <p className="text-[11px] text-muted-foreground mt-1">
                TVA non applicable, art. 293 B du CGI
              </p>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={pending || !studentId} className="w-full">
            {pending ? "Enregistrement..." : isEditing ? "Enregistrer les modifications" : `Créer le ${docType}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
