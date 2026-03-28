import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface MicroSummaryProps {
  message: string;
  icon?: LucideIcon;
  variant?: "info" | "warning" | "success" | "muted";
  action?: { label: string; to: string };
}

const variantStyles = {
  info: "bg-info/5 text-info border-info/10",
  warning: "bg-warning/5 text-warning border-warning/10",
  success: "bg-success/5 text-success border-success/10",
  muted: "bg-muted/50 text-muted-foreground border-border",
};

export default function MicroSummary({ message, icon: Icon, variant = "muted", action }: MicroSummaryProps) {
  return (
    <div className={cn("flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-[13px] font-medium", variantStyles[variant])}>
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span className="flex-1">{message}</span>
      {action && (
        <Link to={action.to} className="text-xs font-semibold hover:underline whitespace-nowrap opacity-80 hover:opacity-100 transition-opacity">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

export function getDashboardSummaries({
  overdueCount,
  totalUnpaid,
  studentsLowHoursCount,
  occupancyRate,
  todayLessonsCount,
  period,
}: {
  overdueCount: number;
  totalUnpaid: number;
  studentsLowHoursCount: number;
  occupancyRate: number;
  todayLessonsCount: number;
  period: string;
}) {
  const summaries: MicroSummaryProps[] = [];

  if (overdueCount > 0) {
    summaries.push({
      message: `${overdueCount} facture${overdueCount > 1 ? "s" : ""} en retard ${overdueCount > 1 ? "nécessitent" : "nécessite"} une relance`,
      variant: "warning",
      action: { label: "Relancer", to: "/facturation?statusFilter=en_retard" },
    });
  }

  if (studentsLowHoursCount > 0) {
    summaries.push({
      message: `${studentsLowHoursCount} élève${studentsLowHoursCount > 1 ? "s" : ""} en fin de forfait — renouvellement à prévoir`,
      variant: "warning",
      action: { label: "Voir", to: "/eleves" },
    });
  }

  if (occupancyRate < 30 && period !== "today") {
    summaries.push({
      message: `Taux d'occupation bas (${occupancyRate}%) — des créneaux sont disponibles`,
      variant: "info",
      action: { label: "Planning", to: "/planning" },
    });
  }

  if (summaries.length === 0 && todayLessonsCount > 0) {
    summaries.push({
      message: `${todayLessonsCount} séance${todayLessonsCount > 1 ? "s" : ""} aujourd'hui — bonne journée !`,
      variant: "success",
    });
  }

  if (summaries.length === 0) {
    summaries.push({
      message: "Aucune action urgente — tout est en ordre",
      variant: "muted",
    });
  }

  return summaries;
}
