import { useMemo } from "react";

export interface HealthScore {
  overall: number; // 0-100
  attendance: number; // 0-100
  progression: number; // 0-100
  financial: number; // 0-100
  cancellation: number; // 0-100
  level: "excellent" | "bon" | "attention" | "critique";
  label: string;
}

interface StudentLesson {
  id: string;
  status: string;
  date: string;
  duration_hours: number;
  formula_id?: string | null;
}

interface StudentFormula {
  id: string;
  hours_bought: number;
  active: boolean;
}

interface StudentEvaluation {
  score: number;
  category_id: string;
  evaluated_at: string;
}

function getLevel(score: number): HealthScore["level"] {
  if (score >= 75) return "excellent";
  if (score >= 55) return "bon";
  if (score >= 35) return "attention";
  return "critique";
}

function getLevelLabel(level: HealthScore["level"]): string {
  switch (level) {
    case "excellent": return "Excellent";
    case "bon": return "Bon";
    case "attention": return "Attention";
    case "critique": return "Critique";
  }
}

export function computeHealthScore(
  lessons: StudentLesson[],
  formulas: StudentFormula[],
  evaluations: StudentEvaluation[],
  categoryCount: number
): HealthScore {
  // 1. Attendance (25%) — ratio of completed vs total scheduled in last 90 days
  const now = new Date();
  const d90 = new Date(now);
  d90.setDate(d90.getDate() - 90);
  const recentLessons = lessons.filter(l => new Date(l.date) >= d90);
  const totalRecent = recentLessons.length;
  const completedRecent = recentLessons.filter(l => l.status === "effectue").length;
  const attendance = totalRecent > 0 ? (completedRecent / totalRecent) * 100 : 50; // neutral if no lessons

  // 2. Progression (25%) — average skill score / 5 * 100
  let progression = 50; // neutral default
  if (evaluations.length > 0 && categoryCount > 0) {
    // Latest score per category
    const latestByCategory = new Map<string, number>();
    for (const e of evaluations) {
      if (!latestByCategory.has(e.category_id)) {
        latestByCategory.set(e.category_id, e.score);
      }
    }
    const avg = Array.from(latestByCategory.values()).reduce((s, v) => s + v, 0) / latestByCategory.size;
    progression = (avg / 5) * 100;
  }

  // 3. Financial (25%) — hours remaining ratio
  const totalBought = formulas.reduce((s, f) => s + Number(f.hours_bought), 0);
  const completedAll = lessons.filter(l => l.status === "effectue").reduce((s, l) => s + Number(l.duration_hours), 0);
  const remaining = totalBought - completedAll;
  let financial = 50; // neutral
  if (totalBought > 0) {
    const ratio = remaining / totalBought;
    if (ratio <= 0) financial = 10; // exhausted
    else if (ratio <= 0.15) financial = 30;
    else if (ratio <= 0.3) financial = 60;
    else financial = 90;
  }

  // 4. Cancellation (25%) — inverse of cancel/absent rate in last 90 days
  const cancelledRecent = recentLessons.filter(l => l.status === "annule" || l.status === "absent").length;
  const cancelRate = totalRecent > 0 ? cancelledRecent / totalRecent : 0;
  const cancellation = Math.max(0, (1 - cancelRate * 2.5) * 100); // 40% cancel = 0 score

  const overall = Math.round(attendance * 0.25 + progression * 0.25 + financial * 0.25 + cancellation * 0.25);
  const level = getLevel(overall);

  return {
    overall,
    attendance: Math.round(attendance),
    progression: Math.round(progression),
    financial: Math.round(financial),
    cancellation: Math.round(cancellation),
    level,
    label: getLevelLabel(level),
  };
}

export const healthColors: Record<HealthScore["level"], string> = {
  excellent: "text-success",
  bon: "text-info",
  attention: "text-warning",
  critique: "text-destructive",
};

export const healthBgColors: Record<HealthScore["level"], string> = {
  excellent: "bg-success/10 text-success",
  bon: "bg-info/10 text-info",
  attention: "bg-warning/10 text-warning",
  critique: "bg-destructive/10 text-destructive",
};
