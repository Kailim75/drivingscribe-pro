import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, Users, Loader2, ArrowRight, Euro, AlertTriangle, TrendingUp, XCircle, UserX, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { lessonStatusLabels, lessonStatusColors, formatEur } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month" | "quarter";

function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const end = fmt(now);
  switch (period) {
    case "today": return { start: end, end };
    case "week": { const s = new Date(now); s.setDate(s.getDate() - 7); return { start: fmt(s), end }; }
    case "month": { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: fmt(s), end }; }
    case "quarter": { const s = new Date(now); s.setMonth(s.getMonth() - 3); return { start: fmt(s), end }; }
  }
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [instructorFilter, setInstructorFilter] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const { lessons: todayLessons, isLoading: loadingLessons } = useLessons({ date: todayStr });
  const { lessons: allLessons } = useLessons();
  const { students, isLoading: loadingStudents } = useStudents();
  const { instructors } = useInstructors();
  const { vehicles } = useVehicles();
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { expenses } = useExpenses();

  const isLoading = loadingLessons || loadingStudents;

  const range = useMemo(() => getDateRange(period), [period]);

  const periodLessons = useMemo(() => allLessons.filter((l: any) => {
    const inRange = l.date >= range.start && l.date <= range.end;
    const matchInstructor = !instructorFilter || l.instructor_id === instructorFilter;
    return inRange && matchInstructor;
  }), [allLessons, range, instructorFilter]);

  const periodPayments = useMemo(() => payments.filter((p) => p.date >= range.start && p.date <= range.end), [payments, range]);
  const periodExpenses = useMemo(() => expenses.filter((e) => e.date >= range.start && e.date <= range.end), [expenses, range]);

  const planned = periodLessons.filter((l: any) => l.status === "prevu").length;
  const completed = periodLessons.filter((l: any) => l.status === "effectue").length;
  const cancelled = periodLessons.filter((l: any) => l.status === "annule").length;
  const absent = periodLessons.filter((l: any) => l.status === "absent").length;
  const totalHoursDone = periodLessons.filter((l: any) => l.status === "effectue").reduce((s: number, l: any) => s + Number(l.duration_hours), 0);

  const activeStudents = students.filter((s) => s.status === "actif").length;
  const activeInstructors = instructors.filter((i) => i.status === "actif").length;
  const activeVehicles = vehicles.filter((v) => v.status === "actif").length;

  const periodRevenue = periodPayments.reduce((s, p) => s + p.amount, 0);
  const periodExpenseTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const unpaidInvoices = invoices.filter((i) => i.type === "facture" && i.remaining_amount > 0);
  const totalUnpaid = unpaidInvoices.reduce((s, i) => s + i.remaining_amount, 0);
  const overdueCount = invoices.filter((i) => i.status === "en_retard").length;

  const alerts: { message: string; type: "warning" | "error" }[] = [];
  if (overdueCount > 0) alerts.push({ message: `${overdueCount} facture${overdueCount > 1 ? "s" : ""} en retard`, type: "error" });
  if (totalUnpaid > 500) alerts.push({ message: `${formatEur(totalUnpaid)} d'impayés`, type: "warning" });

  const sorted = [...todayLessons].sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  const periodLabels: Record<Period, string> = { today: "Auj.", week: "7j", month: "Mois", quarter: "3 mois" };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-4">
      {/* Header + filters */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
            <p className="text-muted-foreground text-xs mt-0.5 hidden sm:block">
              {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {/* Instructor filter — desktop only inline, mobile below */}
          <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-xs px-2 py-1.5 rounded-lg border border-border hidden sm:block">
            <option value="">Tous formateurs</option>
            {instructors.filter(i => i.status === "actif").map((i) => <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>)}
          </select>
        </div>
        {/* Period tabs — full width on mobile for easy thumb tap */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-lg p-0.5 flex-1 sm:flex-initial">
            {(["today", "week", "month", "quarter"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={cn("flex-1 sm:flex-initial px-3 py-2 sm:py-1.5 text-xs font-medium rounded-md transition-colors", period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {periodLabels[p]}
              </button>
            ))}
          </div>
          {/* Mobile instructor filter */}
          <select value={instructorFilter} onChange={(e) => setInstructorFilter(e.target.value)} className="bg-secondary text-secondary-foreground text-xs px-2 py-2 rounded-lg border border-border sm:hidden">
            <option value="">Tous</option>
            {instructors.filter(i => i.status === "actif").map((i) => <option key={i.id} value={i.id}>{i.first_name}</option>)}
          </select>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium", a.type === "error" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Financial KPIs — 2x2 grid always fits mobile */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "CA encaissé", value: formatEur(periodRevenue), icon: Euro, color: "text-success" },
          { label: "Dépenses", value: formatEur(periodExpenseTotal), icon: TrendingUp, color: "text-destructive" },
          { label: "Résultat net", value: formatEur(periodRevenue - periodExpenseTotal), icon: TrendingUp, color: periodRevenue - periodExpenseTotal >= 0 ? "text-success" : "text-destructive" },
          { label: "Impayés", value: formatEur(totalUnpaid), icon: FileText, color: totalUnpaid > 0 ? "text-warning" : "text-muted-foreground" },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="glass-card rounded-xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{kpi.label}</span>
            </div>
            <p className={cn("text-lg sm:text-xl md:text-2xl font-bold tabular-nums", kpi.color)}>{kpi.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Operational KPIs — 3 cols on mobile, 6 on desktop */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {[
          { label: "Élèves actifs", value: activeStudents, icon: Users },
          { label: "Prévues", value: planned, icon: CalendarDays },
          { label: "Effectuées", value: completed, icon: CheckCircle2, color: "text-success" },
          { label: "Annulées", value: cancelled, icon: XCircle, color: cancelled > 0 ? "text-destructive" : "" },
          { label: "Absents", value: absent, icon: UserX, color: absent > 0 ? "text-warning" : "" },
          { label: "Heures", value: `${totalHoursDone}h`, icon: Clock },
        ].map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="glass-card rounded-xl p-2.5 sm:p-3.5 flex flex-col gap-1">
            <kpi.icon className="w-3.5 h-3.5 text-muted-foreground" />
            <p className={cn("text-base sm:text-lg md:text-xl font-bold tabular-nums", (kpi as any).color || "text-foreground")}>{kpi.value}</p>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground font-medium leading-tight">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid md:grid-cols-2 gap-3 sm:gap-4">
        {/* Today's lessons */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-xl">
          <div className="flex items-center justify-between p-3 sm:p-4 pb-0">
            <h2 className="font-semibold text-foreground text-sm">Séances du jour</h2>
            <Link to="/planning" className="text-xs text-primary hover:underline flex items-center gap-1">
              Planning <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 sm:p-4">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="w-7 h-7 opacity-40 mb-2" />
                <p className="text-xs">Aucune séance aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-1">
                {sorted.slice(0, 6).map((session: any) => (
                  <div key={session.id} className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors active:bg-secondary/70">
                    <div className="w-10 sm:w-12 text-center flex-shrink-0">
                      <span className="text-xs font-semibold text-foreground">{session.start_time?.slice(0, 5)}</span>
                      <span className="block text-[9px] text-muted-foreground">{session.duration_hours}h</span>
                    </div>
                    <div className="w-px h-7 bg-border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {session.students?.first_name} {session.students?.last_name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {session.instructors?.first_name} · {session.vehicles?.brand} {session.vehicles?.model}
                      </p>
                    </div>
                    <span className={cn("text-[9px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0", lessonStatusColors[session.status])}>
                      {lessonStatusLabels[session.status]}
                    </span>
                  </div>
                ))}
                {sorted.length > 6 && (
                  <Link to="/planning" className="block text-center text-xs text-primary hover:underline py-1">
                    +{sorted.length - 6} autres
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl">
          <div className="flex items-center justify-between p-3 sm:p-4 pb-0">
            <h2 className="font-semibold text-foreground text-sm">Ressources</h2>
          </div>
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Formateurs actifs</span>
                <span className="font-medium text-foreground">{activeInstructors}</span>
              </div>
              {instructors.filter(i => i.status === "actif").slice(0, 4).map((inst) => {
                const instHours = periodLessons.filter((l: any) => l.instructor_id === inst.id && l.status === "effectue").reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                return (
                  <div key={inst.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-foreground truncate mr-2">{inst.first_name} {inst.last_name}</span>
                    <span className="text-muted-foreground tabular-nums flex-shrink-0">{instHours}h</span>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border pt-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Véhicules actifs</span>
                <span className="font-medium text-foreground">{activeVehicles}</span>
              </div>
              {vehicles.filter(v => v.status === "actif").slice(0, 3).map((v) => {
                const vHours = periodLessons.filter((l: any) => l.vehicle_id === v.id && l.status === "effectue").reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                return (
                  <div key={v.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-foreground truncate mr-2">{v.brand} {v.model}</span>
                    <span className="text-muted-foreground font-mono text-[10px] flex-shrink-0">{v.plate} · {vHours}h</span>
                  </div>
                );
              })}
            </div>
            {unpaidInvoices.length > 0 && (
              <div className="border-t border-border pt-3">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Factures impayées</span>
                  <Link to="/facturation" className="text-primary hover:underline text-[10px]">Voir tout</Link>
                </div>
                {unpaidInvoices.slice(0, 3).map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between py-1 text-xs">
                    <span className="text-foreground font-mono text-[10px]">{inv.number}</span>
                    <span className="text-destructive font-medium tabular-nums">{formatEur(inv.remaining_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}