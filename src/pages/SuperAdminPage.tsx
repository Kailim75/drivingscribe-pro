import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Shield, Building2, Users, GraduationCap, Car, CalendarDays, FileText, Loader2, ArrowLeft, Bell, UserPlus, Ban, Trash2, MoreHorizontal, Play, Search, Download, Key, Copy, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PaginationControls } from "@/components/PaginationControls";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    suspended: boolean;
    webhook_api_key: string | null;
    webhook_calls_count: number;
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
    suspended: boolean;
    org_roles: Array<{ org_name: string; role: string }> | null;
  }> | null;
  signups_per_month: Array<{ month: string; count: number }> | null;
  lessons_per_week: Array<{ week: string; count: number }> | null;
}

interface RecentSignup {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

type ConfirmAction = {
  type: "suspend_org" | "delete_org" | "suspend_user" | "delete_user" | "unsuspend_org" | "unsuspend_user";
  id: string;
  label: string;
};

export default function SuperAdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "orgs" | "users">("overview");
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [newSignupCount, setNewSignupCount] = useState(0);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [orgFilter, setOrgFilter] = useState<"all" | "active" | "suspended">("all");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "suspended">("all");
  const [orgSearch, setOrgSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [orgPage, setOrgPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const PAGE_SIZE = 15;
  const initialLoadDone = useRef(false);

  const loadStats = async () => {
    const { data, error } = await supabase.rpc("admin_get_global_stats");
    if (error) {
      setError("Accès refusé ou erreur de chargement.");
      console.error(error);
    } else {
      setStats(data as unknown as GlobalStats);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!user) return;
    loadStats();
  }, [user]);

  // Realtime subscription for new signups
  useEffect(() => {
    if (!user || error) return;

    const channel = supabase
      .channel("admin-new-signups")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles" },
        (payload) => {
          const newProfile = payload.new as RecentSignup;
          const name = [newProfile.first_name, newProfile.last_name].filter(Boolean).join(" ") || "Nouvel utilisateur";

          toast.success(`Nouvelle inscription !`, {
            description: `${name} vient de créer un compte`,
            icon: <UserPlus className="w-4 h-4" />,
            duration: 8000,
          });

          setRecentSignups((prev) => [newProfile, ...prev].slice(0, 20));
          setNewSignupCount((c) => c + 1);
          loadStats();
        }
      )
      .subscribe();

    initialLoadDone.current = true;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, error]);

  const executeAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      let rpcError: any = null;
      switch (confirmAction.type) {
        case "suspend_org":
          ({ error: rpcError } = await supabase.rpc("admin_suspend_organization", { _org_id: confirmAction.id, _suspended: true }));
          break;
        case "unsuspend_org":
          ({ error: rpcError } = await supabase.rpc("admin_suspend_organization", { _org_id: confirmAction.id, _suspended: false }));
          break;
        case "delete_org":
          ({ error: rpcError } = await supabase.rpc("admin_delete_organization", { _org_id: confirmAction.id }));
          break;
        case "suspend_user":
          ({ error: rpcError } = await supabase.rpc("admin_suspend_user", { _user_id: confirmAction.id, _suspended: true }));
          break;
        case "unsuspend_user":
          ({ error: rpcError } = await supabase.rpc("admin_suspend_user", { _user_id: confirmAction.id, _suspended: false }));
          break;
        case "delete_user":
          ({ error: rpcError } = await supabase.rpc("admin_delete_user", { _user_id: confirmAction.id }));
          break;
      }
      if (rpcError) throw rpcError;

