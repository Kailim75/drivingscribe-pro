import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useInstructorAvailabilities } from "@/hooks/useInstructorAvailabilities";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
// DB: 0=Lundi...6=Dimanche

interface Props {
  open: boolean;
  onClose: () => void;
  instructorId: string;
  instructorName: string;
}

interface Slot {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export default function InstructorAvailabilityDialog({ open, onClose, instructorId, instructorName }: Props) {
  const { availabilities, isLoading, upsertSlots } = useInstructorAvailabilities(instructorId);
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (availabilities.length > 0) {
      setSlots(availabilities.map((a) => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time.slice(0, 5),
        end_time: a.end_time.slice(0, 5),
      })));
    } else if (!isLoading) {
      // Default: Mon-Fri 8-18
      setSlots([0, 1, 2, 3, 4].map((d) => ({ day_of_week: d, start_time: "08:00", end_time: "18:00" })));
    }
  }, [availabilities, isLoading]);

  const addSlot = (day: number) => {
    setSlots([...slots, { day_of_week: day, start_time: "08:00", end_time: "12:00" }]);
  };

  const removeSlot = (idx: number) => {
    setSlots(slots.filter((_, i) => i !== idx));
  };

  const updateSlot = (idx: number, key: keyof Slot, value: string | number) => {
    setSlots(slots.map((s, i) => i === idx ? { ...s, [key]: value } : s));
  };

  const handleSave = () => {
    upsertSlots.mutate({ instructor_id: instructorId, slots }, { onSuccess: onClose });
  };

  const slotsByDay = DAYS.map((_, dayIdx) =>
    slots.map((s, origIdx) => ({ ...s, origIdx })).filter((s) => s.day_of_week === dayIdx)
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Disponibilités — {instructorName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {DAYS.map((day, dayIdx) => (
              <div key={dayIdx} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{day}</span>
                  <button onClick={() => addSlot(dayIdx)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                {slotsByDay[dayIdx].length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Indisponible</p>
                ) : (
                  <div className="space-y-1.5">
                    {slotsByDay[dayIdx].map((slot) => (
                      <div key={slot.origIdx} className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={slot.start_time}
                          onChange={(e) => updateSlot(slot.origIdx, "start_time", e.target.value)}
                          className="h-8 text-xs w-28"
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input
                          type="time"
                          value={slot.end_time}
                          onChange={(e) => updateSlot(slot.origIdx, "end_time", e.target.value)}
                          className="h-8 text-xs w-28"
                        />
                        <button onClick={() => removeSlot(slot.origIdx)} className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={upsertSlots.isPending}>
            {upsertSlots.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
