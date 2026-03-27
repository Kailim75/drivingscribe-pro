import { useState, useMemo, useCallback } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, GripVertical, User, Loader2 } from "lucide-react";
import { lessonStatusColors, lessonStatusLabels } from "@/lib/labels";
import { toast } from "sonner";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Instructor {
  id: string;
  first_name: string;
  last_name: string;
  status: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  status: string;
}

interface Lesson {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  status: string;
  students?: { first_name: string; last_name: string };
  instructors?: { first_name: string; last_name: string };
  vehicles?: { brand: string; model: string; plate: string };
}

interface Props {
  weekStart: Date;
  onWeekChange: (date: Date) => void;
  lessons: Lesson[];
  students: Student[];
  instructors: Instructor[];
  vehicles: Vehicle[];
  onCreateLesson: (data: any) => void;
  onEditLesson: (lesson: any) => void;
  creating: boolean;
  checkConflicts: (params: any) => Promise<any[]>;
}

// Draggable student chip
function DraggableStudent({ student }: { student: Student }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `student-${student.id}`,
    data: { type: "student", student },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border bg-card text-xs font-medium cursor-grab active:cursor-grabbing transition-all hover:border-primary/30 hover:shadow-sm",
        isDragging && "opacity-30"
      )}
    >
      <GripVertical className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      <User className="w-3 h-3 text-primary flex-shrink-0" />
      <span className="truncate">{student.first_name} {student.last_name[0]}.</span>
    </div>
  );
}

// Droppable time slot cell
function TimeSlotCell({ date, hour, children }: { date: Date; hour: number; children?: React.ReactNode }) {
  const id = `slot-${format(date, "yyyy-MM-dd")}-${hour}`;
  const { isOver, setNodeRef } = useDroppable({ id, data: { date, hour } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-[48px] border-b border-r border-border/50 transition-colors",
        isOver && "bg-primary/10 ring-1 ring-inset ring-primary/30"
      )}
    >
      {children}
    </div>
  );
}

// Lesson block rendered on the grid
function LessonBlock({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  const startParts = lesson.start_time.split(":").map(Number);
  const endParts = lesson.end_time.split(":").map(Number);
  const startMinFromBase = (startParts[0] - 7) * 60 + startParts[1];
  const durationMin = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);
  const topPx = (startMinFromBase / 60) * 48;
  const heightPx = Math.max((durationMin / 60) * 48, 20);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "absolute left-0.5 right-0.5 rounded-md px-1.5 py-0.5 text-[10px] leading-tight cursor-pointer overflow-hidden border transition-shadow hover:shadow-md z-10",
        lesson.status === "effectue" ? "bg-success/15 border-success/30 text-success" :
        lesson.status === "annule" ? "bg-destructive/15 border-destructive/30 text-destructive" :
        lesson.status === "absent" ? "bg-warning/15 border-warning/30 text-warning" :
        "bg-primary/15 border-primary/30 text-primary"
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      <p className="font-semibold truncate">{lesson.students?.first_name} {lesson.students?.last_name?.[0]}.</p>
      <p className="truncate opacity-80">{lesson.start_time?.slice(0, 5)}-{lesson.end_time?.slice(0, 5)}</p>
      {heightPx > 35 && <p className="truncate opacity-70">👤 {lesson.instructors?.first_name}</p>}
    </div>
  );
}

