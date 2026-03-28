import { cn } from "@/lib/utils";

export type Period = "month" | "quarter" | "year" | "all";

const labels: Record<Period, string> = {
  month: "Ce mois",
  quarter: "Trimestre",
  year: "Année",
  all: "Tout",
};

export function getDateRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  const end = fmt(now);
  switch (period) {
    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: fmt(s), end };
    }
    case "quarter": {
      const s = new Date(now);
      s.setMonth(s.getMonth() - 3);
      return { start: fmt(s), end };
    }
    case "year": {
      const s = new Date(now.getFullYear(), 0, 1);
      return { start: fmt(s), end };
    }
    case "all":
      return { start: "2020-01-01", end };
  }
}

interface Props {
  value: Period;
  onChange: (period: Period) => void;
  className?: string;
}

export default function DatePeriodFilter({ value, onChange, className }: Props) {
  return (
    <div className={cn("flex items-center bg-card rounded-lg p-0.5 border border-border", className)}>
      {(["month", "quarter", "year", "all"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
            value === p
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {labels[p]}
        </button>
      ))}
    </div>
  );
}
