import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

interface ParsedRow {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  activity_type: string;
  hours_bought: number;
  valid: boolean;
  errors: string[];
}

const EXPECTED_COLS = ["Prénom", "Nom", "Téléphone", "Email", "Type d'activité", "Heures achetées"];

function parseCSV(text: string): string[][] {
  const sep = text.includes(";") ? ";" : ",";
  return text.trim().split("\n").map((line) => line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));
}

export default function Import() {
  const { organization } = useOrg();
  const { log } = useAuditLog();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("upload");
  const [rawData, setRawData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [result, setResult] = useState({ imported: 0, skipped: 0 });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { toast({ title: "Fichier vide ou invalide", variant: "destructive" }); return; }
      setHeaders(rows[0]);
      setRawData(rows.slice(1));
      const autoMap: Record<string, number> = {};
      EXPECTED_COLS.forEach((col) => {
        const idx = rows[0].findIndex((h) => h.toLowerCase().includes(col.toLowerCase().split(" ")[0].split("'")[0]));
        if (idx >= 0) autoMap[col] = idx;
      });
      setMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handlePreview = () => {
    const rows: ParsedRow[] = rawData.map((row) => {
      const firstName = row[mapping["Prénom"] ?? -1] || "";
      const lastName = row[mapping["Nom"] ?? -1] || "";
      const phone = row[mapping["Téléphone"] ?? -1] || "";
      const email = row[mapping["Email"] ?? -1] || "";
      const actType = row[mapping["Type d'activité"] ?? -1] || "auto_ecole";
      const hours = Number(row[mapping["Heures achetées"] ?? -1]) || 0;
      const errors: string[] = [];
      if (!firstName) errors.push("Prénom manquant");
      if (!lastName) errors.push("Nom manquant");
      return { first_name: firstName, last_name: lastName, phone, email, activity_type: actType, hours_bought: hours, valid: errors.length === 0, errors };
    });
    setParsed(rows);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!organization?.id) return;
    setStep("importing");
    let imported = 0;
    let skipped = 0;

    for (const row of parsed) {
      if (!row.valid) { skipped++; continue; }
      const { data: student, error } = await supabase
        .from("students")
        .insert({
          organization_id: organization.id,
          first_name: row.first_name,
          last_name: row.last_name,
          phone: row.phone,
          email: row.email,
          activity_type: row.activity_type,
        } as any)
        .select()
        .single();

      if (error) { skipped++; continue; }
      imported++;

      if (row.hours_bought > 0 && student) {
        await supabase.from("student_formulas").insert({
          organization_id: organization.id,
          student_id: student.id,
          offer_name: "Import initial",
          offer_type: "pack",
          hours_bought: row.hours_bought,
          total_price: 0,
        } as any);
      }
    }

    log({ action: "Import CSV", entity: "import", details: `${imported} élèves importés, ${skipped} ignorés` });
    qc.invalidateQueries({ queryKey: ["students"] });
    setResult({ imported, skipped });
    setStep("done");
  };

  const steps = [
    { key: "upload", label: "1. Fichier" },
    { key: "mapping", label: "2. Mapping" },
    { key: "preview", label: "3. Aperçu" },
    { key: "done", label: "4. Résultat" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto space-y-5">
      <div>
        <h1 className="page-title">Import initial</h1>
        <p className="page-subtitle">Importez vos élèves et données existantes par fichier CSV</p>
      </div>

      <div className="flex items-center gap-2 text-xs">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className={cn("px-2.5 py-1.5 rounded-md font-medium transition-colors", step === s.key || (step === "importing" && s.key === "done") ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground")}>{s.label}</span>
            {i < 3 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Sélectionnez un fichier CSV</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Importez votre liste d'élèves avec leurs coordonnées et soldes d'heures.
          </p>
          <div
            className="border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/40 transition-colors cursor-pointer"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Glissez-déposez ou <span className="text-primary font-medium">parcourir</span></p>
            <p className="text-[10px] text-muted-foreground mt-1">CSV uniquement · max 5 Mo</p>
          </div>
          <div className="mt-6 text-left">
            <p className="text-xs font-medium text-foreground mb-2">Colonnes attendues :</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPECTED_COLS.map((col) => (
                <span key={col} className="status-badge rounded-md bg-accent text-accent-foreground">{col}</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {step === "mapping" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Mapping des colonnes</h2>
          <p className="text-sm text-muted-foreground">Associez les colonnes de votre fichier</p>
          {EXPECTED_COLS.map((field) => (
            <div key={field} className="flex items-center gap-4">
              <span className="text-sm text-foreground w-36 font-medium">{field}</span>
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
              <select
                value={mapping[field] ?? ""}
                onChange={(e) => setMapping((m) => ({ ...m, [field]: Number(e.target.value) }))}
                className="flex-1 bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">— Non mappé —</option>
                {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
              {mapping[field] !== undefined && <CheckCircle2 className="w-4 h-4 text-success" />}
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep("upload")} className="btn-secondary">Retour</button>
            <button onClick={handlePreview} className="btn-primary">Aperçu</button>
          </div>
        </motion.div>
      )}

      {step === "preview" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-success" />
              <span className="text-sm font-medium text-foreground">{parsed.filter((r) => r.valid).length} lignes valides</span>
              {parsed.some((r) => !r.valid) && (<>
                <AlertTriangle className="w-5 h-5 text-warning ml-4" />
                <span className="text-sm font-medium text-foreground">{parsed.filter((r) => !r.valid).length} avertissement(s)</span>
              </>)}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr>
                    <th>Prénom</th>
                    <th>Nom</th>
                    <th>Tél</th>
                    <th>Heures</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 20).map((row, i) => (
                    <tr key={i} className={!row.valid ? "bg-warning/5" : ""}>
                      <td>{row.first_name || "—"}</td>
                      <td>{row.last_name || "—"}</td>
                      <td>{row.phone || "—"}</td>
                      <td>{row.hours_bought || "—"}</td>
                      <td>
                        {row.valid ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <AlertTriangle className="w-3.5 h-3.5 text-warning" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsed.length > 20 && <p className="text-xs text-muted-foreground mt-2">... et {parsed.length - 20} autres lignes</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep("mapping")} className="btn-secondary">Retour</button>
            <button onClick={handleImport} className="btn-primary">Importer {parsed.filter((r) => r.valid).length} élèves</button>
          </div>
        </motion.div>
      )}

      {step === "importing" && (
        <div className="glass-card rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Import en cours...</p>
        </div>
      )}

      {step === "done" && (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="glass-card rounded-xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-1">Import terminé</h2>
          <p className="text-sm text-muted-foreground mb-4">{result.imported} élèves importés · {result.skipped} ligne(s) ignorée(s)</p>
          <button onClick={() => { setStep("upload"); setRawData([]); setHeaders([]); setMapping({}); setParsed([]); }} className="btn-secondary">Nouvel import</button>
        </motion.div>
      )}
    </div>
  );
}