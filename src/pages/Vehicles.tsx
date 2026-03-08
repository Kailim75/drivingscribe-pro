import { motion } from "framer-motion";
import { Search, Plus, Car, Loader2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useVehicles } from "@/hooks/useVehicles";
import { useAuditLog } from "@/hooks/useAuditLog";
import { vehicleStatusLabels, vehicleStatusColors, activityTypeLabels, formatEur } from "@/lib/labels";
import VehicleFormDialog from "@/components/vehicles/VehicleFormDialog";

export default function Vehicles() {
  const { vehicles, isLoading, create } = useVehicles();
  const { log } = useAuditLog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);

  const filtered = vehicles.filter((v) => {
    const matchSearch = `${v.brand} ${v.model} ${v.plate}`.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "tous" || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "vehicle", details: `${data.brand} ${data.model} (${data.plate})` });
      },
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Véhicules</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm">
          <Plus className="w-4 h-4" /> Nouveau véhicule
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un véhicule..."
            className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="tous">Tous les statuts</option>
          <option value="actif">Actif</option>
          <option value="indisponible">Indisponible</option>
          <option value="maintenance">Maintenance</option>
          <option value="archive">Archivé</option>
        </select>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {filtered.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <Car className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">{vehicles.length === 0 ? "Aucun véhicule" : "Aucun résultat"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {vehicles.length === 0 ? "Ajoutez votre premier véhicule" : "Essayez avec d'autres critères"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((v) => (
              <div key={v.id} className="glass-card rounded-xl p-4 hover:border-primary/20 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{v.brand} {v.model}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{v.plate}</p>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", vehicleStatusColors[v.status])}>
                    {vehicleStatusLabels[v.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">{activityTypeLabels[v.category] || v.category}</span>
                  <span className="text-xs text-foreground font-medium">{formatEur(Number(v.monthly_cost))}/mois</span>
                </div>
                {v.notes && <p className="text-xs text-muted-foreground mt-2">{v.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <VehicleFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
    </div>
  );
}