      const actionLabels: Record<string, string> = {
        suspend_org: "Organisation suspendue",
        unsuspend_org: "Organisation réactivée",
        delete_org: "Organisation supprimée",
        suspend_user: "Utilisateur suspendu",
        unsuspend_user: "Utilisateur réactivé",
        delete_user: "Utilisateur supprimé",
      };
      toast.success(actionLabels[confirmAction.type]);
      await loadStats();
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur : " + (err.message || "Action échouée"));
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  };

  const confirmMessages: Record<string, { title: string; desc: string; destructive?: boolean }> = {
    suspend_org: { title: "Suspendre l'organisation", desc: "Les membres ne pourront plus accéder à leurs données. Cette action est réversible." },
    unsuspend_org: { title: "Réactiver l'organisation", desc: "L'organisation et ses membres retrouveront l'accès." },
    delete_org: { title: "Supprimer l'organisation", desc: "⚠️ ATTENTION : Toutes les données (élèves, séances, factures, etc.) seront définitivement supprimées. Cette action est IRRÉVERSIBLE.", destructive: true },
    suspend_user: { title: "Suspendre l'utilisateur", desc: "L'utilisateur ne pourra plus se connecter. Cette action est réversible." },
    unsuspend_user: { title: "Réactiver l'utilisateur", desc: "L'utilisateur pourra à nouveau se connecter." },
    delete_user: { title: "Supprimer l'utilisateur", desc: "⚠️ L'utilisateur sera retiré de toutes les organisations et ses données de profil seront supprimées. Cette action est IRRÉVERSIBLE.", destructive: true },
  };

  const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const bom = "\uFEFF";
    const csv = bom + [headers.join(";"), ...rows.map(r => r.map(c => `"${(c ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} téléchargé`);
  };

  const exportOrganizations = () => {
    if (!stats?.organizations) return;
    const headers = ["Nom", "Mode", "Statut", "Membres", "Élèves", "Formateurs", "Séances", "Créée le"];
    const rows = stats.organizations.map(o => [
      o.name, o.mode, o.suspended ? "Suspendue" : "Active",
      String(o.member_count), String(o.student_count), String(o.instructor_count),
      String(o.lesson_count), format(new Date(o.created_at), "dd/MM/yyyy", { locale: fr }),
    ]);
    downloadCsv("organisations.csv", headers, rows);
  };

  const exportUsers = () => {
    if (!stats?.users) return;
    const headers = ["Prénom", "Nom", "Statut", "Organisations & Rôles", "Inscrit le"];
    const rows = stats.users.map(u => [
      u.first_name || "", u.last_name || "", u.suspended ? "Suspendu" : "Actif",
      (u.org_roles || []).map(r => `${r.org_name} (${r.role})`).join(", "),
      format(new Date(u.created_at), "dd/MM/yyyy", { locale: fr }),
    ]);
    downloadCsv("utilisateurs.csv", headers, rows);
  };

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
      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction && confirmMessages[confirmAction.type]?.title}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="block mb-2 font-medium text-foreground">{confirmAction?.label}</span>
              {confirmAction && confirmMessages[confirmAction.type]?.desc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={actionLoading}
              className={confirmAction && confirmMessages[confirmAction.type]?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        {newSignupCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600">
              {newSignupCount} nouvelle{newSignupCount > 1 ? "s" : ""} inscription{newSignupCount > 1 ? "s" : ""}
            </span>
          </motion.div>
        )}
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

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Inscriptions par mois</h2>
              </div>
              {(stats.signups_per_month && stats.signups_per_month.length > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stats.signups_per_month.map(d => ({ ...d, label: format(new Date(d.month + '-01'), 'MMM yy', { locale: fr }) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="count" name="Inscriptions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Aucune donnée disponible</p>
              )}
            </div>
            <div className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h2 className="font-semibold text-foreground text-sm">Séances par semaine</h2>
              </div>
              {(stats.lessons_per_week && stats.lessons_per_week.length > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={stats.lessons_per_week.map(d => ({ ...d, label: format(new Date(d.week), 'd MMM', { locale: fr }) }))}>
                    <defs>
                      <linearGradient id="lessonsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} width={30} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Area type="monotone" dataKey="count" name="Séances" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#lessonsGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-muted-foreground py-8 text-center">Aucune donnée disponible</p>
              )}
            </div>
          </div>

          {/* Realtime recent signups */}
          {recentSignups.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-5 space-y-3 border-emerald-500/20 border">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-foreground text-sm">Inscriptions en direct</h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="space-y-2">
                <AnimatePresence>
                  {recentSignups.map((signup) => (
                    <motion.div
                      key={signup.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                    >
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-600">
                        {(signup.first_name?.[0] || "?")}{(signup.last_name?.[0] || "")}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {[signup.first_name, signup.last_name].filter(Boolean).join(" ") || "Sans nom"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {format(new Date(signup.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-medium">Nouveau</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Recent orgs */}
          <div className="glass-card rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-foreground text-sm">Dernières organisations</h2>
            <div className="space-y-2">
              {(stats.organizations || []).slice(0, 5).map((org) => (
                <div key={org.id} className={`flex items-center gap-3 p-3 rounded-lg border border-border/60 ${org.suspended ? "bg-destructive/5 border-destructive/20" : "bg-accent/50"}`}>
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                      {org.suspended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Suspendue</span>
                      )}
                    </div>
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
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground text-sm">Toutes les organisations</h2>
            <div className="flex items-center gap-2">
              <button onClick={exportOrganizations} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={orgSearch}
                  onChange={(e) => setOrgSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
                />
              </div>
              <div className="flex gap-1 bg-accent/50 rounded-lg p-0.5">
                {([["all", "Tous"], ["active", "Actives"], ["suspended", "Suspendues"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setOrgFilter(key)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${orgFilter === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Nom</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Mode</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Statut</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">API</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Appels</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Membres</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Élèves</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-center">Séances</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground">Créée le</th>
                  <th className="pb-2 text-xs font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = (stats.organizations || []).filter(o => orgFilter === "all" ? true : orgFilter === "suspended" ? o.suspended : !o.suspended).filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()));
                  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
                  const safePage = Math.min(orgPage, totalPages || 1);
                  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
                  return (
                    <>
                      {paged.map((org) => (
                        <tr key={org.id} className={`border-b border-border/50 transition-colors ${org.suspended ? "bg-destructive/5" : "hover:bg-accent/30"}`}>
                          <td className="py-2.5 font-medium text-foreground">{org.name}</td>
                          <td className="py-2.5">
                            <span className="status-badge rounded-md bg-primary/10 text-primary capitalize">{org.mode}</span>
                          </td>
                          <td className="py-2.5">
                            {org.suspended ? (
                              <span className="status-badge rounded-md bg-destructive/10 text-destructive text-[10px]">Suspendue</span>
                            ) : (
                              <span className="status-badge rounded-md bg-emerald-500/10 text-emerald-600 text-[10px]">Active</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center">
                            {org.webhook_api_key ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">
                                <Key className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-2.5 text-center text-muted-foreground">{org.member_count}</td>
                          <td className="py-2.5 text-center text-muted-foreground">{org.student_count}</td>
                          <td className="py-2.5 text-center text-muted-foreground">{org.lesson_count}</td>
                          <td className="py-2.5 text-muted-foreground text-xs">
                            {format(new Date(org.created_at), "d MMM yyyy", { locale: fr })}
                          </td>
                          <td className="py-2.5 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-accent transition-colors">
                                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                              </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                {org.suspended ? (
                                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "unsuspend_org", id: org.id, label: org.name })}>
                                    <Play className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                    Réactiver
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => setConfirmAction({ type: "suspend_org", id: org.id, label: org.name })}>
                                    <Ban className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                    Suspendre
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={async () => {
                                  try {
                                    const { data: key, error: err } = await supabase.rpc("admin_generate_api_key", { _org_id: org.id });
                                    if (err) throw err;
                                    await navigator.clipboard.writeText(key as string);
                                    toast.success("Clé API générée et copiée !");
                                    await loadStats();
                                  } catch (err: any) {
                                    toast.error("Erreur : " + (err.message || "Échec"));
                                  }
                                }}>
                                  {org.webhook_api_key ? (
                                    <><RefreshCw className="w-3.5 h-3.5 mr-2 text-primary" /> Régénérer clé API</>
                                  ) : (
                                    <><Key className="w-3.5 h-3.5 mr-2 text-primary" /> Générer clé API</>
                                  )}
                                </DropdownMenuItem>
                                {org.webhook_api_key && (
                                  <DropdownMenuItem onClick={() => {
                                    navigator.clipboard.writeText(org.webhook_api_key!);
                                    toast.success("Clé API copiée");
                                  }}>
                                    <Copy className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                    Copier clé API
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setConfirmAction({ type: "delete_org", id: org.id, label: org.name })}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                               </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })()}
              </tbody>
            </table>
            {(() => {
              const filtered = (stats.organizations || []).filter(o => orgFilter === "all" ? true : orgFilter === "suspended" ? o.suspended : !o.suspended).filter(o => !orgSearch || o.name.toLowerCase().includes(orgSearch.toLowerCase()));
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              if (totalPages <= 1) return null;
              const safePage = Math.min(orgPage, totalPages);
              return (
                <PaginationControls page={safePage} total={filtered.length} pageSize={PAGE_SIZE} onChange={(p) => setOrgPage(p)} />
              );
            })()}
          </div>
        </motion.div>
      )}

      {/* Users tab */}
      {tab === "users" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="font-semibold text-foreground text-sm">Tous les utilisateurs</h2>
            <div className="flex items-center gap-2">
              <button onClick={exportUsers} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-md border border-border hover:bg-accent transition-colors text-muted-foreground">
                <Download className="w-3.5 h-3.5" /> CSV
              </button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring w-44"
                />
              </div>
              <div className="flex gap-1 bg-accent/50 rounded-lg p-0.5">
                {([["all", "Tous"], ["active", "Actifs"], ["suspended", "Suspendus"]] as const).map(([key, label]) => (
                  <button key={key} onClick={() => setUserFilter(key)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${userFilter === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {(() => {
              const filtered = (stats.users || []).filter(u => userFilter === "all" ? true : userFilter === "suspended" ? u.suspended : !u.suspended).filter(u => { const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase(); return !userSearch || name.includes(userSearch.toLowerCase()); });
              const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
              const safePage = Math.min(userPage, totalPages || 1);
              const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
              return (
                <>
                  {paged.map((u) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "Sans nom";
                    const isSelf = u.user_id === user?.id;
                    return (
                      <div key={u.user_id} className={`flex items-center gap-3 p-3 rounded-lg border border-border/60 ${u.suspended ? "bg-destructive/5 border-destructive/20" : "bg-accent/50"}`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${u.suspended ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                          {(u.first_name?.[0] || "?")}{(u.last_name?.[0] || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{name}</p>
                            {isSelf && <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Vous</span>}
                            {u.suspended && <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive font-medium">Suspendu</span>}
                          </div>
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
                        {!isSelf && (
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1.5 rounded-md hover:bg-accent transition-colors">
                              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {u.suspended ? (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: "unsuspend_user", id: u.user_id, label: name })}>
                                  <Play className="w-3.5 h-3.5 mr-2 text-emerald-500" />
                                  Réactiver
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => setConfirmAction({ type: "suspend_user", id: u.user_id, label: name })}>
                                  <Ban className="w-3.5 h-3.5 mr-2 text-amber-500" />
                                  Suspendre
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => setConfirmAction({ type: "delete_user", id: u.user_id, label: name })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    );
                  })}
                </>
              );
            })()}
          </div>
          {(() => {
            const filtered = (stats.users || []).filter(u => userFilter === "all" ? true : userFilter === "suspended" ? u.suspended : !u.suspended).filter(u => { const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase(); return !userSearch || name.includes(userSearch.toLowerCase()); });
            const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
            if (totalPages <= 1) return null;
            const safePage = Math.min(userPage, totalPages);
            return <PaginationControls page={safePage} total={filtered.length} pageSize={PAGE_SIZE} onChange={(p) => setUserPage(p)} />;
          })()}
        </motion.div>
      )}
    </div>
  );
}
