import { motion } from "framer-motion";
import { Plus, Package, Clock, Layers } from "lucide-react";
import { offers, formatEur, type OfferType } from "@/data/mockData";
import { cn } from "@/lib/utils";

const typeConfig: Record<OfferType, { label: string; color: string; icon: React.ElementType }> = {
  heure: { label: "À l'heure", color: "bg-info/10 text-info", icon: Clock },
  pack: { label: "Pack", color: "bg-primary/10 text-primary", icon: Package },
  forfait: { label: "Forfait", color: "bg-success/10 text-success", icon: Layers },
};

export default function Offers() {
  const active = offers.filter((o) => o.active);
  const inactive = offers.filter((o) => !o.active);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Catalogue d'offres</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{active.length} offre{active.length > 1 ? "s" : ""} active{active.length > 1 ? "s" : ""}</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Nouvelle offre
        </button>
      </div>

      {/* Active offers */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {active.map((offer) => {
          const cfg = typeConfig[offer.type];
          const Icon = cfg.icon;
          return (
            <div key={offer.id} className="glass-card rounded-xl p-5 hover:border-primary/20 transition-colors cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1", cfg.color)}>
                  <Icon className="w-3 h-3" />{cfg.label}
                </span>
                <span className="text-[10px] capitalize text-muted-foreground">{offer.activityType}</span>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{offer.name}</h3>
              <p className="text-2xl font-bold text-foreground mb-3">{formatEur(offer.price)}</p>
              <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                {offer.hours && <p>{offer.hours} heure{offer.hours > 1 ? "s" : ""} incluse{offer.hours > 1 ? "s" : ""}</p>}
                <p>TVA {offer.tvaRate}%</p>
                {offer.depositPercent > 0 && <p>Acompte {offer.depositPercent}%</p>}
                <p className="text-[10px]">{offer.cancellationPolicy}</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">Offres inactives</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {inactive.map((offer) => (
              <div key={offer.id} className="glass-card rounded-xl p-5 opacity-50 cursor-pointer hover:opacity-70 transition-opacity">
                <h3 className="font-semibold text-foreground mb-1">{offer.name}</h3>
                <p className="text-lg font-bold text-muted-foreground">{formatEur(offer.price)}</p>
                <p className="text-xs text-muted-foreground mt-2">Inactive</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
