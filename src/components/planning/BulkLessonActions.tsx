import { useState } from "react";
import { CheckSquare, Square, X, CheckCircle2, XCircle, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkStatusChange: (status: string) => void;
  isPending: boolean;
}

export default function BulkLessonActions({ selectedIds, totalCount, onSelectAll, onClearSelection, onBulkStatusChange, isPending }: Props) {
  const [confirm, setConfirm] = useState<{ status: string; label: string } | null>(null);
  const count = selectedIds.length;

  if (count === 0) {
    return (
      <button onClick={onSelectAll} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium">
        <Square className="w-3.5 h-3.5" /> Sélectionner
      </button>
    );
  }

  const actions = [
    { status: "effectue", label: "Effectué", icon: CheckCircle2, color: "bg-success/10 text-success hover:bg-success/15" },
    { status: "annule", label: "Annulé", icon: XCircle, color: "bg-destructive/10 text-destructive hover:bg-destructive/15" },
    { status: "absent", label: "Absent", icon: UserX, color: "bg-warning/10 text-warning hover:bg-warning/15" },
  ];

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <CheckSquare className="w-3.5 h-3.5" />
          {count}/{totalCount}
        </div>
        {count < totalCount && (
          <button onClick={onSelectAll} className="text-xs text-primary hover:underline font-medium">Tout</button>
        )}
        {actions.map((a) => (
          <button key={a.status} onClick={() => setConfirm({ status: a.status, label: a.label })} disabled={isPending}
            className={cn("text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1", a.color)}>
            <a.icon className="w-3 h-3" /> {a.label}
          </button>
        ))}
        <button onClick={onClearSelection} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(v) => !v && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Changement de statut en lot</AlertDialogTitle>
            <AlertDialogDescription>
              Marquer {count} séance{count > 1 ? "s" : ""} comme « {confirm?.label} » ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirm) { onBulkStatusChange(confirm.status); setConfirm(null); } }}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
