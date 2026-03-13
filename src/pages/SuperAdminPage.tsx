import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Building2, Users, GraduationCap, Car, CalendarDays, FileText, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GlobalStats {
  total_organizations: number;
  total_users: number;
  total_students: number;
  total_instructors: number;
  total_lessons: number;
  total_invoices: number;
  organizations: Array<{
    id: string;
    name: string;
    email: string | null;
    mode: string;
    created_at: string;
    student_count: number;
    instructor_count: number;
    lesson_count: number;
    member_count: number;
  }> | null;
  users: Array<{
    user_id: string;
    first_name: string | null;
    last_name: string | null;
    created_at: string;
    org_roles: Array<{ org_name: string; role: string }> | null;
  }> | null;
}

export default function SuperAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "orgs" | "users">("overview");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.rpc("admin_get_global_stats");
      if (error) {
        setError("Accès refusé ou erreur de chargement.");
        console.error(error);
      } else {
        setStats(data as unknown as GlobalStats);
      }
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Shield className="w-12 h-12 text-destructive" />
        <p className="text-foreground font-semibold">Accès refusé</p>
        <p className="text-sm text-muted-foreground">Cette page est réservée aux super administrateurs.</p>
        <button onClick={() => navigate("/tableau-de-bord")} className="btn-primary mt-4">
          <ArrowLeft className="w-4 h-4" /> Retour au tableau de bord
        </button>
      </div>
    );
  }

  const kpis = [
    { label: "Organisations", value: stats.total_organizations, icon: Building2, color: "text-primary" },
    { label: "Utilisateurs", value: stats.total_users, icon: Users, color: "text-blue-500" },
    { label: "Élèves", value: stats.total_students, icon: GraduationCap, color: "text-emerald-500" },
    { label: "Formateurs", value: stats.total_instructors, icon: Car, color: "text-amber-500" },
    { label: "Séances", value: stats.total_lessons, icon: CalendarDays, color: "text-violet-500" },
    { label: "Factures", value: stats.total_invoices, icon: FileText, color: "text-rose-500" },
  ];

  const tabs = [
    { key: "overview" as const, label: "Vue d'ensemble" },
    { key: "orgs" as const, label: `Organisations (${stats.total_organizations})` },
    { key: "users" as const, label: `Utilisateurs (${stats.total_users})` },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1100px] mx-auto space-y-5">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/tableau-de-bord")} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="page-title">Super Admin</h1>
            </div>
            <p className="page-subtitle">Vue globale de toutes les organisations</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card rounded-lg p-0.5 overflow-x-auto border border-border">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      {tab === "overview" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="glass-card rounded-xl p-4 text-center space-y-1">
                <kpi.icon className={`w-5 h-5 mx-auto ${kpi.color}`} />
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Recent orgs */}
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">Dernières organisations</h2>
            <div className="space-y-2">
              {(stats.organizations || []).slice(0, 5).map((org) => (
                <div key={org.id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border/60">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(org.created_at), "d MMM yyyy", { locale: fr })} · {org.mode}
                    </p>
                  </div>
                  <div className="flex gap-3 text-[11px] text-muted-foreground">
                    <span>{org.student_count} élèves</span>
                    <span>{org.member_count} membres</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Organizations tab */}
      {tab === "orgs" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Toutes les organisations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Nom</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Mode</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Membres</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Élèves</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Formateurs</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Séances</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {(stats.organizations || []).map((org) => (
                  <tr key={org.id} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                    <td className="py-2.5 font-medium text-foreground">{org.name}</td>
                    <td className="py-2.5">
                      <span className="status-badge rounded-md bg-primary/10 text-primary capitalize">{org.mode}</span>
                    </td>
                    <td className="py-2.5 text-center text-muted-foreground">{org.member_count}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{org.student_count}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{org.instructor_count}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{org.lesson_count}</td>
                    <td className="py-2.5 text-muted-foreground text-xs">
                      {format(new Date(org.created_at), "d MMM yyyy", { locale: fr })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-3">
          <h2 className="font-semibold text-foreground text-sm">Tous les utilisateurs</h2>
          <div className="space-y-2">
            {(stats.users || []).map((u) => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border/60">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(u.first_name?.[0] || "?")}{(u.last_name?.[0] || "")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {[u.first_name, u.last_name].filter(Boolean).join(" ") || "Sans nom"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Inscrit le {format(new Date(u.created_at), "d MMM yyyy", { locale: fr })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {(u.org_roles || []).map((or, i) => (
                    <span key={i} className="status-badge rounded-md bg-accent text-accent-foreground text-[10px]">
                      {or.org_name} · {or.role}
                    </span>
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
