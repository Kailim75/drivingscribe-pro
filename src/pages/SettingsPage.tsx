import { motion } from "framer-motion";
import { Settings, Building2, Receipt, FileText, Users, Shield, Palette } from "lucide-react";
import { organization } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Tab = "organisation" | "facturation" | "utilisateurs" | "roles";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("organisation");

  const tabs = [
    { key: "organisation" as Tab, label: "Organisation", icon: Building2 },
    { key: "facturation" as Tab, label: "Facturation", icon: Receipt },
    { key: "utilisateurs" as Tab, label: "Utilisateurs", icon: Users },
    { key: "roles" as Tab, label: "Rôles", icon: Shield },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Configuration de votre organisation</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-0.5 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
              tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "organisation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Identité</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom" value={organization.name} />
            <Field label="Email" value={organization.email} />
            <Field label="Téléphone" value={organization.phone} />
            <Field label="SIRET" value={organization.siret} />
            <Field label="Adresse" value={organization.address} className="sm:col-span-2" />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Mode de fonctionnement</h3>
            <div className="flex gap-3">
              {["independant", "centre"].map((mode) => (
                <div
                  key={mode}
                  className={cn(
                    "flex-1 p-4 rounded-xl border-2 cursor-pointer transition-colors text-center",
                    organization.mode === mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  )}
                >
                  <p className="text-sm font-semibold text-foreground capitalize">{mode === "independant" ? "Indépendant" : "Centre"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {mode === "independant" ? "Un seul utilisateur" : "Multi-formateurs et rôles"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === "facturation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Facturation</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="N° TVA" value={organization.tvaNumber} />
            <Field label="Taux TVA" value={`${organization.tvaRate}%`} />
            <Field label="Préfixe facture" value={organization.invoicePrefix} />
            <Field label="Préfixe devis" value={organization.quotePrefix} />
            <Field label="Devise" value="EUR (€)" />
            <Field label="Fuseau horaire" value="Europe/Paris" />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Politique d'annulation par défaut</h3>
            <p className="text-xs text-muted-foreground">Toute séance annulée est par défaut totalement facturée. Ce comportement peut être modifié manuellement lors de l'annulation.</p>
          </div>
        </motion.div>
      )}

      {tab === "utilisateurs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Utilisateurs</h2>
          <p className="text-sm text-muted-foreground">La gestion des utilisateurs sera disponible avec l'activation de Lovable Cloud (authentification et rôles).</p>
          <div className="space-y-2">
            {[
              { name: "Admin", email: "admin@ae-centrale.fr", role: "Owner" },
              { name: "Jean-Marc Duval", email: "jm.duval@ae-centrale.fr", role: "Formateur" },
              { name: "Fatima Benali", email: "f.benali@ae-centrale.fr", role: "Formateur" },
              { name: "Pierre Moreau", email: "p.moreau@ae-centrale.fr", role: "Formateur" },
            ].map((u) => (
              <div key={u.email} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">{u.name[0]}</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{u.role}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "roles" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Rôles et permissions</h2>
          <div className="space-y-3">
            {[
              { role: "Owner", desc: "Accès total — propriétaire de l'organisation", perms: ["Tout"] },
              { role: "Admin", desc: "Gestion complète opérationnelle et financière", perms: ["Élèves", "Formateurs", "Véhicules", "Planning", "Facturation", "Paiements", "Dépenses", "Rentabilité", "Paramètres"] },
              { role: "Formateur", desc: "Accès limité à ses propres données", perms: ["Ses séances", "Ses élèves", "Son planning", "Ses statistiques", "Notes"] },
              { role: "Comptable", desc: "Accès financier uniquement", perms: ["Factures", "Paiements", "Dépenses", "Reporting financier"] },
            ].map((r) => (
              <div key={r.role} className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">{r.role}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{r.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {r.perms.map((p) => (
                    <span key={p} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      <input type="text" defaultValue={value} className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
    </div>
  );
}
