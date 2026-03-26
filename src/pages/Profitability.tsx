import { motion } from "framer-motion";
import { TrendingUp, Users, UserCog, Car, Clock, Percent, BarChart3, Loader2, XCircle } from "lucide-react";
import { useState, useMemo } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useStudentFormulas } from "@/hooks/useStudentFormulas";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { useLessons } from "@/hooks/useLessons";
import { useExpenses } from "@/hooks/useExpenses";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { formatEur } from "@/lib/labels";
import { cn } from "@/lib/utils";
import CashFlowForecast from "@/components/finance/CashFlowForecast";
import PaymentDelayAnalysis from "@/components/finance/PaymentDelayAnalysis";
import RevenueByActivity from "@/components/finance/RevenueByActivity";
import SeasonalityChart from "@/components/finance/SeasonalityChart";

type Period = "month" | "quarter" | "year" | "all";

function getRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const end = fmt(now);
  switch (period) {
    case "month": { const s = new Date(now.getFullYear(), now.getMonth(), 1); return { start: fmt(s), end }; }
    case "quarter": { const s = new Date(now); s.setMonth(s.getMonth() - 3); return { start: fmt(s), end }; }
    case "year": { const s = new Date(now.getFullYear(), 0, 1); return { start: fmt(s), end }; }
    case "all": return { start: "2020-01-01", end };
  }
}

