import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { useState } from "react";

type Step = "upload" | "mapping" | "preview" | "done";

export default function Import() {
  const [step, setStep] = useState<Step>("upload");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Import initial</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Importez vos élèves et données existantes par fichier CSV</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { key: "upload", label: "1. Fichier" },
          { key: "mapping", label: "2. Mapping" },
          { key: "preview", label: "3. Aperçu" },
          { key: "done", label: "4. Résultat" },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full font-medium ${step === s.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
              {s.label}
            </span>
            {i < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Sélectionnez un fichier CSV</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Importez votre liste d'élèves avec leurs coordonnées et soldes d'heures. Le fichier doit être au format CSV avec séparateur point-virgule ou virgule.
          </p>
          <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/40 transition-colors cursor-pointer">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Glissez-déposez ou <span className="text-primary font-medium">parcourir</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">CSV uniquement · max 5 Mo</p>
          </div>
          <div className="mt-6 text-left">
            <p className="text-xs font-medium text-foreground mb-2">Colonnes attendues :</p>
            <div className="flex flex-wrap gap-1.5">
              {["Prénom", "Nom", "Téléphone", "Email", "Type d'activité", "Heures achetées", "Heures réalisées"].map((col) => (
                <span key={col} className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">{col}</span>
              ))}
            </div>
          </div>
          <button onClick={() => setStep("mapping")} className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
            Simuler un import <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {step === "mapping" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Mapping des colonnes</h2>
          <p className="text-sm text-muted-foreground">Associez les colonnes de votre fichier aux champs DriveSync</p>
          {["Prénom", "Nom", "Téléphone", "Email", "Type d'activité", "Heures achetées"].map((field) => (
            <div key={field} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-36">{field}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <select className="flex-1 bg-secondary text-secondary-foreground text-sm px-3 py-2 rounded-lg border border-border">
                <option>{field.toLowerCase().replace(/ /g, "_")}</option>
              </select>
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep("upload")} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">Retour</button>
            <button onClick={() => setStep("preview")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Aperçu</button>
          </div>
        </motion.div>
      )}

      {step === "preview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-foreground">3 lignes valides</span>
              <AlertTriangle className="w-5 h-5 text-warning ml-4" />
              <span className="text-sm font-medium text-foreground">1 avertissement</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="px-3 py-2 text-xs text-muted-foreground">Prénom</th>
                    <th className="px-3 py-2 text-xs text-muted-foreground">Nom</th>
                    <th className="px-3 py-2 text-xs text-muted-foreground">Tél</th>
                    <th className="px-3 py-2 text-xs text-muted-foreground">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50"><td className="px-3 py-2">Claire</td><td className="px-3 py-2">Durand</td><td className="px-3 py-2">06 11 22 33 44</td><td className="px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /></td></tr>
                  <tr className="border-b border-border/50"><td className="px-3 py-2">Marc</td><td className="px-3 py-2">Legrand</td><td className="px-3 py-2">06 22 33 44 55</td><td className="px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /></td></tr>
                  <tr className="border-b border-border/50 bg-warning/5"><td className="px-3 py-2">Ali</td><td className="px-3 py-2">—</td><td className="px-3 py-2">—</td><td className="px-3 py-2"><AlertTriangle className="w-3.5 h-3.5 text-warning" /></td></tr>
                  <tr><td className="px-3 py-2">Nadia</td><td className="px-3 py-2">Bouzid</td><td className="px-3 py-2">06 44 55 66 77</td><td className="px-3 py-2"><CheckCircle2 className="w-3.5 h-3.5 text-success" /></td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("mapping")} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">Retour</button>
            <button onClick={() => setStep("done")} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">Importer</button>
          </div>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Import terminé</h2>
          <p className="text-sm text-muted-foreground mb-4">3 élèves importés · 1 ligne ignorée</p>
          <button onClick={() => setStep("upload")} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium">Nouvel import</button>
        </motion.div>
      )}
    </div>
  );
}
