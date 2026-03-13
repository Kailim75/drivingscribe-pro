import { motion } from "framer-motion";
import { Plus, Package, Loader2, ToggleLeft, ToggleRight, MoreVertical, Pencil, Archive, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useOffers } from "@/hooks/useOffers";
import { useAuditLog } from "@/hooks/useAuditLog";
import { offerTypeLabels, offerTypeColors, activityTypeLabels, formatEur } from "@/lib/labels";
import OfferFormDialog from "@/components/offers/OfferFormDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Offers() {
  const { offers, isLoading, create, update, archive } = useOffers();
  const { log } = useAuditLog();
  const [showForm, setShowForm] = useState(false);
  const [editOffer, setEditOffer] = useState<any>(null);
  const [archiveOffer, setArchiveOffer] = useState<any>(null);
  const [showInactive, setShowInactive] = useState(false);

  const filtered = showInactive ? offers : offers.filter((o) => o.active);

  const handleCreate = (data: any) => {
    create.mutate(data, {
      onSuccess: () => {
        setShowForm(false);
        log({ action: "create", entity: "offer", details: data.name });
      },
    });
  };

  const handleEdit = (data: any) => {
    if (!editOffer) return;
    update.mutate({ id: editOffer.id, ...data }, {
      onSuccess: () => {
        setEditOffer(null);
        log({ action: "update", entity: "offer", entity_id: editOffer.id, details: data.name });
      },
    });
  };

  const handleArchive = () => {
    if (!archiveOffer) return;
    archive.mutate(archiveOffer.id, {
      onSuccess: () => {
        log({ action: "archive", entity: "offer", entity_id: archiveOffer.id, details: archiveOffer.name });
        setArchiveOffer(null);
      },
    });
  };

  const toggleActive = (offer: any) => {
    update.mutate({ id: offer.id, active: !offer.active });
  };

  const handleDuplicate = (offer: any) => {
    create.mutate({
      name: `${offer.name} (copie)`,
      type: offer.type,
      price: Number(offer.price),
      hours: offer.hours,
      tva_rate: Number(offer.tva_rate),
      deposit_percent: Number(offer.deposit_percent),
      cancellation_policy: offer.cancellation_policy,
      activity_type: offer.activity_type,
      active: true,
    }, {
      onSuccess: () => log({ action: "create", entity: "offer", details: `Duplication de ${offer.name}` }),
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Catalogue d'offres</h1>
          <p className="page-subtitle">{offers.filter((o) => o.active).length} offre{offers.filter((o) => o.active).length > 1 ? "s" : ""} active{offers.filter((o) => o.active).length > 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInactive(!showInactive)} className="btn-secondary text-xs !py-2">
            {showInactive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
            Inactives
          </button>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nouvelle offre
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {filtered.length === 0 ? (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <Package className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Aucune offre</p>
            <p className="text-xs text-muted-foreground mt-1">Créez votre première offre commerciale</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((offer) => (
              <div key={offer.id} className={cn("glass-card rounded-xl p-4 transition-all duration-200", offer.active ? "hover:border-primary/20 hover:shadow-sm" : "opacity-60")}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{offer.name}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={cn("status-badge rounded-md", offerTypeColors[offer.type])}>
                        {offerTypeLabels[offer.type]}
                      </span>
                      <span className="text-xs text-muted-foreground">{activityTypeLabels[offer.activity_type] || offer.activity_type}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditOffer(offer)}>
                        <Pencil className="w-4 h-4 mr-2" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(offer)}>
                        <Copy className="w-4 h-4 mr-2" /> Dupliquer
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toggleActive(offer)}>
                        {offer.active ? <ToggleLeft className="w-4 h-4 mr-2" /> : <ToggleRight className="w-4 h-4 mr-2" />}
                        {offer.active ? "Désactiver" : "Activer"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setArchiveOffer(offer)} className="text-warning focus:text-warning">
                        <Archive className="w-4 h-4 mr-2" /> Désactiver
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 pt-3 border-t border-border/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-foreground">{formatEur(Number(offer.price))}</span>
                    {offer.hours && offer.type !== "heure" && (
                      <span className="text-sm text-muted-foreground">{offer.hours}h incluses</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>TVA {offer.tva_rate}%</span>
                    {Number(offer.deposit_percent) > 0 && <span>Acompte {offer.deposit_percent}%</span>}
                  </div>
                </div>
                {offer.cancellation_policy && (
                  <p className="text-[10px] text-muted-foreground mt-2 italic">{offer.cancellation_policy}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <OfferFormDialog open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} loading={create.isPending} />
      <OfferFormDialog open={!!editOffer} onClose={() => setEditOffer(null)} onSubmit={handleEdit} loading={update.isPending} initial={editOffer} />

      <AlertDialog open={!!archiveOffer} onOpenChange={(v) => !v && setArchiveOffer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver l'offre</AlertDialogTitle>
            <AlertDialogDescription>
              « {archiveOffer?.name} » sera désactivée et ne sera plus proposée. Vous pourrez la réactiver à tout moment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}