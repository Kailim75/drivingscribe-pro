import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Building2, Receipt, Users, Shield, Save, Loader2, Bell, Target, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import { useSkillCategories } from "@/hooks/useSkills";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Tab = "organisation" | "facturation" | "utilisateurs" | "roles" | "notifications" | "competences";
type Organization = Database["public"]["Tables"]["organizations"]["Row"];

export default function SettingsPage() {
  const { organization, userRoles, refreshOrg, isOwnerOrAdmin } = useOrg();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("organisation");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Organization>>({});
  const [members, setMembers] = useState<any[]>([]);
  const [activityTypes, setActivityTypes] = useState<any[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const { settings: notifSettings, upsert: upsertNotif } = useNotificationSettings();
  const { categories: skillCategories, create: createSkill, remove: removeSkill, reorder: reorderSkills } = useSkillCategories();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = skillCategories.findIndex((c) => c.id === active.id);
    const newIndex = skillCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(skillCategories, oldIndex, newIndex);
    reorderSkills.mutate(reordered.map((c, i) => ({ id: c.id, sort_order: i + 1 })));
  };

  useEffect(() => {
    if (organization) {
      setForm(organization);
      fetchMembers();
      fetchActivityTypes();
    }
  }, [organization]);

  const fetchMembers = async () => {
    if (!organization) return;
    const { data: membersData } = await supabase
      .from("organization_members")
      .select("user_id, created_at")
      .eq("organization_id", organization.id);

    if (membersData) {
      const enriched = await Promise.all(
        membersData.map(async (m) => {
          const [profileRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("first_name, last_name").eq("user_id", m.user_id).single(),
            supabase.from("user_roles").select("role").eq("user_id", m.user_id).eq("organization_id", organization!.id),
          ]);
          return {
            ...m,
            profile: profileRes.data,
            roles: (rolesRes.data || []).map((r) => r.role),
          };
        })
      );
      setMembers(enriched);
    }
  };

  const fetchActivityTypes = async () => {
    if (!organization) return;
    const { data } = await supabase
      .from("activity_types")
      .select("*")
      .eq("organization_id", organization.id)
      .order("name");
    if (data) setActivityTypes(data);
  };

  const handleSave = async () => {
    if (!organization || !isOwnerOrAdmin) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        siret: form.siret,
        tva_number: form.tva_number,
        tva_rate: form.tva_rate,
        invoice_prefix: form.invoice_prefix,
        quote_prefix: form.quote_prefix,
        mode: form.mode,
        cancellation_policy: form.cancellation_policy,
        webhook_url: form.webhook_url || null,
      } as any)
      .eq("id", organization.id);

    if (error) {
      toast.error("Erreur lors de la sauvegarde");
    } else {
      toast.success("Paramètres enregistrés");
      await refreshOrg();
    }
    setSaving(false);
  };

  const update = (field: keyof Organization, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const tabs = [
    { key: "organisation" as Tab, label: "Organisation", icon: Building2 },
    { key: "facturation" as Tab, label: "Facturation", icon: Receipt },
    { key: "competences" as Tab, label: "Compétences", icon: Target },
    { key: "notifications" as Tab, label: "Notifications", icon: Bell },
    { key: "utilisateurs" as Tab, label: "Utilisateurs", icon: Users },
    { key: "roles" as Tab, label: "Rôles", icon: Shield },
  ];

  if (!organization) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[900px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paramètres</h1>
          <p className="page-subtitle">Configuration de votre organisation</p>
        </div>
        {isOwnerOrAdmin && (tab === "organisation" || tab === "facturation") && (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-card rounded-lg p-0.5 overflow-x-auto border border-border">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap",
              tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "organisation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Identité</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Nom" value={form.name || ""} onChange={(v) => update("name", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Email" value={form.email || ""} onChange={(v) => update("email", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Téléphone" value={form.phone || ""} onChange={(v) => update("phone", v)} disabled={!isOwnerOrAdmin} />
            <Field label="SIRET" value={form.siret || ""} onChange={(v) => update("siret", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Adresse" value={form.address || ""} onChange={(v) => update("address", v)} className="sm:col-span-2" disabled={!isOwnerOrAdmin} />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-3">Mode de fonctionnement</h3>
            <div className="flex gap-3">
              {(["independant", "centre"] as const).map((mode) => (
                <button key={mode} type="button" onClick={() => isOwnerOrAdmin && update("mode", mode)}
                  className={cn("flex-1 p-4 rounded-xl border-2 text-center transition-all duration-200",
                    form.mode === mode ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30",
                    !isOwnerOrAdmin && "opacity-50 cursor-not-allowed")}>
                  <p className="text-sm font-semibold text-foreground capitalize">{mode === "independant" ? "Indépendant" : "Centre"}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{mode === "independant" ? "Un seul utilisateur" : "Multi-formateurs et rôles"}</p>
                </button>
              ))}
            </div>
          </div>
          {activityTypes.length > 0 && (
            <div className="border-t border-border pt-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Types d'activité</h3>
              <div className="flex flex-wrap gap-2">
                {activityTypes.map((at) => (
                  <span key={at.id} className={cn("text-xs px-3 py-1 rounded-md font-medium", at.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                    {at.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === "facturation" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Facturation</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="N° TVA" value={form.tva_number || ""} onChange={(v) => update("tva_number", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Taux TVA (%)" value={String(form.tva_rate || 20)} onChange={(v) => update("tva_rate", parseFloat(v) || 20)} disabled={!isOwnerOrAdmin} />
            <Field label="Préfixe facture" value={form.invoice_prefix || "F"} onChange={(v) => update("invoice_prefix", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Préfixe devis" value={form.quote_prefix || "D"} onChange={(v) => update("quote_prefix", v)} disabled={!isOwnerOrAdmin} />
            <Field label="Devise" value="EUR (€)" disabled />
            <Field label="Fuseau horaire" value="Europe/Paris" disabled />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Webhook sortant (CRM / Zapier)</h3>
            <p className="text-xs text-muted-foreground mb-3">URL notifiée automatiquement à chaque création d'élève (POST JSON)</p>
            <Field label="URL du webhook" value={(form as any).webhook_url || ""} onChange={(v) => update("webhook_url" as any, v)} disabled={!isOwnerOrAdmin} />
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Webhook entrant (recevoir des élèves)</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Envoyez un POST JSON depuis votre CRM à cette URL pour créer des élèves automatiquement.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL du webhook entrant</label>
                <div className="flex gap-2">
                  <input type="text" readOnly
                    value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-student-webhook`}
                    className="flex-1 bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border opacity-70 font-mono text-xs" />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-student-webhook`); toast.success("URL copiée"); }}
                    className="btn-secondary text-xs px-3">Copier</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Clé API (header <code className="text-[10px] bg-accent px-1 py-0.5 rounded">x-api-key</code>)</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={(form as any).webhook_api_key || "—"}
                    className="flex-1 bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border opacity-70 font-mono text-xs" />
                  {(form as any).webhook_api_key && (
                    <button type="button" onClick={() => { navigator.clipboard.writeText((form as any).webhook_api_key); toast.success("Clé copiée"); }}
                      className="btn-secondary text-xs px-3">Copier</button>
                  )}
                </div>
              </div>
              {isOwnerOrAdmin && !(form as any).webhook_api_key && (
                <button type="button" onClick={async () => {
                  const key = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
                  const { error } = await supabase.from("organizations").update({ webhook_api_key: key } as any).eq("id", organization.id);
                  if (!error) { update("webhook_api_key" as any, key); toast.success("Clé API générée"); await refreshOrg(); }
                }} className="btn-primary text-xs">Générer une clé API</button>
              )}
            </div>
            <div className="mt-3 p-3 rounded-lg bg-accent/50 border border-border/60">
              <p className="text-[10px] font-medium text-foreground mb-1">Exemple d'appel :</p>
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{`POST ${import.meta.env.VITE_SUPABASE_URL}/functions/v1/receive-student-webhook
Headers: x-api-key: VOTRE_CLE_API
Body: {
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean@mail.com",
  "phone": "0612345678",
  "activity_type": "auto_ecole"
}`}</pre>
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Politique d'annulation par défaut</h3>
            <textarea value={form.cancellation_policy || ""} onChange={(e) => update("cancellation_policy", e.target.value)}
              disabled={!isOwnerOrAdmin}
              className="w-full bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none disabled:opacity-50" />
          </div>
        </motion.div>
      )}

      {tab === "utilisateurs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Utilisateurs</h2>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chargement...</p>
          ) : (
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border/60">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {(m.profile?.first_name?.[0] || "?")}{(m.profile?.last_name?.[0] || "")}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {m.profile ? `${m.profile.first_name} ${m.profile.last_name}`.trim() || "Sans nom" : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{m.user_id === user?.id ? "Vous" : ""}</p>
                  </div>
                  <div className="flex gap-1">
                    {m.roles.map((r: string) => (
                      <span key={r} className="status-badge rounded-md bg-primary/10 text-primary capitalize">{r}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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
              <div key={r.role} className="p-4 rounded-xl bg-accent/50 border border-border/60">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground text-sm">{r.role}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{r.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {r.perms.map((p) => (
                    <span key={p} className="status-badge rounded-md bg-accent text-accent-foreground">{p}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === "notifications" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Notifications & Rappels</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Rappels automatiques avant séance</p>
                <p className="text-xs text-muted-foreground">Envoyer un rappel aux élèves avant leur séance</p>
              </div>
              <Switch
                checked={notifSettings?.auto_reminder_enabled ?? true}
                onCheckedChange={(v) => upsertNotif.mutate({ auto_reminder_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Délai de rappel (heures)</p>
                <p className="text-xs text-muted-foreground">Nombre d'heures avant la séance</p>
              </div>
              <select
                value={notifSettings?.reminder_before_hours ?? 24}
                onChange={(e) => upsertNotif.mutate({ reminder_before_hours: Number(e.target.value) })}
                className="bg-card text-sm px-3 py-2 rounded-lg border border-border"
              >
                <option value={6}>6h</option>
                <option value={12}>12h</option>
                <option value={24}>24h</option>
                <option value={48}>48h</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Notifier le formateur</p>
                <p className="text-xs text-muted-foreground">En cas de modification ou annulation de séance</p>
              </div>
              <Switch
                checked={notifSettings?.notify_instructor_on_change ?? true}
                onCheckedChange={(v) => upsertNotif.mutate({ notify_instructor_on_change: v })}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Notifier l'élève</p>
                <p className="text-xs text-muted-foreground">En cas de modification ou annulation de séance</p>
              </div>
              <Switch
                checked={notifSettings?.notify_student_on_change ?? true}
                onCheckedChange={(v) => upsertNotif.mutate({ notify_student_on_change: v })}
              />
            </div>
          </div>
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              💡 Les notifications sont envoyées via le système de rappels intégré. Configurez les canaux (email, SMS, WhatsApp) dans la section Rappels.
            </p>
          </div>
        </motion.div>
      )}

      {tab === "competences" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Grille de compétences</h2>
          <p className="text-xs text-muted-foreground">Définissez les compétences à évaluer pour chaque élève (note de 1 à 5). Visible sur la fiche élève sous forme de radar.</p>

          <div className="flex gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="Nom de la compétence (ex: Manœuvres)"
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newSkillName.trim()) {
                  createSkill.mutate(newSkillName.trim(), { onSuccess: () => setNewSkillName("") });
                }
              }}
            />
            <Button
              onClick={() => { if (newSkillName.trim()) createSkill.mutate(newSkillName.trim(), { onSuccess: () => setNewSkillName("") }); }}
              disabled={!newSkillName.trim() || createSkill.isPending}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-1" /> Ajouter
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={skillCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {skillCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune compétence configurée</p>
                ) : (
                  skillCategories.map((cat) => (
                    <SortableSkillItem key={cat.id} id={cat.id} name={cat.name} onRemove={() => removeSkill.mutate(cat.id)} />
                  ))
                )}
              </div>
            </SortableContext>
          </DndContext>

          {skillCategories.length === 0 && (
            <div className="p-3 rounded-lg bg-accent/50 border border-border/60">
              <p className="text-xs font-medium text-foreground mb-1">Suggestions :</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["Code de la route", "Manœuvres", "Conduite en ville", "Conduite sur route", "Autoroute", "Stationnement", "Éco-conduite", "Gestion du stress"].map((s) => (
                  <button key={s} onClick={() => createSkill.mutate(s)}
                    className="text-xs px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, className, disabled }: {
  label: string; value: string; onChange?: (v: string) => void; className?: string; disabled?: boolean;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange?.(e.target.value)} disabled={disabled}
        className="w-full bg-card text-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-shadow" />
    </div>
  );
}

function SortableSkillItem({ id, name, onRemove }: { id: string; name: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center justify-between p-3 rounded-lg border border-border bg-card", isDragging && "opacity-50 shadow-lg")}>
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-0.5 text-muted-foreground hover:text-foreground touch-none">
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="text-sm font-medium text-foreground">{name}</span>
      </div>
      <button onClick={onRemove} className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}