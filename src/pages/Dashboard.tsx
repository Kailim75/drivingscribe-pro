import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, CalendarDays, CheckCircle2, Clock, CreditCard, AlertTriangle, Euro, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { lessons, invoices, payments, expenses, students, studentFormulas, instructors, getStudentName, getInstructorName, getVehicleLabel, formatEur } from "@/data/mockData";

export default function Dashboard() {
  // Computed KPIs from centralized data
  const doneLessons = lessons.filter((l) => l.status === "effectué");
  const plannedLessons = lessons.filter((l) => l.status === "prévu");
  const cancelledLessons = lessons.filter((l) => l.status === "annulé" || l.status === "absent");
  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
  const totalUnpaid = invoices.filter((i) => i.remainingAmount > 0).reduce((s, i) => s + i.remainingAmount, 0);
  const totalHoursRemaining = studentFormulas.filter((sf) => sf.active).reduce((s, sf) => s + sf.hoursRemaining, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalRevenue - totalExpenses;

  const kpis = [
    { label: "CA encaissé", value: formatEur(totalRevenue), change: "ce mois", trend: "up" as const, icon: Euro },
    { label: "Séances prévues", value: `${plannedLessons.length}`, change: "à venir", trend: "neutral" as const, icon: CalendarDays },
    { label: "Séances effectuées", value: `${doneLessons.length}`, change: "ce mois", trend: "up" as const, icon: CheckCircle2 },
    { label: "Heures restantes", value: `${totalHoursRemaining}h`, change: "tous élèves", trend: "neutral" as const, icon: Clock },
    { label: "Paiements reçus", value: formatEur(totalRevenue), change: `${payments.length} paiements`, trend: "up" as const, icon: CreditCard },
    { label: "Factures impayées", value: formatEur(totalUnpaid), change: `${invoices.filter((i) => i.remainingAmount > 0).length} facture(s)`, trend: "down" as const, icon: AlertTriangle },
  ];

  const todayStr = new Date().toISOString().split("T")[0];
  const todaySessions = lessons
    .filter((l) => l.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Alerts
  const alerts: { type: "warning" | "info"; message: string }[] = [];
  invoices.filter((i) => i.status === "en_retard").forEach((i) => {
    alerts.push({ type: "warning", message: `Facture ${i.number} en retard — ${getStudentName(i.studentId)} — ${formatEur(i.remainingAmount)}` });
  });
  studentFormulas.filter((sf) => sf.active && sf.hoursRemaining <= 3 && sf.hoursRemaining > 0).forEach((sf) => {
    alerts.push({ type: "warning", message: `${getStudentName(sf.studentId)} — reste ${sf.hoursRemaining}h sur ${sf.offerName}` });
  });
  const unpaidInvoices = invoices.filter((i) => i.status === "partiellement_payé");
  if (unpaidInvoices.length > 0) alerts.push({ type: "info", message: `${unpaidInvoices.length} facture(s) partiellement payée(s)` });

  const totalHoursDone = doneLessons.reduce((s, l) => s + l.durationHours, 0);
  const maxHours = instructors.filter((i) => i.status === "actif").length * 8 * 22;
  const occupancyRate = maxHours > 0 ? (totalHoursDone / maxHours) * 100 : 0;
  const avgRevenuePerHour = totalHoursDone > 0 ? totalRevenue / totalHoursDone : 0;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="glass-card rounded-xl p-4 flex flex-col gap-2 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              {kpi.trend === "up" && <TrendingUp className="w-3.5 h-3.5 text-success" />}
              {kpi.trend === "down" && <TrendingDown className="w-3.5 h-3.5 text-destructive" />}
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.change}</p>
            </div>
            <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today sessions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 glass-card rounded-xl">
          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="font-semibold text-foreground">Séances du jour</h2>
            <Link to="/planning" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir le planning <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            {todaySessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <CalendarDays className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-sm">Aucune séance aujourd'hui</p>
              </div>
            ) : (
              <div className="space-y-1">
                {todaySessions.map((session) => {
                  const statusCfg = {
                    "prévu": "bg-info/10 text-info",
                    "effectué": "bg-success/10 text-success",
                    "annulé": "bg-destructive/10 text-destructive",
                    "absent": "bg-warning/10 text-warning",
                  };
                  return (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                      <div className="w-14 text-center flex-shrink-0">
                        <span className="text-sm font-semibold text-foreground">{session.startTime}</span>
                        <span className="block text-[10px] text-muted-foreground">{session.durationHours}h</span>
                      </div>
                      <div className="w-px h-8 bg-border" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{getStudentName(session.studentId)}</p>
                        <p className="text-xs text-muted-foreground truncate">{getVehicleLabel(session.vehicleId)} · {getInstructorName(session.instructorId)}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusCfg[session.status]}`}>{session.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card rounded-xl">
          <div className="p-4 pb-0">
            <h2 className="font-semibold text-foreground">Alertes</h2>
          </div>
          <div className="p-4 space-y-2">
            {alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucune alerte</p>
            ) : (
              alerts.map((alert, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg text-sm ${alert.type === "warning" ? "bg-warning/5 border border-warning/10" : "bg-info/5 border border-info/10"}`}>
                  {alert.type === "warning" ? <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" /> : <Clock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />}
                  <p className="text-foreground/80 text-xs leading-relaxed">{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Rentabilité summary */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">Rentabilité — Vue rapide</h2>
          <Link to="/rentabilite" className="text-xs text-primary hover:underline flex items-center gap-1">
            Détails <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Revenu moyen / heure", value: formatEur(avgRevenuePerHour) },
            { label: "Marge brute", value: `${grossMarginPct.toFixed(0)}%` },
            { label: "Taux d'occupation", value: `${occupancyRate.toFixed(0)}%` },
            { label: "Résultat net", value: formatEur(grossProfit) },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-3 rounded-lg bg-secondary/30">
              <p className="text-lg md:text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
