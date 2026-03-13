import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Star } from "lucide-react";
import type { SkillCategory } from "@/hooks/useSkills";

interface Props {
  open: boolean;
  onClose: () => void;
  categories: SkillCategory[];
  onSubmit: (evaluations: { category_id: string; score: number; note?: string }[]) => void;
  loading?: boolean;
}

export default function SkillEvaluationDialog({ open, onClose, categories, onSubmit, loading }: Props) {
  const [scores, setScores] = useState<Record<string, number>>({});

  const setScore = (catId: string, score: number) => {
    setScores((prev) => ({ ...prev, [catId]: score }));
  };

  const handleSubmit = () => {
    const evaluations = categories
      .filter((c) => scores[c.id] && scores[c.id] > 0)
      .map((c) => ({ category_id: c.id, score: scores[c.id] }));
    if (evaluations.length === 0) return;
    onSubmit(evaluations);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setScores({}); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Évaluer les compétences</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <span className="text-sm font-medium text-foreground">{cat.name}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScore(cat.id, s)}
                    className="p-0.5 transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${(scores[cat.id] || 0) >= s ? "fill-warning text-warning" : "text-border"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSubmit} disabled={loading || Object.keys(scores).length === 0}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
