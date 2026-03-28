import { Link } from "react-router-dom";
import { AlertTriangle, Activity, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { computeHealthScore, healthBgColors, type HealthScore } from "@/hooks/useStudentHealthScore";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Props {
  students: Student[];
  allLessons: any[];
  allFormulas: any[];
  evaluations: any[];
  categoryCount: number;
}

export default function AtRiskStudentsAlert({ students, allLessons, allFormulas, evaluations, categoryCount }: Props) {
  const activeStudents = students.filter(s => s.status === "actif" || s.status === "en_pause");

  const scored = activeStudents.map(student => {
    const sLessons = allLessons.filter((l: any) => l.student_id === student.id);
    const sFormulas = allFormulas.filter((f: any) => f.student_id === student.id);
    const sEvals = evaluations.filter((e: any) => e.student_id === student.id);
    const score = computeHealthScore(sLessons, sFormulas, sEvals, categoryCount);
    return { student, score };
  });

  const atRisk = scored
    .filter(s => s.score.level === "critique" || s.score.level === "attention")
    .sort((a, b) => a.score.overall - b.score.overall)
    .slice(0, 5);

  if (atRisk.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" /> Élèves à risque
        </h2>
        <Link to="/eleves" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
          Voir tous <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="p-4 space-y-1">
        {atRisk.map(({ student, score }) => (
          <Link
            key={student.id}
            to={`/eleves/${student.id}`}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Activity className={cn("w-4 h-4", score.level === "critique" ? "text-destructive" : "text-warning")} />
              <span className="text-sm font-medium text-foreground">{student.first_name} {student.last_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("status-badge text-xs", healthBgColors[score.level])}>
                {score.overall}% · {score.label}
              </span>
              <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Ouvrir →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
