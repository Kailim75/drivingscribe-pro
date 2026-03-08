import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  Euro,
  ArrowRight,
} from "lucide-react";

// Mock data
const kpis = [
  { label: "CA du mois", value: "12 450 €", change: "+8,2%", trend: "up" as const, icon: Euro },
  { label: "Séances prévues", value: "42", change: "cette semaine", trend: "neutral" as const, icon: CalendarDays },
  { label: "Séances effectuées", value: "156", change: "ce mois", trend: "up" as const, icon: CheckCircle2 },
  { label: "Heures restantes", value: "89h", change: "tous élèves", trend: "neutral" as const, icon: Clock },
  { label: "Paiements reçus", value: "9 800 €", change: "+12%", trend: "up" as const, icon: CreditCard },
  { label: "Factures impayées", value: "2 650 €", change: "4 factures", trend: "down" as const, icon: AlertTriangle },
];

const upcomingSessions = [
  { student: "Marie Dupont", time: "09:00", duration: "1h", vehicle: "208 · AB-123-CD", type: "Auto-école", status: "confirmé" },
  { student: "Karim Bensaid", time: "10:30", duration: "2h", vehicle: "Clio · EF-456-GH", type: "Taxi", status: "confirmé" },
  { student: "Sophie Martin", time: "14:00", duration: "1h", vehicle: "208 · AB-123-CD", type: "Auto-école", status: "en attente" },
  { student: "Lucas Petit", time: "15:30", duration: "1h30", vehicle: "Tesla 3 · IJ-789-KL", type: "VTC", status: "confirmé" },
  { student: "Amina Youssef", time: "17:00", duration: "2h", vehicle: "Clio · EF-456-GH", type: "VMDTR", status: "confirmé" },
];

const alerts = [
  { type: "warning" as const, message: "Facture F-2024-042 en retard de 15 jours — Sophie Martin" },
  { type: "info" as const, message: "Contrôle technique véhicule 208 dans 12 jours" },
  { type: "warning" as const, message: "Karim Bensaid — reste 2h sur son pack de 20h" },
  { type: "info" as const, message: "3 séances non facturées cette semaine" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-secondary text-secondary-foreground text-sm px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
            <option>Ce mois</option>
            <option>Cette semaine</option>
            <option>Ce trimestre</option>
            <option>Cette année</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4"
      >
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={item}
            className="glass-card rounded-xl p-4 flex flex-col gap-2 hover:border-primary/20 transition-colors"
          >
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

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 glass-card rounded-xl"
        >
          <div className="flex items-center justify-between p-4 pb-0">
            <h2 className="font-semibold text-foreground">Prochaines séances</h2>
            <button className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir le planning <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="p-4">
            <div className="space-y-1">
              {upcomingSessions.map((session, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="w-14 text-center flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground">{session.time}</span>
                    <span className="block text-[10px] text-muted-foreground">{session.duration}</span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{session.student}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.vehicle}</p>
                  </div>
                  <span className="hidden sm:inline-flex text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {session.type}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      session.status === "confirmé"
                        ? "bg-success/10 text-success"
                        : "bg-warning/10 text-warning"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-xl"
        >
          <div className="p-4 pb-0">
            <h2 className="font-semibold text-foreground">Alertes</h2>
          </div>
          <div className="p-4 space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg text-sm ${
                  alert.type === "warning"
                    ? "bg-warning/5 border border-warning/10"
                    : "bg-info/5 border border-info/10"
                }`}
              >
                {alert.type === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                ) : (
                  <Clock className="w-4 h-4 text-info flex-shrink-0 mt-0.5" />
                )}
                <p className="text-foreground/80 text-xs leading-relaxed">{alert.message}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Rentabilité summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card rounded-xl p-4 md:p-6"
      >
        <h2 className="font-semibold text-foreground mb-4">Rentabilité — Vue rapide</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Revenu moyen / heure", value: "42,50 €" },
            { label: "Marge brute", value: "68%" },
            { label: "Taux d'occupation", value: "74%" },
            { label: "Marge nette estimée", value: "31%" },
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
