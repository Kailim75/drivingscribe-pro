import { motion } from "framer-motion";
import { Plus, Search, Filter, Receipt, ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { expenses, vehicles, instructors, formatEur, formatDate, type ExpenseType } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("tous");

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "tous" || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalFixed = expenses.filter((e) => e.type === "fixe").reduce((s, e) => s + e.amount, 0);
  const totalDirect = expenses.filter((e) => e.type === "directe").reduce((s, e) => s + e.amount, 0);
  const totalRecurring = expenses.filter((e) => e.recurring).reduce((s, e) => s + e.amount, 0);

  const categories = [...new Set(expenses.map((e) => e.category))];
  const byCategory = categories.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
    count: expenses.filter((e) => e.category === cat).length,
  })).sort((a, b) => b.total - a.total);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dépenses</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{expenses.length} dépenses ce mois</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nouvelle dépense
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3.5 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalFixed)}</p>
          <p className="text-[10px] text-muted-foreground">Charges fixes</p>
        </div>
        <div className="glass-card rounded-xl p-3.5 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalDirect)}</p>
          <p className="text-[10px] text-muted-foreground">Charges directes</p>
        </div>
        <div className="glass-card rounded-xl p-3.5 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalFixed + totalDirect)}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      {/* By category */}
      <div className="glass-card rounded-xl p-4">
        <h2 className="text-sm font-semibold text-foreground mb-3">Répartition par catégorie</h2>
        <div className="space-y-2">
          {byCategory.map((c) => {
            const pct = ((c.total / (totalFixed + totalDirect)) * 100).toFixed(0);
            return (
              <div key={c.category} className="flex items-center gap-3">
                <span className="text-xs text-foreground w-24 truncate">{c.category}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-20 text-right">{formatEur(c.total)}</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="tous">Tous types</option>
          <option value="fixe">Charges fixes</option>
          <option value="directe">Charges directes</option>
        </select>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Catégorie</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Rattachement</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => {
                const vehicle = exp.vehicleId ? vehicles.find((v) => v.id === exp.vehicleId) : null;
                const instructor = exp.instructorId ? instructors.find((i) => i.id === exp.instructorId) : null;
                const attachment = vehicle ? `${vehicle.brand} ${vehicle.model}` : instructor ? `${instructor.firstName} ${instructor.lastName}` : "Global";
                return (
                  <tr key={exp.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(exp.date)}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {exp.description}
                      {exp.recurring && <span className="ml-1.5 text-[10px] text-primary">↻ {exp.recurringPeriod}</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{exp.category}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", exp.type === "fixe" ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>{exp.type === "fixe" ? "Fixe" : "Directe"}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">{attachment}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{formatEur(exp.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
