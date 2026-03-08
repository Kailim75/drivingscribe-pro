import { motion } from "framer-motion";
import { TrendingUp, Users, UserCog, Car, Clock, Euro, Percent, BarChart3 } from "lucide-react";
import { students, studentFormulas, instructors, vehicles, lessons, expenses, invoices, payments, formatEur } from "@/data/mockData";
import { cn } from "@/lib/utils";

export default function Profitability() {
  // Calculations
  const doneLessons = lessons.filter((l) => l.status === "effectué");
  const totalHoursDone = doneLessons.reduce((s, l) => s + l.durationHours, 0);
  const totalRevenue = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const fixedExpenses = expenses.filter((e) => e.type === "fixe").reduce((s, e) => s + e.amount, 0);
  const directExpenses = expenses.filter((e) => e.type === "directe").reduce((s, e) => s + e.amount, 0);
  const grossMargin = totalRevenue - directExpenses;
  const netMargin = totalRevenue - totalExpenses;
  const avgRevenuePerHour = totalHoursDone > 0 ? totalRevenue / totalHoursDone : 0;
  const grossMarginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
  const netMarginPct = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : 0;

  // Max possible hours (3 instructors × 8h × 22 days)
  const maxHours = instructors.filter((i) => i.status === "actif").length * 8 * 22;
  const occupancyRate = maxHours > 0 ? (totalHoursDone / maxHours) * 100 : 0;
  const nonProductiveHours = maxHours - totalHoursDone;

  // Per instructor
  const perInstructor = instructors.map((inst) => {
    const instLessons = doneLessons.filter((l) => l.instructorId === inst.id);
    const hours = instLessons.reduce((s, l) => s + l.durationHours, 0);
    const revenue = instLessons.reduce((s, l) => s + l.billedAmount, 0);
    const cost = inst.hourlyCost * hours;
    const instExpenses = expenses.filter((e) => e.instructorId === inst.id).reduce((s, e) => s + e.amount, 0);
    return { name: `${inst.firstName} ${inst.lastName}`, hours, revenue, cost: cost + instExpenses, margin: revenue - cost - instExpenses };
  });

  // Per vehicle
  const perVehicle = vehicles.map((v) => {
    const vLessons = doneLessons.filter((l) => l.vehicleId === v.id);
    const hours = vLessons.reduce((s, l) => s + l.durationHours, 0);
    const revenue = vLessons.reduce((s, l) => s + l.billedAmount, 0);
    const vExpenses = expenses.filter((e) => e.vehicleId === v.id).reduce((s, e) => s + e.amount, 0);
    return { name: `${v.brand} ${v.model}`, plate: v.plate, hours, revenue, cost: vExpenses + v.monthlyCost, margin: revenue - vExpenses - v.monthlyCost };
  });

  // Per student (top 5)
  const perStudent = students.map((s) => {
    const sFormula = studentFormulas.find((sf) => sf.studentId === s.id);
    const sLessons = doneLessons.filter((l) => l.studentId === s.id);
    const hours = sLessons.reduce((sum, l) => sum + l.durationHours, 0);
    const revenue = sFormula ? sFormula.totalPrice * (hours / (sFormula.hoursBought || 1)) : 0;
    return { name: `${s.firstName} ${s.lastName}`, hours, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rentabilité</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Analyse de performance — données de démonstration</p>
      </div>

      {/* Global KPIs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Revenu moyen / heure", value: formatEur(avgRevenuePerHour), icon: Euro },
          { label: "Marge brute", value: `${grossMarginPct.toFixed(0)}%`, sub: formatEur(grossMargin), icon: TrendingUp, color: grossMarginPct >= 50 ? "text-success" : "text-warning" },
          { label: "Marge nette estimée", value: `${netMarginPct.toFixed(0)}%`, sub: formatEur(netMargin), icon: Percent, color: netMarginPct >= 20 ? "text-success" : netMarginPct >= 0 ? "text-warning" : "text-destructive" },
          { label: "Taux d'occupation", value: `${occupancyRate.toFixed(0)}%`, sub: `${totalHoursDone}h / ${maxHours}h`, icon: Clock },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </div>
            <p className={cn("text-2xl font-bold", (kpi as any).color || "text-foreground")}>{kpi.value}</p>
            {(kpi as any).sub && <p className="text-xs text-muted-foreground mt-0.5">{(kpi as any).sub}</p>}
          </div>
        ))}
      </motion.div>

      {/* Revenue vs expenses */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Revenus vs Charges
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Revenus encaissés</span>
                <span className="text-success font-medium">{formatEur(totalRevenue)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Charges fixes</span>
                <span className="text-foreground font-medium">{formatEur(fixedExpenses)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-info rounded-full" style={{ width: `${(fixedExpenses / totalRevenue) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Charges directes</span>
                <span className="text-foreground font-medium">{formatEur(directExpenses)}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-warning rounded-full" style={{ width: `${(directExpenses / totalRevenue) * 100}%` }} />
              </div>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Résultat net</span>
                <span className={cn("font-bold", netMargin >= 0 ? "text-success" : "text-destructive")}>{formatEur(netMargin)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" /> Temps productif vs non productif
          </h2>
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{totalHoursDone}h</p>
              <p className="text-[10px] text-muted-foreground">Productif</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-muted-foreground">{nonProductiveHours}h</p>
              <p className="text-[10px] text-muted-foreground">Non productif</p>
            </div>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-success" style={{ width: `${occupancyRate}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Basé sur {instructors.filter((i) => i.status === "actif").length} formateurs × 8h × 22j/mois (estimation)
          </p>
        </div>
      </div>

      {/* Per instructor */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <UserCog className="w-4 h-4" /> Rentabilité par formateur
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Formateur</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Heures</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Revenus</th>
                <th className="pb-2 font-medium text-muted-foreground text-right hidden sm:table-cell">Coûts</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Marge</th>
              </tr>
            </thead>
            <tbody>
              {perInstructor.map((inst) => (
                <tr key={inst.name} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 font-medium text-foreground">{inst.name}</td>
                  <td className="py-2.5 text-right text-muted-foreground">{inst.hours}h</td>
                  <td className="py-2.5 text-right text-foreground">{formatEur(inst.revenue)}</td>
                  <td className="py-2.5 text-right text-muted-foreground hidden sm:table-cell">{formatEur(inst.cost)}</td>
                  <td className={cn("py-2.5 text-right font-semibold", inst.margin >= 0 ? "text-success" : "text-destructive")}>{formatEur(inst.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per vehicle */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Car className="w-4 h-4" /> Rentabilité par véhicule
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 font-medium text-muted-foreground">Véhicule</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Heures</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Revenus</th>
                <th className="pb-2 font-medium text-muted-foreground text-right hidden sm:table-cell">Coûts</th>
                <th className="pb-2 font-medium text-muted-foreground text-right">Marge</th>
              </tr>
            </thead>
            <tbody>
              {perVehicle.map((v) => (
                <tr key={v.plate} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5">
                    <p className="font-medium text-foreground">{v.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{v.plate}</p>
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">{v.hours}h</td>
                  <td className="py-2.5 text-right text-foreground">{formatEur(v.revenue)}</td>
                  <td className="py-2.5 text-right text-muted-foreground hidden sm:table-cell">{formatEur(v.cost)}</td>
                  <td className={cn("py-2.5 text-right font-semibold", v.margin >= 0 ? "text-success" : "text-destructive")}>{formatEur(v.margin)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top students */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" /> Top 5 élèves par revenu
        </h2>
        <div className="space-y-2">
          {perStudent.map((s, i) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-5 text-xs text-muted-foreground text-right">{i + 1}.</span>
              <span className="flex-1 text-sm text-foreground">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.hours}h</span>
              <span className="text-sm font-semibold text-foreground">{formatEur(s.revenue)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
