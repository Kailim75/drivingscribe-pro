import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus, Search, FileText, ArrowRight, Download, Link2, MoreVertical,
  Loader2, Users, Zap, TrendingUp, Clock, AlertCircle, CheckCircle2,
  Filter, X, Pencil,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useInvoices } from "@/hooks/useInvoices";
import { useStudents } from "@/hooks/useStudents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import BatchInvoiceDialog from "@/components/invoicing/BatchInvoiceDialog";
import InvoiceCreateDialog from "@/components/invoicing/InvoiceCreateDialog";
import GroupedBillingTab from "@/components/invoicing/GroupedBillingTab";
import { useSearchParams } from "react-router-dom";

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground", icon: FileText },
  envoyé: { label: "Envoyé", color: "bg-info/10 text-info border-info/20", icon: ArrowRight },
  partiellement_payé: { label: "Partiel", color: "bg-warning/10 text-warning border-warning/20", icon: Clock },
  payé: { label: "Payé", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  en_retard: { label: "En retard", color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertCircle },
  annulé: { label: "Annulé", color: "bg-muted text-muted-foreground", icon: X },
  archivé: { label: "Archivé", color: "bg-muted text-muted-foreground", icon: FileText },
};

const formatEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Invoicing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mainTab = searchParams.get("tab") === "groupee" ? "groupee" : "standard";

  const { invoices, isLoading, create, update, updateWithLines, convertToInvoice, archive } = useInvoices();
  const { students } = useStudents();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [typeFilter, setTypeFilter] = useState<"tous" | "devis" | "facture" | "groupee">("tous");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [docType, setDocType] = useState<"devis" | "facture">("facture");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [sendConfirm, setSendConfirm] = useState<string | null>(null);
  const [editInvoice, setEditInvoice] = useState<any>(null);

  // Computed stats
  const stats = useMemo(() => {
    const factures = invoices.filter((i) => i.type === "facture");
    return {
      totalFacture: factures.reduce((s, i) => s + i.total_ttc, 0),
      totalEncaisse: factures.reduce((s, i) => s + i.paid_amount, 0),
      totalImpaye: factures.filter((i) => i.remaining_amount > 0).reduce((s, i) => s + i.remaining_amount, 0),
      enRetard: invoices.filter((i) => i.status === "en_retard").length,
      groupees: invoices.filter((i) => !!(i as any).payer_id).length,
      devisCount: invoices.filter((i) => i.type === "devis").length,
      factureCount: factures.length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((inv) => {
      const studentName = inv.students ? `${inv.students.first_name} ${inv.students.last_name}` : "";
      const payerName = (inv as any).payers?.name || "";
      const matchSearch =
        !search ||
        inv.number.toLowerCase().includes(search.toLowerCase()) ||
        studentName.toLowerCase().includes(search.toLowerCase()) ||
        payerName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "tous" || inv.status === statusFilter;
      const matchType =
        typeFilter === "tous" ||
        (typeFilter === "groupee" ? !!(inv as any).payer_id : inv.type === typeFilter);
      return matchSearch && matchStatus && matchType;
    });
  }, [invoices, search, statusFilter, typeFilter]);

  const hasActiveFilters = statusFilter !== "tous" || typeFilter !== "tous" || search !== "";

  const openCreate = (type: "devis" | "facture") => {
    setDocType(type);
    setDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("tous");
    setTypeFilter("tous");
  };

  const handleDownloadPdf = async (invoiceId: string) => {
    setDownloadingId(invoiceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
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
    toast({ title: "Lien copié", description: "Le lien de paiement a été copié" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Facturation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {stats.factureCount} facture{stats.factureCount > 1 ? "s" : ""} · {stats.devisCount} devis{stats.enRetard > 0 ? ` · ${stats.enRetard} en retard` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {mainTab === "standard" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBatchOpen(true)}>
                <Zap className="w-4 h-4 mr-1.5" /> Auto lot
              </Button>
              <Button variant="outline" size="sm" onClick={() => openCreate("devis")}>
                <FileText className="w-4 h-4 mr-1.5" /> Devis
              </Button>
              <Button size="sm" onClick={() => openCreate("facture")}>
                <Plus className="w-4 h-4 mr-1.5" /> Facture
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Main tabs: Standard / Groupée */}
      <Tabs value={mainTab} onValueChange={(v) => setSearchParams(v === "groupee" ? { tab: "groupee" } : {})}>
        <TabsList>
          <TabsTrigger value="standard">
            <FileText className="w-3.5 h-3.5 mr-1.5" /> Facturation
          </TabsTrigger>
          <TabsTrigger value="groupee">
            <Users className="w-3.5 h-3.5 mr-1.5" /> Groupée
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-6 mt-4">
          {/* Micro-synthèse facturation */}
          {stats.enRetard > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-warning/5 text-warning border-warning/10 text-[13px] font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">
                {stats.enRetard} facture{stats.enRetard > 1 ? "s" : ""} en retard pour {formatEur(stats.totalImpaye)} — relance recommandée
              </span>
              <button onClick={() => setStatusFilter("en_retard")} className="text-xs font-semibold hover:underline whitespace-nowrap opacity-80 hover:opacity-100">
                Filtrer →
              </button>
            </div>
          )}
          {stats.enRetard === 0 && stats.totalImpaye === 0 && invoices.length > 0 && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-success/5 text-success border-success/10 text-[13px] font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Toutes les factures sont à jour — aucune action requise</span>
            </div>
          )}

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total facturé" value={formatEur(stats.totalFacture)} icon={<TrendingUp className="w-4 h-4" />} variant="default" />
            <KpiCard label="Encaissé" value={formatEur(stats.totalEncaisse)} icon={<CheckCircle2 className="w-4 h-4" />} variant="success" />
            <KpiCard label="Reste à encaisser" value={formatEur(stats.totalImpaye)} icon={<Clock className="w-4 h-4" />} variant={stats.totalImpaye > 0 ? "warning" : "default"} onClick={() => setStatusFilter(statusFilter === "partiellement_payé" ? "tous" : "partiellement_payé")} active={statusFilter === "partiellement_payé"} />
            <KpiCard label="En retard" value={`${stats.enRetard} facture${stats.enRetard > 1 ? "s" : ""}`} icon={<AlertCircle className="w-4 h-4" />} variant={stats.enRetard > 0 ? "destructive" : "default"} onClick={() => setStatusFilter(statusFilter === "en_retard" ? "tous" : "en_retard")} active={statusFilter === "en_retard"} />
          </div>

          {/* Type tabs + search + filters */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)} className="w-full sm:w-auto">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="tous">Tous ({invoices.length})</TabsTrigger>
                  <TabsTrigger value="facture">Factures ({stats.factureCount})</TabsTrigger>
                  <TabsTrigger value="devis">Devis ({stats.devisCount})</TabsTrigger>
                  {stats.groupees > 0 && (
                    <TabsTrigger value="groupee">
                      <Users className="w-3.5 h-3.5 mr-1" /> Groupées ({stats.groupees})
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>

              <div className="flex gap-2 flex-1 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="N°, élève, payeur..." className="w-full bg-background text-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 placeholder:text-muted-foreground" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className={cn(statusFilter !== "tous" && "border-primary text-primary")}>
                      <Filter className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setStatusFilter("tous")} className={cn(statusFilter === "tous" && "font-semibold")}>Tous les statuts</DropdownMenuItem>
                    {Object.entries(statusConfig).map(([key, { label }]) => (
                      <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)} className={cn(statusFilter === key && "font-semibold")}>{label}</DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {hasActiveFilters && (
                  <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Document</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Destinataire</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Montant</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Statut</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3 w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((inv) => {
                    const cfg = statusConfig[inv.status] || statusConfig.brouillon;
                    const hasPayer = !!(inv as any).payer_id;
                    const recipientName = hasPayer && (inv as any).payers?.name
                      ? (inv as any).payers.name
                      : inv.students
                        ? `${inv.students.first_name} ${inv.students.last_name}`
                        : "—";

                    return (
                      <tr key={inv.id} className="group hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", inv.type === "devis" ? "bg-info/10 text-info" : "bg-primary/10 text-primary")}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-mono text-xs font-medium text-foreground">{inv.number}</span>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[11px] text-muted-foreground capitalize">{inv.type}</span>
                                {hasPayer && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 gap-0.5">
                                        <Users className="w-2.5 h-2.5" /> Groupée
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>Tiers payeur : {(inv as any).payers?.name || "—"}</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-foreground">{recipientName}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-xs text-muted-foreground">{formatDate(inv.issue_date)}</span>
                          {inv.due_date && (
                            <span className="block text-[11px] text-muted-foreground/70">Éch. {formatDate(inv.due_date)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-semibold text-foreground">{formatEur(inv.total_ttc)}</span>
                          {inv.type === "facture" && inv.remaining_amount > 0 && inv.remaining_amount < inv.total_ttc && (
                            <span className="block text-[11px] text-destructive font-medium">Reste {formatEur(inv.remaining_amount)}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[11px] font-medium border", cfg.color)}>{cfg.label}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 items-center justify-end">
                            {inv.type === "devis" && inv.status !== "archivé" && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" onClick={() => convertToInvoice.mutate(inv.id)}>
                                    <ArrowRight className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Convertir en facture</TooltipContent>
                              </Tooltip>
                            )}
                            {inv.type === "facture" && inv.status === "brouillon" && (
                              <Button variant="ghost" size="sm" className="h-8 text-info hover:text-info text-xs" onClick={() => setSendConfirm(inv.id)}>Envoyer</Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {inv.status === "brouillon" && (
                                  <DropdownMenuItem onClick={() => { setEditInvoice(inv); setDocType(inv.type as any); setDialogOpen(true); }}>
                                    <Pencil className="w-3.5 h-3.5 mr-2" />Modifier
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleDownloadPdf(inv.id)} disabled={downloadingId === inv.id}>
                                  <Download className="w-3.5 h-3.5 mr-2" />
                                  {downloadingId === inv.id ? "Génération..." : "Télécharger PDF"}
                                </DropdownMenuItem>
                                {inv.type === "facture" && (
                                  <DropdownMenuItem onClick={() => handleCopyPaymentLink(inv.id)}>
                                    <Link2 className="w-3.5 h-3.5 mr-2" />Lien de paiement
                                  </DropdownMenuItem>
                                )}
                                {inv.status !== "archivé" && inv.status !== "payé" && (
                                  <DropdownMenuItem onClick={() => archive.mutate(inv.id)} className="text-destructive focus:text-destructive">
                                    <X className="w-3.5 h-3.5 mr-2" />Archiver
                                  </DropdownMenuItem>
                                )}
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
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <FileText className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">Aucun document trouvé</p>
                {hasActiveFilters && (
                  <Button variant="link" size="sm" onClick={clearFilters} className="mt-1 text-xs">Réinitialiser les filtres</Button>
                )}
              </div>
            )}
          </motion.div>
        </TabsContent>

        <TabsContent value="groupee" className="mt-4">
          <GroupedBillingTab />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <InvoiceCreateDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditInvoice(null); }}
        docType={docType}
        students={students}
        onCreate={(data, opts) => create.mutate(data, opts)}
        isPending={create.isPending}
        editInvoice={editInvoice}
        onEdit={(data, opts) => updateWithLines.mutate(data, opts)}
        isEditPending={updateWithLines.isPending}
      />

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

      <BatchInvoiceDialog open={batchOpen} onOpenChange={setBatchOpen} />
    </div>
  );
}

/* KPI Card component */
function KpiCard({
  label, value, icon, variant = "default", onClick, active,
}: {
  label: string; value: string; icon: React.ReactNode; variant?: "default" | "success" | "warning" | "destructive"; onClick?: () => void; active?: boolean;
}) {
  const variantStyles = { default: "text-foreground", success: "text-success", warning: "text-warning", destructive: "text-destructive" };
  return (
    <div onClick={onClick} className={cn("rounded-xl border border-border bg-card p-4 transition-all", onClick && "cursor-pointer hover:shadow-md hover:border-primary/30", active && "ring-2 ring-primary/30 border-primary/40")}>
      <div className={cn("flex items-center gap-1.5 text-muted-foreground mb-2")}>
        <span className={cn(variantStyles[variant], "opacity-70")}>{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={cn("text-lg font-bold tracking-tight", variantStyles[variant])}>{value}</p>
    </div>
  );
}
