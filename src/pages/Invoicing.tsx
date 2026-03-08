import { motion } from "framer-motion";
import { Plus, Search, Filter, FileText, ExternalLink } from "lucide-react";
import { useState } from "react";
import { invoices, getStudentName, formatEur, formatDate, type InvoiceStatus } from "@/data/mockData";
import { cn } from "@/lib/utils";

const statusConfig: Record<InvoiceStatus, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  envoyé: { label: "Envoyé", color: "bg-info/10 text-info" },
  partiellement_payé: { label: "Partiel", color: "bg-warning/10 text-warning" },
  payé: { label: "Payé", color: "bg-success/10 text-success" },
  en_retard: { label: "En retard", color: "bg-destructive/10 text-destructive" },
  annulé: { label: "Annulé", color: "bg-muted text-muted-foreground" },
};

export default function Invoicing() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tous");

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.number.toLowerCase().includes(search.toLowerCase()) || getStudentName(inv.studentId).toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnpaid = invoices.filter((i) => i.remainingAmount > 0).reduce((s, i) => s + i.remainingAmount, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Devis & Factures</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{invoices.length} documents · {formatEur(totalUnpaid)} impayés</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border">
            <FileText className="w-4 h-4" /> Devis
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Facture
          </button>
        </div>
      </div>

      {/* KPI summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total facturé", value: formatEur(invoices.reduce((s, i) => s + i.totalTTC, 0)) },
          { label: "Encaissé", value: formatEur(invoices.reduce((s, i) => s + i.paidAmount, 0)) },
          { label: "Reste à encaisser", value: formatEur(totalUnpaid), alert: totalUnpaid > 0 },
          { label: "En retard", value: `${invoices.filter((i) => i.status === "en_retard").length} facture(s)`, alert: true },
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
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="tous">Tous les statuts</option>
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
                <th className="px-4 py-3 font-medium text-muted-foreground">Élève</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">TTC</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Payé</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right hidden sm:table-cell">Reste</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const cfg = statusConfig[inv.status];
                return (
                  <tr key={inv.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.number}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{getStudentName(inv.studentId)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">{formatDate(inv.issueDate)}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">{formatEur(inv.totalTTC)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">{formatEur(inv.paidAmount)}</td>
                    <td className={cn("px-4 py-3 text-right font-medium hidden sm:table-cell", inv.remainingAmount > 0 ? "text-destructive" : "text-success")}>{formatEur(inv.remainingAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
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
    </div>
  );
}
