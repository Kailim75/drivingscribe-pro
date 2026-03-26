import { cn } from "@/lib/utils";
import { type HealthScore, healthBgColors } from "@/hooks/useStudentHealthScore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity } from "lucide-react";

interface Props {
  score: HealthScore;
  compact?: boolean;
}

export default function StudentHealthBadge({ score, compact }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("status-badge gap-1 cursor-default", healthBgColors[score.level])}>
            <Activity className="w-3 h-3" />
            {compact ? score.overall : `${score.overall}% · ${score.label}`}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs space-y-1 max-w-[200px]">
          <p className="font-semibold">Score santé : {score.overall}%</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>Assiduité</span><span className="text-right font-medium">{score.attendance}%</span>
            <span>Progression</span><span className="text-right font-medium">{score.progression}%</span>
            <span>Solde financier</span><span className="text-right font-medium">{score.financial}%</span>
            <span>Annulations</span><span className="text-right font-medium">{score.cancellation}%</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
