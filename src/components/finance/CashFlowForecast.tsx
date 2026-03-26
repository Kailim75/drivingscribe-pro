import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";
import { formatEur } from "@/lib/labels";

interface Props {
  invoices: any[];
  expenses: any[];
  payments: any[];
}

export default function CashFlowForecast({ invoices, expenses, payments }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; revenue: number; expenses: number; net: number; cumulative: number; forecast: boolean }[] = [];

    // 6 past months + 3 future months
    for (let i = -6; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      months.push({ key, label, revenue: 0, expenses: 0, net: 0, cumulative: 0, forecast: i > 0 });
    }

    // Fill actual revenue (paid_amount from invoices)
    invoices.filter(i => i.type === "facture").forEach(inv => {
      const key = inv.issue_date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m && !m.forecast) m.revenue += Number(inv.paid_amount) || 0;
    });

    // Fill actual expenses
    expenses.forEach(exp => {
      const key = exp.date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m && !m.forecast) m.expenses += Number(exp.amount) || 0;
    });

    // Forecast: average of last 3 actual months
    const actuals = months.filter(m => !m.forecast && m.key >= months[0].key);
    const last3 = actuals.slice(-3);
    const avgRevenue = last3.length > 0 ? last3.reduce((s, m) => s + m.revenue, 0) / last3.length : 0;
    const avgExpenses = last3.length > 0 ? last3.reduce((s, m) => s + m.expenses, 0) / last3.length : 0;

    // Add pending invoices due in forecast months
    const pendingByMonth: Record<string, number> = {};
    invoices.filter(i => i.type === "facture" && i.remaining_amount > 0).forEach(inv => {
      const dueKey = inv.due_date?.slice(0, 7);
      if (dueKey) pendingByMonth[dueKey] = (pendingByMonth[dueKey] || 0) + Number(inv.remaining_amount);
    });

    months.forEach(m => {
      if (m.forecast) {
        m.revenue = avgRevenue + (pendingByMonth[m.key] || 0);
        m.expenses = avgExpenses;
      }
      m.net = m.revenue - m.expenses;
    });

    // Cumulative
    let cum = 0;
    months.forEach(m => {
      cum += m.net;
      m.cumulative = cum;
    });

    return months;
  }, [invoices, expenses, payments]);

  const forecastNet = data.filter(d => d.forecast).reduce((s, d) => s + d.net, 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" /> Prévision de trésorerie
        </h2>
        <span className="text-xs text-muted-foreground">
          Projection 3 mois : <span className={forecastNet >= 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>{formatEur(forecastNet)}</span>
        </span>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number, name: string) => [formatEur(value), name === "revenue" ? "Revenus" : name === "expenses" ? "Charges" : "Cumulé"]}
              labelFormatter={(label) => label}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            <ReferenceLine x={data.find(d => d.forecast)?.label} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" label={{ value: "Prévision →", fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Area type="monotone" dataKey="revenue" stroke="hsl(var(--success))" fill="url(#colorRevenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" fill="url(#colorExpenses)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
