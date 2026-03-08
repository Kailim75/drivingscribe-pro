import { motion } from "framer-motion";
import { Plus, Search, Loader2, Receipt } from "lucide-react";
import { useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useVehicles } from "@/hooks/useVehicles";
import { useInstructors } from "@/hooks/useInstructors";
import { formatEur } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const CATEGORIES = ["Carburant", "Entretien", "Assurance", "Loyer", "Rémunération", "Logiciel", "Administratif", "Autre"];
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Expenses() {
  const { expenses, isLoading, create } = useExpenses();
  const { vehicles } = useVehicles();
  const { instructors } = useInstructors();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("tous");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ category: "Autre", description: "", amount: 0, type: "directe" as "directe" | "fixe", date: new Date().toISOString().split("T")[0], recurring: false, recurring_period: "", vehicle_id: "", instructor_id: "" });

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));
  const filtered = sorted.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "tous" || e.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalFixed = expenses.filter((e) => e.type === "fixe").reduce((s, e) => s + e.amount, 0);
  const totalDirect = expenses.filter((e) => e.type === "directe").reduce((s, e) => s + e.amount, 0);

  const categories = [...new Set(expenses.map((e) => e.category))].filter(Boolean);
  const byCategory = categories.map((cat) => ({
    category: cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0),
  })).sort((a, b) => b.total - a.total);

  const handleSubmit = () => {
    if (!form.description || !form.amount) return;
    create.mutate({
      category: form.category,
      description: form.description,
      amount: form.amount,
      type: form.type,
      date: form.date,
      recurring: form.recurring,
      recurring_period: form.recurring_period || undefined,
      vehicle_id: form.vehicle_id || undefined,
      instructor_id: form.instructor_id || undefined,
    }, { onSuccess: () => setDialogOpen(false) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dépenses</h1>
          <p className="page-subtitle">{expenses.length} dépenses · {formatEur(totalFixed + totalDirect)} total</p>
        </div>
        <button onClick={() => { setForm({ category: "Autre", description: "", amount: 0, type: "directe", date: new Date().toISOString().split("T")[0], recurring: false, recurring_period: "", vehicle_id: "", instructor_id: "" }); setDialogOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouvelle dépense
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalFixed)}</p>
          <p className="text-xs text-muted-foreground mt-1">Charges fixes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalDirect)}</p>
          <p className="text-xs text-muted-foreground mt-1">Charges directes</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-lg font-bold text-foreground">{formatEur(totalFixed + totalDirect)}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
      </div>

      {byCategory.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">Répartition par catégorie</h2>
          <div className="space-y-2.5">
            {byCategory.map((c) => {
              const total = totalFixed + totalDirect;
              const pct = total > 0 ? ((c.total / total) * 100).toFixed(0) : "0";
              return (
                <div key={c.category} className="flex items-center gap-3">
                  <span className="text-xs text-foreground w-24 truncate font-medium">{c.category}</span>
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
      )}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-shadow" />
        </div>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <option value="tous">Tous types</option>
          <option value="fixe">Charges fixes</option>
          <option value="directe">Charges directes</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="hidden sm:table-cell">Catégorie</th>
                <th className="hidden md:table-cell">Type</th>
                <th className="hidden lg:table-cell">Rattachement</th>
                <th className="text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp) => {
                const vehicle = exp.vehicles;
                const instructor = exp.instructors;
                const attachment = vehicle ? `${vehicle.brand} ${vehicle.model}` : instructor ? `${instructor.first_name} ${instructor.last_name}` : "Global";
                return (
                  <tr key={exp.id}>
                    <td className="text-xs text-muted-foreground">{formatDate(exp.date)}</td>
                    <td className="font-medium text-foreground">
                      {exp.description}
                      {exp.recurring && <span className="ml-1.5 status-badge rounded-md bg-primary/10 text-primary">↻ {exp.recurring_period}</span>}
                    </td>
                    <td className="text-xs text-muted-foreground hidden sm:table-cell">{exp.category}</td>
                    <td className="hidden md:table-cell">
                      <span className={cn("status-badge rounded-md", exp.type === "fixe" ? "bg-info/10 text-info" : "bg-warning/10 text-warning")}>{exp.type === "fixe" ? "Fixe" : "Directe"}</span>
                    </td>
                    <td className="text-xs text-muted-foreground hidden lg:table-cell">{attachment}</td>
                    <td className="text-right font-semibold text-foreground">{formatEur(exp.amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Receipt className="w-8 h-8 opacity-40 mb-2" />
            <p className="text-sm">Aucune dépense trouvée</p>
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="directe">Directe</option>
                  <option value="fixe">Fixe</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1" placeholder="Plein carburant, Loyer bureau..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant (€)</Label>
                <Input type="number" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Véhicule (optionnel)</Label>
                <select value={form.vehicle_id} onChange={(e) => setForm((f) => ({ ...f, vehicle_id: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Aucun</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</option>)}
                </select>
              </div>
              <div>
                <Label>Formateur (optionnel)</Label>
                <select value={form.instructor_id} onChange={(e) => setForm((f) => ({ ...f, instructor_id: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Aucun</option>
                  {instructors.map((i) => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="recurring" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))} className="rounded border-border" />
              <Label htmlFor="recurring" className="text-sm cursor-pointer">Récurrente</Label>
              {form.recurring && (
                <select value={form.recurring_period} onChange={(e) => setForm((f) => ({ ...f, recurring_period: e.target.value }))} className="bg-card text-sm px-2 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="mensuel">Mensuel</option>
                  <option value="trimestriel">Trimestriel</option>
                  <option value="annuel">Annuel</option>
                </select>
              )}
            </div>
            <button onClick={handleSubmit} disabled={create.isPending || !form.description || !form.amount} className="w-full btn-primary justify-center">
              {create.isPending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}