import { motion } from "framer-motion";
import { Plus, Search, CreditCard, Banknote, Building2, Smartphone } from "lucide-react";
import { useState } from "react";
import { payments, getStudentName, invoices, formatEur, formatDate, type PaymentMethod } from "@/data/mockData";
import { cn } from "@/lib/utils";

const methodConfig: Record<PaymentMethod, { label: string; icon: React.ElementType; color: string }> = {
  espèces: { label: "Espèces", icon: Banknote, color: "bg-success/10 text-success" },
  virement: { label: "Virement", icon: Building2, color: "bg-info/10 text-info" },
  carte: { label: "Carte", icon: CreditCard, color: "bg-primary/10 text-primary" },
  chèque: { label: "Chèque", icon: Smartphone, color: "bg-muted text-muted-foreground" },
};

export default function Payments() {
  const [search, setSearch] = useState("");

  const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((p) => getStudentName(p.studentId).toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase()));

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);
  const totalByMethod = (Object.keys(methodConfig) as PaymentMethod[]).map((m) => ({
    method: m,
    total: payments.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0),
    count: payments.filter((p) => p.method === m).length,
  }));

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Paiements</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{payments.length} paiements · {formatEur(totalReceived)} encaissés</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Enregistrer un paiement
        </button>
      </div>

      {/* Summary by method */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {totalByMethod.map(({ method, total, count }) => {
          const cfg = methodConfig[method];
          const Icon = cfg.icon;
          return (
            <div key={method} className="glass-card rounded-xl p-3.5 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{formatEur(total)}</p>
                <p className="text-[10px] text-muted-foreground">{cfg.label} · {count}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un paiement..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Élève</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Facture</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Mode</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Montant</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Référence</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const inv = invoices.find((i) => i.id === p.invoiceId);
                const cfg = methodConfig[p.method];
                return (
                  <tr key={p.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(p.date)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{getStudentName(p.studentId)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden md:table-cell">{inv?.number || "-"}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-success">{formatEur(p.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground hidden lg:table-cell">{p.reference}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CreditCard className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Aucun paiement trouvé</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
