import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { seedDemoData } from "@/lib/seedDemoData";
import type { Database } from "@/integrations/supabase/types";

type OrgMode = Database["public"]["Enums"]["org_mode"];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { refreshOrg } = useOrg();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [mode, setMode] = useState<OrgMode>("independant");
  const [withDemo, setWithDemo] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setLoading(true);
    setError("");

    try {
      // 1. Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name: name.trim(), mode })
        .select()
        .single();

      if (orgError) throw orgError;

      // 2. Add user as member
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({ organization_id: org.id, user_id: user.id });

      if (memberError) throw memberError;

      // 3. Assign owner role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ organization_id: org.id, user_id: user.id, role: "owner" as const });

      if (roleError) throw roleError;

      // 4. Create default activity types
      const defaultTypes = [
        { name: "Auto-école", slug: "auto-ecole" },
        { name: "Taxi", slug: "taxi" },
        { name: "VTC", slug: "vtc" },
        { name: "VMDTR", slug: "vmdtr" },
      ];

      await supabase.from("activity_types").insert(
        defaultTypes.map((t) => ({ ...t, organization_id: org.id }))
      );

      // 5. Audit log
      const profile = await supabase.from("profiles").select("first_name, last_name").eq("user_id", user.id).single();
      const userName = profile.data ? `${profile.data.first_name} ${profile.data.last_name}`.trim() : user.email || "";

      await supabase.from("audit_logs").insert({
        organization_id: org.id,
        user_id: user.id,
        user_name: userName,
        action: "Organisation créée",
        entity: "organization",
        entity_id: org.id,
        details: `${name} — mode ${mode}`,
      });

      await refreshOrg();
      navigate("/tableau-de-bord", { replace: true });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">DS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Créez votre organisation</h1>
          <p className="text-sm text-muted-foreground mt-1">Configurez votre espace de travail DriveSync</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Nom de l'organisation *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Ex: Auto-École Centrale" />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Mode de fonctionnement</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "independant" as OrgMode, title: "Indépendant", desc: "Un seul formateur, interface simplifiée" },
                { value: "centre" as OrgMode, title: "Centre", desc: "Multi-formateurs, rôles et permissions" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-colors ${
                    mode === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={loading || !name.trim()}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer mon organisation
          </button>
        </form>
      </motion.div>
    </div>
  );
}
