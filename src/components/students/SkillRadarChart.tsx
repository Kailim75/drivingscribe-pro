import { useMemo } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { SkillCategory, SkillEvaluation } from "@/hooks/useSkills";

interface Props {
  categories: SkillCategory[];
  evaluations: SkillEvaluation[];
}

export default function SkillRadarChart({ categories, evaluations }: Props) {
  const data = useMemo(() => {
    return categories.map((cat) => {
      const catEvals = evaluations.filter((e) => e.category_id === cat.id);
      // Take the latest score for each category
      const latest = catEvals.length > 0 ? catEvals[0].score : 0;
      // Average of all evaluations
      const avg = catEvals.length > 0 ? catEvals.reduce((s, e) => s + e.score, 0) / catEvals.length : 0;
      return {
        name: cat.name,
        score: Math.round(latest * 10) / 10,
        avg: Math.round(avg * 10) / 10,
        fullMark: 5,
      };
    });
  }, [categories, evaluations]);

  if (categories.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">Aucune compétence configurée</p>
        <p className="text-xs text-muted-foreground mt-1">Ajoutez des compétences dans les paramètres</p>
      </div>
    );
  }

  if (evaluations.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">Aucune évaluation</p>
        <p className="text-xs text-muted-foreground mt-1">Évaluez l'élève après une séance</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="hsl(var(--border))" />
        <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
        <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} tickCount={6} />
        <Radar name="Dernier score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
        <Radar name="Moyenne" dataKey="avg" stroke="hsl(var(--info))" fill="hsl(var(--info))" fillOpacity={0.1} strokeWidth={1} strokeDasharray="4 4" />
      </RadarChart>
    </ResponsiveContainer>
  );
}
