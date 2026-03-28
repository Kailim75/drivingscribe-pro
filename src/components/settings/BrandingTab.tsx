import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, RotateCcw, Eye, Palette, FileText, Building2, Save, Loader2, X, LayoutTemplate } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type DocumentTemplate = "moderne" | "classique" | "minimaliste";

interface BrandingForm {
  logo_url: string;
  document_logo_url: string;
  primary_color: string;
  accent_color: string;
  website: string;
  footer_text: string;
  document_header: string;
  legal_mentions: string;
  signature_enabled: boolean;
  signature_text: string;
  document_template: DocumentTemplate;
}

const DEFAULTS: BrandingForm = {
  logo_url: "",
  document_logo_url: "",
  primary_color: "#1e40af",
  accent_color: "#f59e0b",
  website: "",
  footer_text: "",
  document_header: "",
  legal_mentions: "",
  signature_enabled: false,
  signature_text: "",
  document_template: "moderne",
};

const TEMPLATES: { key: DocumentTemplate; label: string; desc: string }[] = [
  { key: "moderne", label: "Moderne", desc: "Couleurs vives, en-têtes colorés, style contemporain" },
  { key: "classique", label: "Classique", desc: "Mise en page traditionnelle, sobre et professionnelle" },
  { key: "minimaliste", label: "Minimaliste", desc: "Épuré, peu de couleurs, focus sur le contenu" },
];

