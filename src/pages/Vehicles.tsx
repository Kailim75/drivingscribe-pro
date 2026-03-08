import { motion } from "framer-motion";
import { Search, Plus, Car, Loader2, Pencil, Archive, MoreVertical, Wrench, Shield, CalendarClock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useVehicles } from "@/hooks/useVehicles";
import { useExpenses } from "@/hooks/useExpenses";
import { useAuditLog } from "@/hooks/useAuditLog";
import { vehicleStatusLabels, vehicleStatusColors, activityTypeLabels, formatEur } from "@/lib/labels";
import VehicleFormDialog from "@/components/vehicles/VehicleFormDialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function isDateSoon(dateStr: string | null | undefined, days = 30): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= days;
}

function isDatePast(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function Vehicles() {
  const { vehicles, isLoading, create, update } = useVehicles();
  const { expenses } = useExpenses();
  const { log } = useAuditLog();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState<any>(null);
  const [archiveTarget, setArchiveTarget] = useState<any>(null);

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

  const handleUpdate = (data: any) => {
    if (!editVehicle) return;
    update.mutate({ id: editVehicle.id, ...data }, {
      onSuccess: () => {
        setEditVehicle(null);
        log({ action: "update", entity: "vehicle", entity_id: editVehicle.id, details: `${data.brand} ${data.model} (${data.plate})` });
      },
    });
  };

  const handleArchive = () => {
    if (!archiveTarget) return;
    const newStatus = archiveTarget.status === "archive" ? "actif" : "archive";
    update.mutate({ id: archiveTarget.id, status: newStatus }, {
      onSuccess: () => {
        setArchiveTarget(null);
        log({ action: "archive", entity: "vehicle", entity_id: archiveTarget.id, details: `${archiveTarget.brand} ${archiveTarget.model} → ${newStatus}` });
      },
    });
  };

  // Compute vehicle expenses
  const getVehicleExpenses = (vehicleId: string) => {
    return expenses.filter((e) => e.vehicle_id === vehicleId).reduce((s, e) => s + e.amount, 0);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-foreground">Véhicules</h1>
          <p className="text-muted-foreground text-xs mt-0.5">{vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm active:scale-95">
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
            {filtered.map((v: any) => {
              const totalExpenses = getVehicleExpenses(v.id);
              const maintenanceSoon = isDateSoon(v.next_maintenance_date);
              const maintenancePast = isDatePast(v.next_maintenance_date);
              const insuranceSoon = isDateSoon(v.insurance_expiry);
              const insurancePast = isDatePast(v.insurance_expiry);
              const controlSoon = isDateSoon(v.technical_control_date);
              const controlPast = isDatePast(v.technical_control_date);
              const hasAlert = maintenancePast || insurancePast || controlPast;

              return (
                <div key={v.id} className={cn("glass-card rounded-xl p-4 transition-colors", hasAlert ? "border-warning/40" : "hover:border-primary/20")}>
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{v.brand} {v.model}</p>
                      <p className="text-sm text-muted-foreground mt-0.5 font-mono text-xs">{v.plate}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", vehicleStatusColors[v.status])}>
                        {vehicleStatusLabels[v.status]}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 rounded-md hover:bg-secondary text-muted-foreground transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditVehicle(v)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setArchiveTarget(v)} className={v.status === "archive" ? "text-success" : "text-warning"}>
                            <Archive className="w-3.5 h-3.5 mr-2" />
                            {v.status === "archive" ? "Réactiver" : "Archiver"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Costs */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">{activityTypeLabels[v.category] || v.category}</span>
                    <div className="text-right">
                      <span className="text-xs text-foreground font-medium">{formatEur(Number(v.monthly_cost))}/mois</span>
                      {totalExpenses > 0 && (
                        <span className="text-[10px] text-muted-foreground block">{formatEur(totalExpenses)} dépensés</span>
                      )}
                    </div>
                  </div>

                  {/* Dates d'entretien */}
                  {(v.next_maintenance_date || v.insurance_expiry || v.technical_control_date) && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/50 space-y-1">
                      {v.next_maintenance_date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Wrench className="w-3 h-3" /> Entretien
                          </span>
                          <span className={cn("font-medium", maintenancePast ? "text-destructive" : maintenanceSoon ? "text-warning" : "text-foreground")}>
                            {formatDate(v.next_maintenance_date)}
                          </span>
                        </div>
                      )}
                      {v.technical_control_date && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <CalendarClock className="w-3 h-3" /> CT
                          </span>
                          <span className={cn("font-medium", controlPast ? "text-destructive" : controlSoon ? "text-warning" : "text-foreground")}>
                            {formatDate(v.technical_control_date)}
                          </span>
                        </div>
                      )}
                      {v.insurance_expiry && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Shield className="w-3 h-3" /> Assurance
                          </span>
                          <span className={cn("font-medium", insurancePast ? "text-destructive" : insuranceSoon ? "text-warning" : "text-foreground")}>
                            {formatDate(v.insurance_expiry)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {v.notes && <p className="text-xs text-muted-foreground mt-2 truncate">{v.notes}</p>}
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Create dialog */}
      <VehicleFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />

      {/* Edit dialog */}
      <VehicleFormDialog
        open={!!editVehicle}
        onClose={() => setEditVehicle(null)}
        onSubmit={handleUpdate}
        loading={update.isPending}
        initial={editVehicle}
      />

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(v) => !v && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {archiveTarget?.status === "archive" ? "Réactiver ce véhicule ?" : "Archiver ce véhicule ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {archiveTarget?.status === "archive"
                ? `${archiveTarget?.brand} ${archiveTarget?.model} (${archiveTarget?.plate}) sera de nouveau disponible.`
                : `${archiveTarget?.brand} ${archiveTarget?.model} (${archiveTarget?.plate}) ne sera plus proposé pour les séances. Vous pourrez le réactiver à tout moment.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              {archiveTarget?.status === "archive" ? "Réactiver" : "Archiver"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}