export default function WeeklyCalendarView({
  weekStart,
  onWeekChange,
  lessons,
  students,
  instructors,
  vehicles,
  onCreateLesson,
  onEditLesson,
  creating,
  checkConflicts,
}: Props) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [searchStudent, setSearchStudent] = useState("");

  const weekDays = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const filteredStudents = useMemo(() =>
    students
      .filter((s) => s.status === "actif")
      .filter((s) =>
        !searchStudent ||
        `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchStudent.toLowerCase())
      ),
    [students, searchStudent]
  );

  // Group lessons by day
  const lessonsByDay = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    weekDays.forEach((d) => { map[format(d, "yyyy-MM-dd")] = []; });
    lessons.forEach((l) => {
      const key = l.date;
      if (map[key]) map[key].push(l);
    });
    return map;
  }, [lessons, weekDays]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "student") setDraggedStudent(data.student);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDraggedStudent(null);
    const { over, active } = event;
    if (!over || !active.data.current) return;

    const student = active.data.current.student as Student;
    const { date, hour } = over.data.current as { date: Date; hour: number };
    const dateStr = format(date, "yyyy-MM-dd");
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endTime = `${String(hour + 1).padStart(2, "0")}:00`;

    // Find first available instructor
    const activeInstructors = instructors.filter((i) => i.status === "actif");
    const activeVehicles = vehicles.filter((v) => v.status === "actif");

    if (activeInstructors.length === 0 || activeVehicles.length === 0) {
      toast.error("Aucun formateur ou véhicule disponible");
      return;
    }

    // Try each instructor/vehicle combo until no conflict
    let foundInstructor: Instructor | null = null;
    let foundVehicle: Vehicle | null = null;

    for (const inst of activeInstructors) {
      for (const veh of activeVehicles) {
        try {
          const conflicts = await checkConflicts({
            instructor_id: inst.id,
            vehicle_id: veh.id,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
          });
          if (conflicts.length === 0) {
            foundInstructor = inst;
            foundVehicle = veh;
            break;
          }
        } catch {
          continue;
        }
      }
      if (foundInstructor) break;
    }

    if (!foundInstructor || !foundVehicle) {
      toast.error("Aucun créneau disponible pour ce formateur/véhicule à cette heure");
      return;
    }

    onCreateLesson({
      student_id: student.id,
      instructor_id: foundInstructor.id,
      vehicle_id: foundVehicle.id,
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      duration_hours: 1,
    });
  }, [instructors, vehicles, checkConflicts, onCreateLesson]);

  const today = new Date();

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Student sidebar */}
        <div className="glass-card rounded-xl p-3 lg:w-56 flex-shrink-0 space-y-3">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Élèves</h3>
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchStudent}
            onChange={(e) => setSearchStudent(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <p className="text-[10px] text-muted-foreground">Glissez un élève sur un créneau</p>
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
            {filteredStudents.map((s) => (
              <DraggableStudent key={s.id} student={s} />
            ))}
            {filteredStudents.length === 0 && (
              <p className="text-xs text-muted-foreground italic py-2 text-center">Aucun élève</p>
            )}
          </div>
          {creating && (
            <div className="flex items-center gap-2 text-xs text-primary font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Création...
            </div>
          )}
        </div>

        {/* Weekly grid */}
        <div className="flex-1 min-w-0 glass-card rounded-xl overflow-hidden">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
            <button onClick={() => onWeekChange(addDays(weekStart, -7))} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">
                {format(weekDays[0], "d MMM", { locale: fr })} — {format(weekDays[6], "d MMM yyyy", { locale: fr })}
              </p>
              <button onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-[10px] text-primary hover:underline">
                Semaine actuelle
              </button>
            </div>
            <button onClick={() => onWeekChange(addDays(weekStart, 7))} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Day headers */}
              <div className="grid grid-cols-[50px_repeat(7,1fr)] border-b border-border">
                <div className="p-1" />
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "p-2 text-center border-r border-border/50 last:border-r-0",
                      isSameDay(day, today) && "bg-primary/5"
                    )}
                  >
                    <p className="text-[10px] uppercase text-muted-foreground">{format(day, "EEE", { locale: fr })}</p>
                    <p className={cn(
                      "text-sm font-bold",
                      isSameDay(day, today) ? "text-primary" : "text-foreground"
                    )}>
                      {format(day, "d")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {HOURS.map((hour) => (
                <div key={hour} className="grid grid-cols-[50px_repeat(7,1fr)]">
                  <div className="p-1 text-[10px] text-muted-foreground text-right pr-2 border-r border-border/50 flex items-start justify-end pt-1">
                    {hour}:00
                  </div>
                  {weekDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayLessons = (lessonsByDay[dateKey] || []).filter((l) => {
                      const startH = parseInt(l.start_time.split(":")[0]);
                      return startH === hour;
                    });

                    return (
                      <TimeSlotCell key={`${dateKey}-${hour}`} date={day} hour={hour}>
                        {/* Only render lessons that START at this hour — positioning is absolute */}
                        {hour === HOURS[0] && (lessonsByDay[dateKey] || []).map((l) => (
                          <LessonBlock key={l.id} lesson={l} onClick={() => onEditLesson(l)} />
                        ))}
                      </TimeSlotCell>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedStudent && (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
            <User className="w-3.5 h-3.5" />
            {draggedStudent.first_name} {draggedStudent.last_name}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
