import { motion } from "framer-motion";
import { Plus, Search, FileText, ArrowRight, Download, Link2, MoreVertical, Loader2, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useStudents } from "@/hooks/useStudents";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  envoyé: { label: "Envoyé", color: "bg-info/10 text-info" },
  partiellement_payé: { label: "Partiel", color: "bg-warning/10 text-warning" },
  payé: { label: "Payé", color: "bg-success/10 text-success" },
  en_retard: { label: "En retard", color: "bg-destructive/10 text-destructive" },
  annulé: { label: "Annulé", color: "bg-muted text-muted-foreground" },
  archivé: { label: "Archivé", color: "bg-muted text-muted-foreground" },
};

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Invoicing() {
  const { invoices, isLoading, create, update, convertToInvoice } = useInvoices();
  const { students } = useStudents();
  const { organization } = useOrg();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [docType, setDocType] = useState<"devis" | "facture">("facture");

  const [form, setForm] = useState({ student_id: "", due_date: "", notes: "", lines: [{ description: "", quantity: 1, unit_price: 0 }] });

  const filtered = invoices.filter((inv) => {
    const studentName = inv.students ? `${inv.students.first_name} ${inv.students.last_name}` : "";
    const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || inv.status === statusFilter;
    const matchType = typeFilter === "tous"
      || (typeFilter === "groupee" ? !!(inv as any).payer_id : inv.type === typeFilter);
    return matchSearch && matchStatus && matchType;
  });

  const totalUnpaid = invoices.filter((i) => i.type === "facture" && i.remaining_amount > 0).reduce((s, i) => s + i.remaining_amount, 0);

  const openCreate = (type: "devis" | "facture") => {
    setDocType(type);
    setForm({ student_id: "", due_date: "", notes: "", lines: [{ description: "", quantity: 1, unit_price: 0 }] });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.student_id || form.lines.every((l) => !l.description)) return;
    const tvaRate = organization?.tva_rate || 20;
    const lines = form.lines.filter((l) => l.description).map((l) => ({ ...l, total_ht: l.quantity * l.unit_price }));
    const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
    const tvaAmount = totalHt * (tvaRate / 100);
    const totalTtc = totalHt + tvaAmount;

    const { data: numberResult, error: numberError } = await supabase.rpc("next_document_number", {
      _org_id: organization!.id,
      _type: docType,
    });
    if (numberError || !numberResult) {
      toast({ title: "Erreur", description: "Impossible de générer le numéro", variant: "destructive" });
      return;
    }
    const number = numberResult as string;

    create.mutate({
      number,
      type: docType,
      student_id: form.student_id,
      total_ht: totalHt,
      tva_amount: tvaAmount,
      total_ttc: totalTtc,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: form.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: form.notes,
      lines,
    }, { onSuccess: () => setDialogOpen(false) });
  };

  const addLine = () => setForm((f) => ({ ...f, lines: [...f.lines, { description: "", quantity: 1, unit_price: 0 }] }));
  const updateLine = (idx: number, field: string, value: any) => {
    setForm((f) => ({ ...f, lines: f.lines.map((l, i) => i === idx ? { ...l, [field]: value } : l) }));
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<string | null>(null);

  const handleDownloadPdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);

      const byteCharacters = atob(result.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF téléchargé" });
    } catch (err: any) {
      toast({ title: "Erreur PDF", description: err.message, variant: "destructive" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCopyPaymentLink = (invoiceId: string) => {
    const url = `${window.location.origin}/p/facture?id=${invoiceId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié", description: "Le lien de paiement a été copié dans le presse-papier" });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Devis & Factures</h1>
          <p className="page-subtitle">{invoices.length} documents · {formatEur(totalUnpaid)} impayés</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate("devis")} className="btn-secondary">
            <FileText className="w-4 h-4" /> Devis
          </button>
          <button onClick={() => openCreate("facture")} className="btn-primary">
            <Plus className="w-4 h-4" /> Facture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {(() => {
          const groupedCount = invoices.filter((i) => !!(i as any).payer_id).length;
          return [
            { label: "Total facturé", value: formatEur(invoices.filter((i) => i.type === "facture").reduce((s, i) => s + i.total_ttc, 0)) },
            { label: "Encaissé", value: formatEur(invoices.filter((i) => i.type === "facture").reduce((s, i) => s + i.paid_amount, 0)) },
            { label: "Reste à encaisser", value: formatEur(totalUnpaid), alert: totalUnpaid > 0 },
            { label: "En retard", value: `${invoices.filter((i) => i.status === "en_retard").length}`, alert: true, filterAction: () => setStatusFilter("en_retard") },
            { label: "Groupées", value: `${groupedCount}`, grouped: true, filterAction: () => setTypeFilter("groupee") },
          ].map((k) => (
            <div
              key={k.label}
              onClick={k.filterAction}
              className={cn(
                "glass-card rounded-xl p-4 text-center",
                k.alert && totalUnpaid > 0 && "border-destructive/20",
                "grouped" in k && k.grouped && groupedCount > 0 && "border-primary/20",
                k.filterAction && "cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
              )}
            >
              <p className={cn("text-lg font-bold", k.alert && totalUnpaid > 0 ? "text-destructive" : "grouped" in k && k.grouped && groupedCount > 0 ? "text-primary" : "text-foreground")}>
                {"grouped" in k && k.grouped && <Users className="w-4 h-4 inline-block mr-1 -mt-0.5" />}
                {k.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
            </div>
          ));
        })()}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-shadow" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Tous types</option>
          <option value="devis">Devis</option>
          <option value="facture">Factures</option>
          <option value="groupee">Groupées</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Tous statuts</option>
          <option value="brouillon">Brouillon</option>
          <option value="envoyé">Envoyé</option>
          <option value="partiellement_payé">Partiel</option>
          <option value="payé">Payé</option>
          <option value="en_retard">En retard</option>
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Type</th>
                <th>Élève</th>
                <th className="hidden md:table-cell">Date</th>
                <th className="text-right">TTC</th>
                <th className="text-right hidden sm:table-cell">Reste</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const cfg = statusConfig[inv.status] || statusConfig.brouillon;
                const studentName = (inv as any).payer_id && (inv as any).payers?.name
                  ? (inv as any).payers.name
                  : inv.students ? `${inv.students.first_name} ${inv.students.last_name}` : "—";
                return (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs text-foreground">{inv.number}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <span className={cn("status-badge rounded-md", inv.type === "devis" ? "bg-info/10 text-info" : "bg-primary/10 text-primary")}>
                          {inv.type === "devis" ? "Devis" : "Facture"}
                        </span>
                        {(inv as any).payer_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="status-badge rounded-md bg-accent text-accent-foreground text-[10px] inline-flex items-center gap-0.5 cursor-default">
                                <Users className="w-3 h-3" /> Groupée
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              Tiers payeur : {(inv as any).payers?.name || "—"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </td>
                    <td className="font-medium text-foreground">{studentName}</td>
                    <td className="text-muted-foreground text-xs hidden md:table-cell">{formatDate(inv.issue_date)}</td>
                    <td className="text-right font-semibold text-foreground">{formatEur(inv.total_ttc)}</td>
                    <td className={cn("text-right font-semibold hidden sm:table-cell", inv.remaining_amount > 0 ? "text-destructive" : "text-success")}>{formatEur(inv.remaining_amount)}</td>
                    <td>
                      <span className={cn("status-badge rounded-md", cfg.color)}>{cfg.label}</span>
                    </td>
                    <td>
                      <div className="flex gap-1 items-center">
                        {inv.type === "devis" && inv.status !== "archivé" && (
                          <button onClick={() => convertToInvoice.mutate(inv.id)} className="status-badge rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Convertir
                          </button>
                        )}
                        {inv.type === "facture" && inv.status === "brouillon" && (
                          <button onClick={() => setSendConfirm(inv.id)} className="status-badge rounded-md bg-info/10 text-info hover:bg-info/20 transition-colors">
                            Envoyer
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-accent transition-colors">
                              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownloadPdf(inv.id)} disabled={downloadingId === inv.id}>
                              <Download className="w-3.5 h-3.5 mr-2" />
                              {downloadingId === inv.id ? "Génération..." : "Télécharger PDF"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCopyPaymentLink(inv.id)}>
                              <Link2 className="w-3.5 h-3.5 mr-2" />
                              Copier lien de paiement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileText className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Aucun document trouvé</p>
          </div>
        )}
      </motion.div>

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{docType === "devis" ? "Nouveau devis" : "Nouvelle facture"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Élève</Label>
              <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Sélectionner...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Échéance</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="mt-1" />
            </div>

            <div>
              <Label>Lignes</Label>
              {form.lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mt-2">
                  <Input placeholder="Description" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} className="col-span-6" />
                  <Input type="number" placeholder="Qté" value={line.quantity} onChange={(e) => updateLine(i, "quantity", Number(e.target.value))} className="col-span-2" />
                  <Input type="number" placeholder="P.U. HT" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", Number(e.target.value))} className="col-span-3" />
                  <span className="col-span-1 flex items-center text-xs text-muted-foreground">{formatEur(line.quantity * line.unit_price)}</span>
                </div>
              ))}
              <button onClick={addLine} className="mt-2 text-xs text-primary hover:underline">+ Ajouter une ligne</button>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 h-16 resize-none" />
            </div>

            <div className="glass-card rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span className="font-medium">{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0))}</span></div>
              <div className="flex justify-between mt-1"><span className="text-muted-foreground">TVA ({organization?.tva_rate || 20}%)</span><span className="font-medium">{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0) * ((organization?.tva_rate || 20) / 100))}</span></div>
              <div className="flex justify-between mt-1 pt-1 border-t border-border font-bold">
                <span>Total TTC</span>
                <span>{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0) * (1 + (organization?.tva_rate || 20) / 100))}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={create.isPending} className="w-full btn-primary justify-center">
              {create.isPending ? "Création..." : `Créer le ${docType}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send confirm */}
      <AlertDialog open={!!sendConfirm} onOpenChange={(v) => !v && setSendConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Marquer comme envoyée ?</AlertDialogTitle>
            <AlertDialogDescription>Le statut de la facture passera à « envoyé ».</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (sendConfirm) { update.mutate({ id: sendConfirm, status: "envoyé" }); setSendConfirm(null); } }}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}