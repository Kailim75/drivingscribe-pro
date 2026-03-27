import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, Users, Loader2, ArrowRight, Euro, AlertTriangle, TrendingUp, XCircle, UserX, FileText, TrendingDown, Zap, Activity, Car, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useExpenses } from "@/hooks/useExpenses";
import { useStudentFormulas } from "@/hooks/useStudentFormulas";
import { lessonStatusLabels, lessonStatusColors, formatEur } from "@/lib/labels";
import { cn } from "@/lib/utils";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import AtRiskStudentsAlert from "@/components/dashboard/AtRiskStudentsAlert";
import QuickActions from "@/components/dashboard/QuickActions";
import { useSkillCategories } from "@/hooks/useSkills";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Progress } from "@/components/ui/progress";
import { AnimatedCurrency, AnimatedNumber } from "@/components/dashboard/AnimatedValue";

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

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function Dashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [instructorFilter, setInstructorFilter] = useState("");
  useKeyboardShortcuts();

  const todayStr = new Date().toISOString().split("T")[0];
  const range = useMemo(() => getDateRange(period), [period]);

  const { lessons: todayLessons, isLoading: loadingLessons } = useLessons({ date: todayStr });
  const { lessons: periodLessonsRaw, isLoading: loadingPeriod } = useLessons({ dateFrom: range.start, dateTo: range.end });
  const { students, isLoading: loadingStudents } = useStudents();
  const { instructors } = useInstructors();
  const { vehicles } = useVehicles();
  const { invoices } = useInvoices();
  const { payments } = usePayments();
  const { expenses } = useExpenses();
  const { formulas } = useStudentFormulas();
  const { categories } = useSkillCategories();

  const next30 = useMemo(() => {
    const now = new Date();
    const future = new Date(now);
    future.setDate(future.getDate() + 30);
    return { start: now.toISOString().split("T")[0], end: future.toISOString().split("T")[0] };
  }, []);
  const { lessons: futureLessons } = useLessons({ dateFrom: next30.start, dateTo: next30.end });

  const isLoading = loadingLessons || loadingStudents || loadingPeriod;

  const periodLessons = useMemo(() => {
    if (!instructorFilter) return periodLessonsRaw;
    return periodLessonsRaw.filter((l: any) => l.instructor_id === instructorFilter);
  }, [periodLessonsRaw, instructorFilter]);

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

  const allLessons = periodLessonsRaw;
  const studentsLowHours = useMemo(() => {
    const activeStudentsList = students.filter(s => s.status === "actif");
    return activeStudentsList.map(student => {
      const studentFormulas = formulas.filter(f => f.student_id === student.id);
      const totalBought = studentFormulas.reduce((s, f) => s + Number(f.hours_bought), 0);
      const completedHours = allLessons
        .filter((l: any) => l.student_id === student.id && l.status === "effectue")
        .reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
      const remaining = totalBought - completedHours;
      return { ...student, totalBought, completedHours, remaining };
    }).filter(s => s.totalBought > 0 && s.remaining <= 3);
  }, [students, formulas, allLessons]);

  const forecast = useMemo(() => {
    const plannedFuture = futureLessons.filter((l: any) => l.status === "prevu");
    const avgBillable = periodLessons.length > 0
      ? periodLessons.reduce((s: number, l: any) => s + Number(l.billable_amount || 0), 0) / periodLessons.length
      : 0;
    const forecastRevenue = plannedFuture.length * (avgBillable || 45);

    const periodDays = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 90;
    const prevStart = new Date();
    prevStart.setDate(prevStart.getDate() - periodDays * 2);
    const prevEnd = new Date();
    prevEnd.setDate(prevEnd.getDate() - periodDays);
    const prevPayments = payments.filter(p => p.date >= prevStart.toISOString().split("T")[0] && p.date <= prevEnd.toISOString().split("T")[0]);
    const prevRevenue = prevPayments.reduce((s, p) => s + p.amount, 0);
    const trend = prevRevenue > 0 ? ((periodRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    const maxHoursPerDay = 8;
    const workingDays = period === "today" ? 1 : period === "week" ? 5 : period === "month" ? 22 : 66;
    const maxCapacity = activeInstructors * maxHoursPerDay * workingDays;
    const occupancyRate = maxCapacity > 0 ? (totalHoursDone / maxCapacity) * 100 : 0;

    return {
      forecastRevenue,
      plannedSessions: plannedFuture.length,
      trend: Math.round(trend),
      occupancyRate: Math.round(occupancyRate),
    };
  }, [futureLessons, periodLessons, payments, periodRevenue, period, activeInstructors, totalHoursDone]);

  const alerts: { message: string; type: "warning" | "error" }[] = [];
  if (overdueCount > 0) alerts.push({ message: `${overdueCount} facture${overdueCount > 1 ? "s" : ""} en retard`, type: "error" });
  if (totalUnpaid > 500) alerts.push({ message: `${formatEur(totalUnpaid)} d'impayés en cours`, type: "warning" });
  if (studentsLowHours.length > 0) alerts.push({ message: `${studentsLowHours.length} élève${studentsLowHours.length > 1 ? "s" : ""} avec ≤ 3h restantes`, type: "warning" });
  if (forecast.occupancyRate < 30 && period !== "today") alerts.push({ message: `Taux d'occupation bas : ${forecast.occupancyRate}%`, type: "warning" });

  const sorted = [...todayLessons].sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));

  const periodLabels: Record<Period, string> = { today: "Aujourd'hui", week: "7 jours", month: "Ce mois", quarter: "3 mois" };
  const netResult = periodRevenue - periodExpenseTotal;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Chargement du tableau de bord…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl md:text-3xl font-bold text-foreground tracking-tight"
          >
            {getGreeting()} 👋
          </motion.h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            className="bg-card text-foreground text-xs px-3 py-2 rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">Tous les formateurs</option>
            {instructors.filter(i => i.status === "actif").map((i) => (
              <option key={i.id} value={i.id}>{i.first_name} {i.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex items-center gap-1 bg-muted/60 backdrop-blur-sm rounded-xl p-1 w-fit border border-border/50">
        {(["today", "week", "month", "quarter"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-lg transition-all duration-200",
              period === p
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
          >
            {periodLabels[p]}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2">
          {alerts.map((a, i) => (
            <div
              key={i}
              className={cn(
                "inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-semibold transition-colors",
                a.type === "error"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-warning/10 text-warning border border-warning/20"
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              {a.message}
            </div>
          ))}
        </motion.div>
      )}

      {/* Quick Actions */}
      <QuickActions />

      {/* Hero Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* CA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15 p-4"
        >
          <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <Euro className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">CA encaissé</span>
            </div>
            <AnimatedCurrency value={periodRevenue} className="text-2xl font-bold text-foreground tabular-nums" />
            {forecast.trend !== 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                {forecast.trend >= 0 ? <TrendingUp className="w-3 h-3 text-success" /> : <TrendingDown className="w-3 h-3 text-destructive" />}
                <span className={cn("text-[11px] font-semibold", forecast.trend >= 0 ? "text-success" : "text-destructive")}>
                  {forecast.trend > 0 ? "+" : ""}{forecast.trend}%
                </span>
                <span className="text-[10px] text-muted-foreground">vs précédent</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Dépenses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-destructive/8 via-destructive/3 to-transparent border border-destructive/12 p-4"
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Dépenses</span>
            </div>
            <AnimatedCurrency value={periodExpenseTotal} className="text-2xl font-bold text-foreground tabular-nums" />
          </div>
        </motion.div>

        {/* Résultat net */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4",
            netResult >= 0
              ? "bg-gradient-to-br from-success/8 via-success/3 to-transparent border-success/12"
              : "bg-gradient-to-br from-destructive/8 via-destructive/3 to-transparent border-destructive/12"
          )}
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", netResult >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                <TrendingUp className={cn("w-4 h-4", netResult >= 0 ? "text-success" : "text-destructive")} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Résultat net</span>
            </div>
            <AnimatedCurrency value={netResult} className={cn("text-2xl font-bold tabular-nums", netResult >= 0 ? "text-success" : "text-destructive")} />
          </div>
        </motion.div>

        {/* Impayés */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className={cn(
            "relative overflow-hidden rounded-2xl border p-4",
            totalUnpaid > 0
              ? "bg-gradient-to-br from-warning/8 via-warning/3 to-transparent border-warning/12"
              : "bg-card border-border"
          )}
        >
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", totalUnpaid > 0 ? "bg-warning/10" : "bg-muted")}>
                <FileText className={cn("w-4 h-4", totalUnpaid > 0 ? "text-warning" : "text-muted-foreground")} />
              </div>
              <span className="text-xs text-muted-foreground font-medium">Impayés</span>
            </div>
            <AnimatedCurrency value={totalUnpaid} className={cn("text-2xl font-bold tabular-nums", totalUnpaid > 0 ? "text-warning" : "text-foreground")} />
            {overdueCount > 0 && (
              <p className="text-[11px] text-destructive font-medium mt-1">{overdueCount} en retard</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Forecast strip */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border bg-card overflow-hidden"
      >
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="font-semibold text-foreground text-sm">Prévisions à 30 jours</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          <div className="p-4 lg:p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">CA prévisionnel</p>
            <AnimatedCurrency value={forecast.forecastRevenue} className="text-xl font-bold text-primary tabular-nums" />
            <p className="text-[11px] text-muted-foreground mt-1">{forecast.plannedSessions} séances planifiées</p>
          </div>
          <div className="p-4 lg:p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tendance</p>
            <div className="flex items-center gap-2">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", forecast.trend >= 0 ? "bg-success/10" : "bg-destructive/10")}>
                {forecast.trend >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
              </div>
              <AnimatedNumber value={forecast.trend} suffix="%" className={cn("text-xl font-bold tabular-nums", forecast.trend >= 0 ? "text-success" : "text-destructive")} />
            </div>
          </div>
          <div className="p-4 lg:p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Occupation</p>
            <AnimatedNumber value={forecast.occupancyRate} suffix="%" className={cn("text-xl font-bold tabular-nums mb-2", forecast.occupancyRate >= 60 ? "text-success" : forecast.occupancyRate >= 30 ? "text-warning" : "text-destructive")} />
            <Progress
              value={forecast.occupancyRate}
              className="h-1.5"
            />
          </div>
          <div className="p-4 lg:p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">À renouveler</p>
            <p className={cn("text-xl font-bold tabular-nums", studentsLowHours.length > 0 ? "text-warning" : "text-foreground")}>
              {studentsLowHours.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">élèves ≤ 3h restantes</p>
          </div>
        </div>
      </motion.div>

      {/* Operational KPIs — compact chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }} className="flex flex-wrap gap-2">
        {[
          { label: "Élèves", value: activeStudents, icon: Users, accent: "bg-primary/8 text-primary border-primary/12" },
          { label: "Prévues", value: planned, icon: CalendarDays, accent: "bg-info/8 text-info border-info/12" },
          { label: "Effectuées", value: completed, icon: CheckCircle2, accent: "bg-success/8 text-success border-success/12" },
          { label: "Annulées", value: cancelled, icon: XCircle, accent: cancelled > 0 ? "bg-destructive/8 text-destructive border-destructive/12" : "bg-muted/50 text-muted-foreground border-border" },
          { label: "Absents", value: absent, icon: UserX, accent: absent > 0 ? "bg-warning/8 text-warning border-warning/12" : "bg-muted/50 text-muted-foreground border-border" },
          { label: "Heures", value: `${totalHoursDone}h`, icon: Clock, accent: "bg-primary/8 text-primary border-primary/12" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className={cn("inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-colors", kpi.accent)}
          >
            <kpi.icon className="w-3.5 h-3.5" />
            <span className="tabular-nums">{kpi.value}</span>
            <span className="text-xs font-medium opacity-70">{kpi.label}</span>
          </div>
        ))}
      </motion.div>

      {/* Low hours alert */}
      {studentsLowHours.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-warning/15 bg-warning/5 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-warning/10 flex items-center justify-between">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Élèves en fin de forfait
            </h2>
            <Link to="/eleves" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
              Voir tous <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-2">
            {studentsLowHours.slice(0, 5).map((s) => (
              <Link key={s.id} to={`/eleves/${s.id}`} className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-warning/5 transition-colors group">
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-muted-foreground">{s.completedHours}h / {s.totalBought}h utilisées</p>
                </div>
                <span className={cn("text-sm font-bold tabular-nums px-2.5 py-1 rounded-lg", s.remaining <= 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning")}>
                  {s.remaining}h
                </span>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <DashboardCharts
        payments={periodPayments}
        expenses={periodExpenses}
        lessons={periodLessons}
        students={students}
        period={period}
      />

      <AtRiskStudentsAlert
        students={students}
        allLessons={periodLessonsRaw}
        allFormulas={formulas}
        evaluations={[]}
        categoryCount={categories.length}
      />

      {/* Bottom grid: Today + Resources */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Today's lessons */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              Séances du jour
            </h2>
            <Link to="/planning" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
              Planning <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <CalendarDays className="w-10 h-10 opacity-20 mb-3" />
                <p className="text-sm font-medium">Aucune séance aujourd'hui</p>
                <p className="text-xs text-muted-foreground/60 mt-0.5">Profitez-en pour planifier !</p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sorted.slice(0, 6).map((session: any, idx: number) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-14 text-center flex-shrink-0">
                      <span className="text-sm font-bold text-foreground tabular-nums">{session.start_time?.slice(0, 5)}</span>
                      <span className="block text-[10px] text-muted-foreground font-medium">{session.duration_hours}h</span>
                    </div>
                    <div className="w-0.5 h-9 rounded-full bg-primary/20 flex-shrink-0 group-hover:bg-primary/40 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {session.students?.first_name} {session.students?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session.instructors?.first_name} · {session.vehicles?.brand} {session.vehicles?.model}
                      </p>
                    </div>
                    <span className={cn("status-badge flex-shrink-0", lessonStatusColors[session.status])}>
                      {lessonStatusLabels[session.status]}
                    </span>
                  </motion.div>
                ))}
                {sorted.length > 6 && (
                  <Link to="/planning" className="flex items-center justify-center gap-1 text-xs text-primary hover:underline py-3 font-semibold">
                    +{sorted.length - 6} autres séances <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Resources */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Ressources
            </h2>
          </div>
          <div className="p-4 space-y-5">
            {/* Instructors */}
            <div>
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Formateurs</span>
                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{activeInstructors}</span>
              </div>
              <div className="space-y-1">
                {instructors.filter(i => i.status === "actif").slice(0, 4).map((inst) => {
                  const instHours = periodLessons.filter((l: any) => l.instructor_id === inst.id && l.status === "effectue").reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                  return (
                    <div key={inst.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                          {inst.first_name[0]}
                        </div>
                        <span className="text-sm font-medium text-foreground">{inst.first_name} {inst.last_name}</span>
                      </div>
                      <span className="text-xs font-semibold tabular-nums text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{instHours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vehicles */}
            <div className="border-t border-border pt-4">
              <div className="flex justify-between items-center text-xs mb-3">
                <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Véhicules</span>
                <span className="text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md">{activeVehicles}</span>
              </div>
              <div className="space-y-1">
                {vehicles.filter(v => v.status === "actif").slice(0, 3).map((v) => {
                  const vHours = periodLessons.filter((l: any) => l.vehicle_id === v.id && l.status === "effectue").reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                  return (
                    <div key={v.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-info/10 flex items-center justify-center">
                          <Car className="w-3.5 h-3.5 text-info" />
                        </div>
                        <span className="text-sm font-medium text-foreground">{v.brand} {v.model}</span>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">{v.plate} · {vHours}h</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Unpaid */}
            {unpaidInvoices.length > 0 && (
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center text-xs mb-3">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">Factures impayées</span>
                  <Link to="/facturation" className="text-primary hover:underline text-xs font-semibold flex items-center gap-1">
                    Voir tout <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="space-y-1">
                  {unpaidInvoices.slice(0, 3).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-2 px-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <span className="text-sm font-mono text-foreground">{inv.number}</span>
                      <span className="text-sm font-bold text-destructive tabular-nums">{formatEur(inv.remaining_amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
