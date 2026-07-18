// French labels & colors for DB enum values — premium forest green palette

export const studentStatusLabels: Record<string, string> = {
  actif: "Actif", en_pause: "En pause", termine: "Terminé", archive: "Archivé",
};
export const studentStatusColors: Record<string, string> = {
  actif: "bg-success/10 text-success", en_pause: "bg-warning/10 text-warning",
  termine: "bg-muted text-muted-foreground", archive: "bg-muted text-muted-foreground",
};

export const instructorStatusLabels: Record<string, string> = {
  actif: "Actif", inactif: "Inactif", archive: "Archivé",
};
export const instructorStatusColors: Record<string, string> = {
  actif: "bg-success/10 text-success", inactif: "bg-warning/10 text-warning", archive: "bg-muted text-muted-foreground",
};

export const vehicleStatusLabels: Record<string, string> = {
  actif: "Actif", indisponible: "Indisponible", maintenance: "Maintenance", archive: "Archivé",
};
export const vehicleStatusColors: Record<string, string> = {
  actif: "bg-success/10 text-success", indisponible: "bg-warning/10 text-warning",
  maintenance: "bg-info/10 text-info", archive: "bg-muted text-muted-foreground",
};

export const lessonStatusLabels: Record<string, string> = {
  prevu: "Prévu", effectue: "Effectué", annule: "Annulé", absent: "Absent",
};
export const lessonStatusColors: Record<string, string> = {
  prevu: "bg-info/10 text-info", effectue: "bg-success/10 text-success",
  annule: "bg-destructive/10 text-destructive", absent: "bg-warning/10 text-warning",
};

export const billingRuleLabels: Record<string, string> = {
  totale: "Totale", partielle: "Partielle", non_facturee: "Non facturée",
};

export const offerTypeLabels: Record<string, string> = {
  heure: "À l'heure", pack: "Pack", forfait: "Forfait",
};
export const offerTypeColors: Record<string, string> = {
  heure: "bg-info/10 text-info", pack: "bg-primary/10 text-primary", forfait: "bg-success/10 text-success",
};

export const activityTypeLabels: Record<string, string> = {
  auto_ecole: "Auto-école", taxi: "Taxi", vtc: "VTC", vmdtr: "VMDTR",
};
export const activityTypeColors: Record<string, string> = {
  auto_ecole: "bg-primary/10 text-primary", taxi: "bg-info/10 text-info",
  vtc: "bg-success/10 text-success", vmdtr: "bg-warning/10 text-warning",
};

export const formatEur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

// Le statut « en_retard » n'est jamais posé automatiquement en base :
// le retard se calcule toujours dynamiquement depuis l'échéance et le reste dû.
export interface OverdueCheckable {
  type: string;
  status: string;
  due_date: string;
  remaining_amount: number;
}

export const isInvoiceOverdue = (
  inv: OverdueCheckable,
  today: string = new Date().toISOString().split("T")[0]
): boolean =>
  inv.type === "facture" &&
  Number(inv.remaining_amount) > 0 &&
  !["brouillon", "payé", "annulé", "archivé"].includes(inv.status) &&
  (inv.due_date < today || inv.status === "en_retard");

export const invoiceDisplayStatus = (inv: OverdueCheckable): string =>
  isInvoiceOverdue(inv) ? "en_retard" : inv.status;
