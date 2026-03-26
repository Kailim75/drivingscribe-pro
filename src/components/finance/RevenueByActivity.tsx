import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { BarChart3 } from "lucide-react";
import { formatEur } from "@/lib/labels";

const ACTIVITY_LABELS: Record<string, string> = {
  auto_ecole: "Auto-école",
  taxi: "Taxi",
  vtc: "VTC",
  vmdtr: "VMDTR",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
];

interface Props {
  lessons: any[];
  students: any[];
}

export default function RevenueByActivity({ lessons, students }: Props) {
  const data = useMemo(() => {
    const doneLessons = lessons.filter(l => l.status === "effectue");
    const byActivity: Record<string, { revenue: number; hours: number; count: number }> = {};

    doneLessons.forEach(lesson => {
      const student = students.find(s => s.id === lesson.student_id);
      const activity = student?.activity_type || "auto_ecole";
      if (!byActivity[activity]) byActivity[activity] = { revenue: 0, hours: 0, count: 0 };
      byActivity[activity].revenue += Number(lesson.billed_amount) || 0;
      byActivity[activity].hours += Number(lesson.duration_hours) || 0;
      byActivity[activity].count += 1;
    });

    return Object.entries(byActivity)
      .map(([key, val]) => ({
        name: ACTIVITY_LABELS[key] || key,
        ...val,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [lessons, students]);

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" /> CA par activité
      </h2>

      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Aucune donnée</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} strokeWidth={0}>
                  {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => formatEur(value)} contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d, i) => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-xs text-foreground flex-1">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.hours}h</span>
                <span className="text-xs font-semibold text-foreground">{formatEur(d.revenue)}</span>
                <span className="text-[10px] text-muted-foreground">({total > 0 ? ((d.revenue / total) * 100).toFixed(0) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
