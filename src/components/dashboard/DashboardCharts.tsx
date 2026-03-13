import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { formatEur } from "@/lib/labels";

interface DashboardChartsProps {
  payments: { date: string; amount: number }[];
  expenses: { date: string; amount: number }[];
  lessons: { date: string; status: string; duration_hours: number }[];
  period: "today" | "week" | "month" | "quarter";
}

function groupByBucket(
  items: { date: string; amount?: number }[],
  period: string,
  valueKey: "amount"
): Record<string, number> {
  const result: Record<string, number> = {};
  items.forEach((item) => {
    const d = new Date(item.date);
    let key: string;
    if (period === "today") {
      key = "Auj.";
    } else if (period === "week") {
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      key = days[d.getDay()];
    } else if (period === "month") {
      // Group by week number within month
      const weekNum = Math.ceil(d.getDate() / 7);
      key = `S${weekNum}`;
    } else {
      // quarter: group by month
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      key = months[d.getMonth()];
    }
    result[key] = (result[key] || 0) + Number((item as any)[valueKey] || 0);
  });
  return result;
}

function getBucketKeys(period: string): string[] {
  if (period === "today") return ["Auj."];
  if (period === "week") return ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  if (period === "month") return ["S1", "S2", "S3", "S4", "S5"];
  // quarter
  const now = new Date();
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const result: string[] = [];
  for (let i = 2; i >= 0; i--) {
    const m = new Date(now);
    m.setMonth(m.getMonth() - i);
    result.push(months[m.getMonth()]);
  }
  return result;
}

function groupLessonsByBucket(
  lessons: { date: string; status: string; duration_hours: number }[],
  period: string
): Record<string, { effectue: number; prevu: number; annule: number; absent: number }> {
  const result: Record<string, { effectue: number; prevu: number; annule: number; absent: number }> = {};
  lessons.forEach((l) => {
    const d = new Date(l.date);
    let key: string;
    if (period === "today") key = "Auj.";
    else if (period === "week") {
      const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
      key = days[d.getDay()];
    } else if (period === "month") {
      key = `S${Math.ceil(d.getDate() / 7)}`;
    } else {
      const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
      key = months[d.getMonth()];
    }
    if (!result[key]) result[key] = { effectue: 0, prevu: 0, annule: 0, absent: 0 };
    const status = l.status as keyof typeof result[string];
    if (status in result[key]) {
      result[key][status as "effectue" | "prevu" | "annule" | "absent"] += 1;
    }
  });
  return result;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium text-foreground">
            {p.name === "CA" || p.name === "Dépenses" ? formatEur(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function DashboardCharts({ payments, expenses, lessons, period }: DashboardChartsProps) {
  const bucketKeys = useMemo(() => getBucketKeys(period), [period]);

  const revenueData = useMemo(() => {
    const rev = groupByBucket(payments, period, "amount");
    const exp = groupByBucket(expenses, period, "amount");
    return bucketKeys.map((key) => ({
      name: key,
      CA: Math.round((rev[key] || 0) * 100) / 100,
      Dépenses: Math.round((exp[key] || 0) * 100) / 100,
    }));
  }, [payments, expenses, period, bucketKeys]);

  const sessionsData = useMemo(() => {
    const grouped = groupLessonsByBucket(lessons, period);
    return bucketKeys.map((key) => ({
      name: key,
      Effectuées: grouped[key]?.effectue || 0,
      Prévues: grouped[key]?.prevu || 0,
      Annulées: grouped[key]?.annule || 0,
      Absents: grouped[key]?.absent || 0,
    }));
  }, [lessons, period, bucketKeys]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* Revenue Chart */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card rounded-xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">CA vs Dépenses</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}€`} width={50} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar dataKey="CA" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="Dépenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={32} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Sessions Chart */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-xl">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">Séances par statut</h2>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={sessionsData}>
              <defs>
                <linearGradient id="gradEffectuees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPrevues" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="Effectuées" stroke="hsl(var(--success))" fill="url(#gradEffectuees)" strokeWidth={2} />
              <Area type="monotone" dataKey="Prévues" stroke="hsl(var(--primary))" fill="url(#gradPrevues)" strokeWidth={2} />
              <Area type="monotone" dataKey="Annulées" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.1} strokeWidth={1.5} />
              <Area type="monotone" dataKey="Absents" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
