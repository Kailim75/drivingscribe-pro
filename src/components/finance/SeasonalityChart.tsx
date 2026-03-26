import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { CalendarDays } from "lucide-react";
import { formatEur } from "@/lib/labels";

interface Props {
  invoices: any[];
  lessons: any[];
}

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];

export default function SeasonalityChart({ invoices, lessons }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const months: { label: string; key: string; revenue: number; hours: number; lessons: number; isCurrentMonth: boolean }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toISOString().slice(0, 7);
      months.push({
        label: MONTH_LABELS[d.getMonth()],
        key,
        revenue: 0,
        hours: 0,
        lessons: 0,
        isCurrentMonth: i === 0,
      });
    }

    invoices.filter(i => i.type === "facture").forEach(inv => {
      const key = inv.issue_date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) m.revenue += Number(inv.paid_amount) || 0;
    });

    lessons.filter(l => l.status === "effectue").forEach(lesson => {
      const key = lesson.date?.slice(0, 7);
      const m = months.find(m => m.key === key);
      if (m) {
        m.hours += Number(lesson.duration_hours) || 0;
        m.lessons += 1;
      }
    });

    return months;
  }, [invoices, lessons]);

  const avgRevenue = data.reduce((s, d) => s + d.revenue, 0) / 12;
  const peakMonth = data.reduce((best, d) => d.revenue > best.revenue ? d : best, data[0]);
  const lowMonth = data.reduce((worst, d) => d.revenue < worst.revenue ? d : worst, data[0]);

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" /> Saisonnalité (12 mois)
        </h2>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          <span>Moy: <span className="font-semibold text-foreground">{formatEur(avgRevenue)}</span>/mois</span>
          <span>Pic: <span className="font-semibold text-success">{peakMonth?.label}</span></span>
          <span>Creux: <span className="font-semibold text-warning">{lowMonth?.label}</span></span>
        </div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: number, name: string) => [
                name === "revenue" ? formatEur(value) : `${value}`,
                name === "revenue" ? "CA" : name === "hours" ? "Heures" : "Séances"
              ]}
              contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
            />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