export default function BrandingTab() {
  const { organization, refreshOrg, isOwnerOrAdmin } = useOrg();
  const [form, setForm] = useState<BrandingForm>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingDocLogo, setUploadingDocLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const docLogoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (organization) {
      const org = organization as any;
      setForm({
        logo_url: org.logo_url || "",
        document_logo_url: org.document_logo_url || "",
        primary_color: org.primary_color || DEFAULTS.primary_color,
        accent_color: org.accent_color || DEFAULTS.accent_color,
        website: org.website || "",
        footer_text: org.footer_text || "",
        document_header: org.document_header || "",
        legal_mentions: org.legal_mentions || "",
        signature_enabled: org.signature_enabled || false,
        signature_text: org.signature_text || "",
        document_template: org.document_template || "moderne",
      });
    }
  }, [organization]);

  const uploadLogo = async (file: File, field: "logo_url" | "document_logo_url") => {
    if (!organization) return;
    const setter = field === "logo_url" ? setUploadingLogo : setUploadingDocLogo;
    setter(true);
    const ext = file.name.split(".").pop();
    const path = `${organization.id}/${field === "logo_url" ? "logo" : "doc-logo"}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) { toast.error("Erreur lors de l'upload"); setter(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
    setForm((f) => ({ ...f, [field]: publicUrl }));
    setter(false);
    toast.success("Logo uploadé");
  };

  const handleSave = async () => {
    if (!organization || !isOwnerOrAdmin) return;
    setSaving(true);
    const { error } = await supabase.from("organizations").update({
      logo_url: form.logo_url || null,
      document_logo_url: form.document_logo_url || null,
      primary_color: form.primary_color,
      accent_color: form.accent_color,
      website: form.website || null,
      footer_text: form.footer_text,
      document_header: form.document_header,
      legal_mentions: form.legal_mentions,
      signature_enabled: form.signature_enabled,
      signature_text: form.signature_text,
      document_template: form.document_template,
    } as any).eq("id", organization.id);
    if (error) { toast.error("Erreur lors de la sauvegarde"); }
    else { toast.success("Personnalisation enregistrée"); await refreshOrg(); }
    setSaving(false);
  };

  const handleReset = () => {
    setForm(DEFAULTS);
    toast.info("Valeurs par défaut restaurées — enregistrez pour appliquer");
  };

  if (!organization) return null;

  return (
    <div className="space-y-5">
      {/* Save bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!isOwnerOrAdmin}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Réinitialiser
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="w-3.5 h-3.5 mr-1" /> {showPreview ? "Masquer l'aperçu" : "Aperçu"}
          </Button>
        </div>
        {isOwnerOrAdmin && (
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />} Enregistrer
          </Button>
        )}
      </div>

      {/* Block 1: Identité visuelle */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Identité visuelle</h2>
        </div>
        <p className="text-xs text-muted-foreground">Logo et couleurs appliqués au CRM et aux documents.</p>

        {/* Logos */}
        <div className="grid sm:grid-cols-2 gap-4">
          <LogoUpload
            label="Logo principal (CRM)"
            sublabel="Affiché dans la sidebar et l'en-tête"
            url={form.logo_url}
            uploading={uploadingLogo}
            inputRef={logoRef}
            onUpload={(f) => uploadLogo(f, "logo_url")}
            onClear={() => setForm((f) => ({ ...f, logo_url: "" }))}
            disabled={!isOwnerOrAdmin}
          />
          <LogoUpload
            label="Logo documents (PDF)"
            sublabel="Utilisé dans les factures, devis, etc."
            url={form.document_logo_url}
            uploading={uploadingDocLogo}
            inputRef={docLogoRef}
            onUpload={(f) => uploadLogo(f, "document_logo_url")}
            onClear={() => setForm((f) => ({ ...f, document_logo_url: "" }))}
            disabled={!isOwnerOrAdmin}
          />
        </div>

        {/* Colors */}
        <div className="grid sm:grid-cols-2 gap-4">
          <ColorPicker
            label="Couleur principale"
            value={form.primary_color}
            onChange={(v) => setForm((f) => ({ ...f, primary_color: v }))}
            disabled={!isOwnerOrAdmin}
          />
          <ColorPicker
            label="Couleur d'accent"
            value={form.accent_color}
            onChange={(v) => setForm((f) => ({ ...f, accent_color: v }))}
            disabled={!isOwnerOrAdmin}
          />
        </div>
      </motion.div>

      {/* Block 2: Apparence CRM */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Apparence du CRM</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Le logo principal s'affiche dans la sidebar. La couleur principale est utilisée comme accent dans l'interface.
        </p>
        {/* CRM Preview */}
        <div className="p-4 rounded-xl border border-border bg-accent/30">
          <p className="text-xs font-medium text-muted-foreground mb-3">Aperçu sidebar</p>
          <div className="flex items-center gap-2.5 p-3 rounded-lg border border-border bg-card">
            {form.logo_url ? (
              <img src={form.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: form.primary_color + "20" }}>
                <span className="font-bold text-sm" style={{ color: form.primary_color }}>
                  {(organization.name || "D").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <span className="font-semibold text-sm text-foreground">{organization.name}</span>
              <span className="text-[10px] text-muted-foreground block capitalize">{organization.mode}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-2 rounded-full flex-1" style={{ backgroundColor: form.primary_color }} />
            <div className="h-2 rounded-full w-12" style={{ backgroundColor: form.accent_color }} />
          </div>
        </div>
      </motion.div>

      {/* Block 2.5: Template selector */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Style de document</h2>
        </div>
        <p className="text-xs text-muted-foreground">Choisissez le modèle de mise en page pour vos factures, devis et autres documents PDF.</p>
        <div className="grid grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => isOwnerOrAdmin && setForm((f) => ({ ...f, document_template: t.key }))}
              className={cn(
                "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                form.document_template === t.key
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30",
                !isOwnerOrAdmin && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Mini preview */}
              <TemplateMiniPreview template={t.key} color={form.primary_color} />
              <p className="text-sm font-semibold text-foreground mt-3">{t.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t.desc}</p>
              {form.document_template === t.key && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground">Paramètres des documents</h2>
        </div>
        <p className="text-xs text-muted-foreground">Configuration de l'en-tête, du pied de page et des mentions légales pour les PDF générés.</p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Site web</label>
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="https://www.votresite.fr" disabled={!isOwnerOrAdmin} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">En-tête de document</label>
            <Input value={form.document_header} onChange={(e) => setForm((f) => ({ ...f, document_header: e.target.value }))} placeholder="Ex: École de conduite agréée — N° d'agrément 123" disabled={!isOwnerOrAdmin} />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pied de page</label>
            <textarea value={form.footer_text} onChange={(e) => setForm((f) => ({ ...f, footer_text: e.target.value }))} placeholder="Texte libre affiché en bas de chaque document" disabled={!isOwnerOrAdmin} className="w-full bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-16 resize-none disabled:opacity-50" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mentions légales</label>
            <textarea value={form.legal_mentions} onChange={(e) => setForm((f) => ({ ...f, legal_mentions: e.target.value }))} placeholder="Mentions légales obligatoires (conditions de paiement, pénalités de retard, etc.)" disabled={!isOwnerOrAdmin} className="w-full bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none disabled:opacity-50" />
          </div>

          {/* Signature */}
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Bloc signature</p>
                <p className="text-xs text-muted-foreground">Ajouter un espace signature en bas des documents</p>
              </div>
              <Switch checked={form.signature_enabled} onCheckedChange={(v) => setForm((f) => ({ ...f, signature_enabled: v }))} disabled={!isOwnerOrAdmin} />
            </div>
            {form.signature_enabled && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Texte de signature</label>
                <Input value={form.signature_text} onChange={(e) => setForm((f) => ({ ...f, signature_text: e.target.value }))} placeholder="Ex: Le directeur, M. Jean Dupont" disabled={!isOwnerOrAdmin} />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Block 4: Document Preview */}
      {showPreview && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">Aperçu document</h2>
            </div>
            <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded">Prévisualisation</span>
          </div>
          <DocumentPreview form={form} org={organization} />
        </motion.div>
      )}
    </div>
  );
}

/* ---------- Sub-components ---------- */

function LogoUpload({
  label, sublabel, url, uploading, inputRef, onUpload, onClear, disabled
}: {
  label: string; sublabel: string; url: string; uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>; onUpload: (f: File) => void;
  onClear: () => void; disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <p className="text-[10px] text-muted-foreground/70">{sublabel}</p>
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/40 transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : url ? (
            <img src={url} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <Upload className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        {url && !disabled && (
          <button onClick={onClear} className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1">
            <X className="w-3 h-3" /> Retirer
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { if (f.size > 2 * 1024 * 1024) { toast.error("Max 2 Mo"); return; } onUpload(f); }
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ColorPicker({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ padding: 0 }}
          />
        </div>
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-28 font-mono text-xs"
          maxLength={7}
        />
      </div>
    </div>
  );
}

function TemplateMiniPreview({ template, color }: { template: DocumentTemplate; color: string }) {
  if (template === "classique") {
    return (
      <div className="h-16 rounded border border-border bg-white p-1.5 space-y-1">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm border border-gray-300" />
          <div className="h-1.5 bg-gray-300 rounded flex-1" />
        </div>
        <div className="h-px bg-gray-300" />
        <div className="space-y-0.5">
          <div className="h-1 bg-gray-200 rounded w-full" />
          <div className="h-1 bg-gray-200 rounded w-4/5" />
          <div className="h-1 bg-gray-200 rounded w-3/5" />
        </div>
        <div className="flex justify-end"><div className="h-1.5 w-8 rounded" style={{ backgroundColor: color }} /></div>
      </div>
    );
  }
  if (template === "minimaliste") {
    return (
      <div className="h-16 rounded border border-border bg-white p-1.5 space-y-1.5">
        <div className="h-1.5 bg-gray-200 rounded w-1/3" />
        <div className="space-y-0.5 mt-2">
          <div className="h-0.5 bg-gray-100 rounded w-full" />
          <div className="h-0.5 bg-gray-100 rounded w-full" />
          <div className="h-0.5 bg-gray-100 rounded w-4/5" />
        </div>
        <div className="flex justify-end"><div className="h-1.5 w-8 rounded bg-gray-800" /></div>
      </div>
    );
  }
  // Moderne (default)
  return (
    <div className="h-16 rounded border border-border bg-white p-1.5 space-y-1">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color + "20" }} />
        <div className="h-1.5 rounded flex-1" style={{ backgroundColor: color }} />
      </div>
      <div className="space-y-0.5">
        <div className="h-1 rounded w-full" style={{ backgroundColor: color + "15" }} />
        <div className="h-1 bg-gray-100 rounded w-4/5" />
        <div className="h-1 bg-gray-100 rounded w-3/5" />
      </div>
      <div className="flex justify-end"><div className="h-1.5 w-8 rounded" style={{ backgroundColor: color }} /></div>
    </div>
  );
}

function DocumentPreview({ form, org }: { form: BrandingForm; org: any }) {
  const isFranchisePreview = (org.tva_regime || "assujetti") === "franchise_en_base";
  const logoUrl = form.document_logo_url || form.logo_url;
  const t = form.document_template;
  const isMinimal = t === "minimaliste";
  const isClassic = t === "classique";

  const headerBorderStyle = isMinimal
    ? { borderColor: "#e5e7eb" }
    : { borderColor: form.primary_color + "30" };

  const titleColor = isMinimal ? "#111" : form.primary_color;
  const tableHeaderBg = isMinimal ? "#333" : isClassic ? "#555" : form.primary_color;
  const totalBg = isMinimal ? "#333" : form.primary_color;

  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-6 max-w-md mx-auto text-black" style={{ minHeight: 360, fontSize: 10 }}>
      {/* Header */}
      <div className={cn("flex items-start justify-between mb-4 pb-3 border-b", isMinimal && "border-gray-200")} style={!isMinimal ? headerBorderStyle : undefined}>
        <div className={cn("flex items-center gap-3", isMinimal && "flex-col items-start gap-1")}>
          {!isMinimal && logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
          ) : !isMinimal ? (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: (isClassic ? "#eee" : form.primary_color + "15") }}>
              <span className="font-bold text-sm" style={{ color: isClassic ? "#333" : form.primary_color }}>{(org.name || "D").slice(0, 2).toUpperCase()}</span>
            </div>
          ) : null}
          <div>
            <p className={cn("font-bold", isMinimal ? "text-sm text-gray-800" : "text-sm")} style={!isMinimal ? { color: titleColor } : undefined}>{org.name}</p>
            {form.document_header && <p className="text-[8px] text-gray-500">{form.document_header}</p>}
          </div>
        </div>
        <div className="text-right text-[8px] text-gray-500">
          {org.address && <p>{org.address}</p>}
          {org.phone && <p>{org.phone}</p>}
          {org.email && <p>{org.email}</p>}
          {form.website && <p>{form.website}</p>}
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <p className={cn("font-bold", isMinimal ? "text-sm" : "text-base")} style={{ color: titleColor }}>FACTURE F-2025-001</p>
        <p className="text-[8px] text-gray-500">Date : 28/03/2026 — Échéance : 27/04/2026</p>
      </div>

      {/* Table */}
      <div className="mb-4">
        <div className={cn("flex py-1.5 px-2 text-white text-[8px] font-bold", isMinimal ? "rounded-none" : "rounded")} style={{ backgroundColor: tableHeaderBg }}>
          <span className="flex-1">Description</span>
          <span className="w-12 text-right">Qté</span>
          <span className="w-16 text-right">P.U. HT</span>
          <span className="w-16 text-right">Total HT</span>
        </div>
        {[
          { desc: "Leçon de conduite (1h)", qty: 5, pu: 45, total: 225 },
          { desc: "Forfait code", qty: 1, pu: 300, total: 300 },
        ].map((l, i) => (
          <div key={i} className={cn("flex py-1.5 px-2 text-[8px]", !isMinimal && i % 2 === 0 && "bg-gray-50", isMinimal && "border-b border-gray-100")}>
            <span className="flex-1">{l.desc}</span>
            <span className="w-12 text-right">{l.qty}</span>
            <span className="w-16 text-right">{l.pu.toFixed(2)} €</span>
            <span className="w-16 text-right">{l.total.toFixed(2)} €</span>
          </div>
        ))}
        <div className="flex justify-end mt-2 text-[9px]">
          <div className="space-y-0.5 text-right">
            {isFranchisePreview ? (
              <>
                <div className="px-3 py-1 rounded text-white font-bold mt-1" style={{ backgroundColor: totalBg }}>
                  Total : 525,00 €
                </div>
                <p className="text-[7px] text-gray-500 mt-1 italic">TVA non applicable, art. 293 B du CGI</p>
              </>
            ) : (
              <>
                <p>Total HT : <b>525,00 €</b></p>
                <p>TVA (20%) : <b>105,00 €</b></p>
                <div className="px-3 py-1 rounded text-white font-bold mt-1" style={{ backgroundColor: totalBg }}>
                  Total TTC : 630,00 €
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Signature */}
      {form.signature_enabled && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-[8px] text-gray-500 mb-4">{form.signature_text || "Signature"}</p>
          <div className="w-32 border-b border-gray-300" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 pt-2 border-t text-center text-[7px] text-gray-400" style={{ borderColor: isMinimal ? "#e5e7eb" : form.primary_color + "20" }}>
        {form.footer_text && <p className="mb-0.5">{form.footer_text}</p>}
        {form.legal_mentions && <p className="mb-0.5">{form.legal_mentions}</p>}
        <p>{org.name} — {org.siret || ""} — {org.tva_number || ""}</p>
      </div>
    </div>
  );
}
