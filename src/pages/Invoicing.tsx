import { motion } from "framer-motion";
import { Plus, Search, FileText, ArrowRight, Download, Link2, MoreVertical, Loader2 } from "lucide-react";
import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useStudents } from "@/hooks/useStudents";
import { useOrg } from "@/contexts/OrgContext";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  // Form state
  const [form, setForm] = useState({ student_id: "", due_date: "", notes: "", lines: [{ description: "", quantity: 1, unit_price: 0 }] });

  const filtered = invoices.filter((inv) => {
    const studentName = inv.students ? `${inv.students.first_name} ${inv.students.last_name}` : "";
    const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || studentName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || inv.status === statusFilter;
    const matchType = typeFilter === "tous" || inv.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const totalUnpaid = invoices.filter((i) => i.type === "facture" && i.remaining_amount > 0).reduce((s, i) => s + i.remaining_amount, 0);

  const openCreate = (type: "devis" | "facture") => {
    setDocType(type);
    setForm({ student_id: "", due_date: "", notes: "", lines: [{ description: "", quantity: 1, unit_price: 0 }] });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.student_id || form.lines.every((l) => !l.description)) return;
    const tvaRate = organization?.tva_rate || 20;
    const lines = form.lines.filter((l) => l.description).map((l) => ({ ...l, total_ht: l.quantity * l.unit_price }));
    const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
    const tvaAmount = totalHt * (tvaRate / 100);
    const totalTtc = totalHt + tvaAmount;

    const prefix = docType === "devis" ? (organization?.quote_prefix || "D") : (organization?.invoice_prefix || "F");
    const nextNum = docType === "devis" ? (organization?.quote_next_number || 1) : (organization?.invoice_next_number || 1);
    const number = `${prefix}-${new Date().getFullYear()}-${String(nextNum).padStart(3, "0")}`;

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

      // Download the PDF
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Devis & Factures</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{invoices.length} documents · {formatEur(totalUnpaid)} impayés</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openCreate("devis")} className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border">
            <FileText className="w-4 h-4" /> Devis
          </button>
          <button onClick={() => openCreate("facture")} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Facture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total facturé", value: formatEur(invoices.filter((i) => i.type === "facture").reduce((s, i) => s + i.total_ttc, 0)) },
          { label: "Encaissé", value: formatEur(invoices.filter((i) => i.type === "facture").reduce((s, i) => s + i.paid_amount, 0)) },
          { label: "Reste à encaisser", value: formatEur(totalUnpaid), alert: totalUnpaid > 0 },
          { label: "En retard", value: `${invoices.filter((i) => i.status === "en_retard").length}`, alert: true },
        ].map((k) => (
          <div key={k.label} className={cn("glass-card rounded-xl p-3.5 text-center", k.alert && totalUnpaid > 0 && "border-destructive/20")}>
            <p className={cn("text-lg font-bold", k.alert && totalUnpaid > 0 ? "text-destructive" : "text-foreground")}>{k.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border">
          <option value="tous">Tous types</option>
          <option value="devis">Devis</option>
          <option value="facture">Factures</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border">
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">N°</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Élève</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">TTC</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Reste</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const cfg = statusConfig[inv.status] || statusConfig.brouillon;
                const studentName = inv.students ? `${inv.students.first_name} ${inv.students.last_name}` : "—";
                return (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.number}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", inv.type === "devis" ? "bg-info/10 text-info" : "bg-primary/10 text-primary")}>
                        {inv.type === "devis" ? "Devis" : "Facture"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{formatDate(inv.issue_date)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatEur(inv.total_ttc)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium hidden sm:table-cell", inv.remaining_amount > 0 ? "text-destructive" : "text-success")}>{formatEur(inv.remaining_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        {inv.type === "devis" && inv.status !== "archivé" && (
                          <button onClick={() => convertToInvoice.mutate(inv.id)} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" /> Convertir
                          </button>
                        )}
                        {inv.type === "facture" && inv.status === "brouillon" && (
                          <button onClick={() => update.mutate({ id: inv.id, status: "envoyé" })} className="text-[10px] px-2 py-0.5 rounded bg-info/10 text-info hover:bg-info/20 transition-colors">
                            Envoyer
                          </button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded hover:bg-secondary transition-colors">
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
              <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
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
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border h-16 resize-none" />
            </div>

            <div className="glass-card rounded-lg p-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Total HT</span><span>{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0))}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">TVA ({organization?.tva_rate || 20}%)</span><span>{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0) * ((organization?.tva_rate || 20) / 100))}</span></div>
              <div className="flex justify-between font-bold border-t border-border mt-1 pt-1">
                <span>Total TTC</span>
                <span>{formatEur(form.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0) * (1 + (organization?.tva_rate || 20) / 100))}</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={create.isPending} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {create.isPending ? "Création..." : `Créer le ${docType}`}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