export default function Profitability() {
  const [period, setPeriod] = useState<Period>("month");
  const range = useMemo(() => getRange(period), [period]);

  const { students } = useStudents();
  const { formulas } = useStudentFormulas();
  const { instructors, isLoading: instLoading } = useInstructors();
  const { vehicles } = useVehicles();
  const { lessons, isLoading: lessonsLoading } = useLessons();
  const { expenses } = useExpenses();
  const { invoices } = useInvoices();
  const { payments } = usePayments();

  if (instLoading || lessonsLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  const pLessons = lessons.filter((l) => l.date >= range.start && l.date <= range.end);
  const pExpenses = expenses.filter((e) => e.date >= range.start && e.date <= range.end);
  const pInvoices = invoices.filter((i) => i.issue_date >= range.start && i.issue_date <= range.end);

  const doneLessons = pLessons.filter((l) => l.status === "effectue");
  const cancelledLessons = pLessons.filter((l) => l.status === "annule" || l.status === "absent");
  const totalHoursDone = doneLessons.reduce((s, l) => s + Number(l.duration_hours), 0);
  const lostHours = cancelledLessons.reduce((s, l) => s + Number(l.duration_hours), 0);

  const totalRevenue = pInvoices.filter((i) => i.type === "facture").reduce((s, i) => s + i.paid_amount, 0);
  const totalExpensesAmt = pExpenses.reduce((s, e) => s + e.amount, 0);
  const fixedExpenses = pExpenses.filter((e) => e.type === "fixe").reduce((s, e) => s + e.amount, 0);
  const directExpenses = pExpenses.filter((e) => e.type === "directe").reduce((s, e) => s + e.amount, 0);
  const grossMargin = totalRevenue - directExpenses;
  const netMargin = totalRevenue - totalExpensesAmt;
  const avgRevenuePerHour = totalHoursDone > 0 ? totalRevenue / totalHoursDone : 0;
  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

  const activeInstructors = instructors.filter((i) => i.status === "actif");
  const periodDays = Math.max(1, Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000));
  const workingDays = Math.round(periodDays * (22 / 30));
  const maxHours = activeInstructors.length * 8 * workingDays;
  const occupancyRate = maxHours > 0 ? (totalHoursDone / maxHours) * 100 : 0;
  const nonProductiveHours = Math.max(0, maxHours - totalHoursDone);

  const perInstructor = instructors.map((inst) => {
    const instLessons = doneLessons.filter((l) => l.instructor_id === inst.id);
    const hours = instLessons.reduce((s, l) => s + Number(l.duration_hours), 0);
    const revenue = instLessons.reduce((s, l) => s + Number(l.billed_amount), 0);
    const cost = Number(inst.hourly_cost) * hours;
    const instExpenses = pExpenses.filter((e) => e.instructor_id === inst.id).reduce((s, e) => s + e.amount, 0);
    return { name: `${inst.first_name} ${inst.last_name}`, hours, revenue, cost: cost + instExpenses, margin: revenue - cost - instExpenses };
  });

  const perVehicle = vehicles.map((v) => {
    const vLessons = doneLessons.filter((l) => l.vehicle_id === v.id);
    const hours = vLessons.reduce((s, l) => s + Number(l.duration_hours), 0);
    const revenue = vLessons.reduce((s, l) => s + Number(l.billed_amount), 0);
    const vExpenses = pExpenses.filter((e) => e.vehicle_id === v.id).reduce((s, e) => s + e.amount, 0);
    return { name: `${v.brand} ${v.model}`, plate: v.plate, hours, revenue, cost: vExpenses + Number(v.monthly_cost), margin: revenue - vExpenses - Number(v.monthly_cost) };
  });

  const perStudent = students.map((s) => {
    const sFormulas = formulas.filter((sf) => sf.student_id === s.id);
    const sLessons = doneLessons.filter((l) => l.student_id === s.id);
    const hours = sLessons.reduce((sum, l) => sum + Number(l.duration_hours), 0);
    const totalBought = sFormulas.reduce((sum, f) => sum + Number(f.hours_bought), 0);
    const totalPrice = sFormulas.reduce((sum, f) => sum + Number(f.total_price), 0);
    const revenue = totalBought > 0 ? totalPrice * (hours / totalBought) : 0;
    return { name: `${s.first_name} ${s.last_name}`, hours, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const periodLabels: Record<Period, string> = { month: "Ce mois", quarter: "3 mois", year: "Année", all: "Tout" };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rentabilité</h1>
          <p className="page-subtitle">Analyse de performance</p>
        </div>
        <div className="flex items-center bg-card rounded-lg p-0.5 border border-border">
          {(["month", "quarter", "year", "all"] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", period === p ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPIs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Revenu / heure", value: formatEur(avgRevenuePerHour), icon: TrendingUp },
          { label: "Marge brute", value: `${grossMarginPct.toFixed(0)}%`, sub: formatEur(grossMargin), icon: BarChart3, color: grossMarginPct >= 50 ? "text-success" : "text-warning" },
          { label: "Marge nette", value: `${netMarginPct.toFixed(0)}%`, sub: formatEur(netMargin), icon: Percent, color: netMarginPct >= 20 ? "text-success" : netMarginPct >= 0 ? "text-warning" : "text-destructive" },
          { label: "Occupation", value: `${occupancyRate.toFixed(0)}%`, sub: `${totalHoursDone}h / ${maxHours}h`, icon: Clock },
          { label: "Heures perdues", value: `${lostHours}h`, sub: `${cancelledLessons.length} séances`, icon: XCircle, color: lostHours > 0 ? "text-warning" : "text-muted-foreground" },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className={cn("text-xl font-bold", (kpi as any).color || "text-foreground")}>{kpi.value}</p>
            {(kpi as any).sub && <p className="text-xs text-muted-foreground mt-0.5">{(kpi as any).sub}</p>}
          </div>
        ))}
      </motion.div>

      {/* Revenue vs expenses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Revenus vs Charges</h2>
          <div className="space-y-3">
            {[
              { label: "Revenus encaissés", value: totalRevenue, color: "bg-success", pct: 100 },
              { label: "Charges fixes", value: fixedExpenses, color: "bg-info", pct: totalRevenue > 0 ? (fixedExpenses / totalRevenue) * 100 : 0 },
              { label: "Charges directes", value: directExpenses, color: "bg-warning", pct: totalRevenue > 0 ? (directExpenses / totalRevenue) * 100 : 0 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold">{formatEur(item.value)}</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full transition-all", item.color)} style={{ width: `${Math.min(100, item.pct)}%` }} />
                </div>
              </div>
            ))}
            <div className="border-t border-border pt-2 flex justify-between text-xs">
              <span className="text-muted-foreground">Résultat net</span>
              <span className={cn("font-bold", netMargin >= 0 ? "text-success" : "text-destructive")}>{formatEur(netMargin)}</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Temps productif</h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{totalHoursDone}h</p>
              <p className="text-xs text-muted-foreground">Productif</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{nonProductiveHours}h</p>
              <p className="text-xs text-muted-foreground">Non productif</p>
            </div>
            {lostHours > 0 && (
              <div className="text-center">
                <p className="text-3xl font-bold text-warning">{lostHours}h</p>
                <p className="text-xs text-muted-foreground">Perdues</p>
              </div>
            )}
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <div className="h-full bg-success transition-all rounded-full" style={{ width: `${occupancyRate}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 italic">
            ⚠ Estimation basée sur {activeInstructors.length} formateur{activeInstructors.length > 1 ? "s" : ""} × 8h/jour × {workingDays}j ouvrés.
          </p>
        </div>
      </div>

      {/* Per instructor */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><UserCog className="w-4 h-4 text-primary" /> Par formateur</h2>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Formateur</th>
                <th className="text-right">Heures</th>
                <th className="text-right">Revenus</th>
                <th className="text-right hidden sm:table-cell">Coûts</th>
                <th className="text-right">Marge</th>
              </tr>
            </thead>
            <tbody>
              {perInstructor.map((inst) => (
                <tr key={inst.name}>
                  <td className="font-medium text-foreground">{inst.name}</td>
                  <td className="text-right text-muted-foreground">{inst.hours}h</td>
                  <td className="text-right text-foreground">{formatEur(inst.revenue)}</td>
                  <td className="text-right text-muted-foreground hidden sm:table-cell">{formatEur(inst.cost)}</td>
                  <td className={cn("text-right font-semibold", inst.margin >= 0 ? "text-success" : "text-destructive")}>{formatEur(inst.margin)}</td>
                </tr>
              ))}
              {perInstructor.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Aucune donnée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per vehicle */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Car className="w-4 h-4 text-primary" /> Par véhicule</h2>
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Véhicule</th>
                <th className="text-right">Heures</th>
                <th className="text-right">Revenus</th>
                <th className="text-right hidden sm:table-cell">Coûts</th>
                <th className="text-right">Marge</th>
              </tr>
            </thead>
            <tbody>
              {perVehicle.map((v) => (
                <tr key={v.plate}>
                  <td><p className="font-medium text-foreground">{v.name}</p><p className="text-[10px] text-muted-foreground font-mono">{v.plate}</p></td>
                  <td className="text-right text-muted-foreground">{v.hours}h</td>
                  <td className="text-right text-foreground">{formatEur(v.revenue)}</td>
                  <td className="text-right text-muted-foreground hidden sm:table-cell">{formatEur(v.cost)}</td>
                  <td className={cn("text-right font-semibold", v.margin >= 0 ? "text-success" : "text-destructive")}>{formatEur(v.margin)}</td>
                </tr>
              ))}
              {perVehicle.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-sm text-muted-foreground">Aucune donnée</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top students */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> Top 5 élèves</h2>
        <div className="space-y-2.5">
          {perStudent.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-5 text-xs text-muted-foreground text-right font-medium">{i + 1}.</span>
              <span className="flex-1 text-sm text-foreground font-medium">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.hours}h</span>
              <span className="text-sm font-semibold text-foreground">{formatEur(s.revenue)}</span>
            </div>
          ))}
          {perStudent.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 italic">
          ⚠ Revenus estimés au prorata des heures réalisées par rapport aux heures achetées dans les formules.
        </p>
      </div>
    </div>
  );
}