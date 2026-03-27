import { useState, useMemo, useCallback } from "react";
import { DndContext, DragOverlay, useDraggable, useDroppable, DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { format, startOfWeek, addDays, isSameDay, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, GripVertical, User, Loader2, Search, Clock, Car, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

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
  instructor_id: string;
  vehicle_id: string;
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
  onUpdateLesson: (data: any) => void;
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
        "flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/60 bg-card text-xs font-medium cursor-grab active:cursor-grabbing transition-all duration-200",
        "hover:border-primary/40 hover:shadow-sm hover:bg-primary/[0.03]",
        isDragging && "opacity-20 scale-95"
      )}
    >
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
        <span className="text-[10px] font-bold text-primary">
          {student.first_name[0]}{student.last_name[0]}
        </span>
      </div>
      <span className="truncate flex-1">{student.first_name} {student.last_name}</span>
      <GripVertical className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" />
    </div>
  );
}

// Droppable time slot cell
function TimeSlotCell({ date, hour, isEven, children }: { date: Date; hour: number; isEven: boolean; children?: React.ReactNode }) {
  const id = `slot-${format(date, "yyyy-MM-dd")}-${hour}`;
  const { isOver, setNodeRef } = useDroppable({ id, data: { date, hour } });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative min-h-[56px] border-b border-r border-border/30 transition-all duration-200",
        isEven ? "bg-muted/20" : "bg-transparent",
        isOver && "bg-primary/8 ring-1 ring-inset ring-primary/25 shadow-inner"
      )}
    >
      {children}
    </div>
  );
}

// Draggable lesson block rendered on the grid
function DraggableLessonBlock({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `lesson-${lesson.id}`,
    data: { type: "lesson", lesson },
  });

  const startParts = lesson.start_time.split(":").map(Number);
  const endParts = lesson.end_time.split(":").map(Number);
  const startMinFromBase = (startParts[0] - 7) * 60 + startParts[1];
  const durationMin = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);
  const topPx = (startMinFromBase / 60) * 56;
  const heightPx = Math.max((durationMin / 60) * 56, 24);

  const statusStyles = {
    effectue: "bg-success/12 border-success/40 hover:bg-success/18",
    annule: "bg-destructive/12 border-destructive/40 hover:bg-destructive/18",
    absent: "bg-warning/12 border-warning/40 hover:bg-warning/18",
    prevu: "bg-primary/12 border-primary/40 hover:bg-primary/18",
  };

  const statusTextColors = {
    effectue: "text-success",
    annule: "text-destructive",
    absent: "text-warning",
    prevu: "text-primary",
  };

  const style = statusStyles[lesson.status as keyof typeof statusStyles] || statusStyles.prevu;
  const textColor = statusTextColors[lesson.status as keyof typeof statusTextColors] || statusTextColors.prevu;

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.3 : 1, scale: 1 }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={cn(
        "absolute left-1 right-1 rounded-lg px-2 py-1 text-[10px] leading-tight cursor-grab active:cursor-grabbing overflow-hidden border-l-[3px] border transition-all duration-200 z-10 shadow-sm hover:shadow-md",
        style,
        isDragging && "ring-2 ring-primary/40"
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
    >
      <p className={cn("font-bold truncate", textColor)}>
        {lesson.students?.first_name} {lesson.students?.last_name?.[0]}.
      </p>
      <p className="truncate text-muted-foreground">
        {lesson.start_time?.slice(0, 5)} – {lesson.end_time?.slice(0, 5)}
      </p>
      {heightPx > 40 && lesson.instructors?.first_name && (
        <p className="truncate text-muted-foreground/70 mt-0.5">
          <UserCheck className="w-2.5 h-2.5 inline mr-0.5" />
          {lesson.instructors.first_name}
        </p>
      )}
    </motion.div>
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
  onUpdateLesson,
  creating,
  checkConflicts,
}: Props) {
  const [draggedStudent, setDraggedStudent] = useState<Student | null>(null);
  const [draggedLesson, setDraggedLesson] = useState<Lesson | null>(null);
  const [searchStudent, setSearchStudent] = useState("");
  const [pendingDrop, setPendingDrop] = useState<{ student: Student; date: Date; hour: number } | null>(null);

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

  const lessonsByDay = useMemo(() => {
    const map: Record<string, Lesson[]> = {};
    weekDays.forEach((d) => { map[format(d, "yyyy-MM-dd")] = []; });
    lessons.forEach((l) => {
      const key = l.date;
      if (map[key]) map[key].push(l);
    });
    return map;
  }, [lessons, weekDays]);

  // Count lessons per day for header badges
  const lessonCountByDay = useMemo(() => {
    const counts: Record<string, number> = {};
    weekDays.forEach((d) => {
      const key = format(d, "yyyy-MM-dd");
      counts[key] = (lessonsByDay[key] || []).length;
    });
    return counts;
  }, [lessonsByDay, weekDays]);

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current;
    if (data?.type === "student") setDraggedStudent(data.student);
    if (data?.type === "lesson") setDraggedLesson(data.lesson);
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setDraggedStudent(null);
    setDraggedLesson(null);
    const { over, active } = event;
    if (!over || !active.data.current) return;
    const data = active.data.current;
    const { date, hour } = over.data.current as { date: Date; hour: number };

    if (data.type === "student") {
      setPendingDrop({ student: data.student as Student, date, hour });
      return;
    }

    if (data.type === "lesson") {
      const lesson = data.lesson as Lesson;
      const dateStr = format(date, "yyyy-MM-dd");
      const startParts = lesson.start_time.split(":").map(Number);
      const endParts = lesson.end_time.split(":").map(Number);
      const durationMin = (endParts[0] * 60 + endParts[1]) - (startParts[0] * 60 + startParts[1]);

      const newStart = `${String(hour).padStart(2, "0")}:00`;
      const endTotal = hour * 60 + durationMin;
      const newEnd = `${String(Math.floor(endTotal / 60)).padStart(2, "0")}:${String(endTotal % 60).padStart(2, "0")}`;

      // Skip if same slot
      if (dateStr === lesson.date && newStart === lesson.start_time.slice(0, 5)) return;

      try {
        const conflicts = await checkConflicts({
          instructor_id: lesson.instructor_id || (lesson as any).instructors?.id,
          vehicle_id: lesson.vehicle_id || (lesson as any).vehicles?.id,
          date: dateStr,
          start_time: newStart,
          end_time: newEnd,
          exclude_lesson_id: lesson.id,
        });
        if (conflicts.length > 0) {
          toast.error("Conflit détecté : ce créneau est déjà occupé");
          return;
        }
        const oldDate = lesson.date;
        const oldStart = lesson.start_time;
        const oldEnd = lesson.end_time;

        onUpdateLesson({
          id: lesson.id,
          date: dateStr,
          start_time: newStart,
          end_time: newEnd,
        });

        toast.success("Séance déplacée", {
          description: `${lesson.students?.first_name} ${lesson.students?.last_name?.[0]}. → ${format(date, "EEE d MMM", { locale: fr })} à ${newStart.slice(0, 5)}`,
          action: {
            label: "Annuler",
            onClick: () => {
              onUpdateLesson({
                id: lesson.id,
                date: oldDate,
                start_time: oldStart,
                end_time: oldEnd,
              });
              toast.info("Déplacement annulé");
            },
          },
          duration: 6000,
        });
      } catch {
        toast.error("Erreur lors du déplacement de la séance");
      }
    }
  }, [checkConflicts, onUpdateLesson]);

  const confirmDrop = useCallback(async (durationHours: number) => {
    if (!pendingDrop) return;
    const { student, date, hour } = pendingDrop;
    setPendingDrop(null);

    const dateStr = format(date, "yyyy-MM-dd");
    const startTime = `${String(hour).padStart(2, "0")}:00`;
    const endMinutes = hour * 60 + durationHours * 60;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

    const activeInstructors = instructors.filter((i) => i.status === "actif");
    const activeVehicles = vehicles.filter((v) => v.status === "actif");

    if (activeInstructors.length === 0 || activeVehicles.length === 0) {
      toast.error("Aucun formateur ou véhicule disponible");
      return;
    }

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
      duration_hours: durationHours,
    });
  }, [pendingDrop, instructors, vehicles, checkConflicts, onCreateLesson]);

  const today = new Date();
  const totalWeekLessons = lessons.length;

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Student sidebar */}
        <div className="lg:w-60 flex-shrink-0 space-y-3">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Élèves</h3>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredStudents.length}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Rechercher un élève..."
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
              />
            </div>
            <div className="flex items-center gap-2 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] text-muted-foreground">Glissez un élève sur la grille</p>
            </div>
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-0.5 scrollbar-thin">
              {filteredStudents.map((s) => (
                <DraggableStudent key={s.id} student={s} />
              ))}
              {filteredStudents.length === 0 && (
                <div className="flex flex-col items-center py-6 text-center">
                  <User className="w-8 h-8 text-muted-foreground/20 mb-2" />
                  <p className="text-xs text-muted-foreground italic">Aucun élève trouvé</p>
                </div>
              )}
            </div>
          </div>

          {/* Week stats */}
          <div className="glass-card rounded-xl p-4 space-y-2">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Cette semaine</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-primary/5 p-2.5 text-center">
                <p className="text-lg font-bold text-primary">{totalWeekLessons}</p>
                <p className="text-[10px] text-muted-foreground">Séances</p>
              </div>
              <div className="rounded-lg bg-success/5 p-2.5 text-center">
                <p className="text-lg font-bold text-success">
                  {lessons.filter(l => l.status === "effectue").length}
                </p>
                <p className="text-[10px] text-muted-foreground">Effectuées</p>
              </div>
            </div>
          </div>

          {creating && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-3 flex items-center gap-2.5 text-xs text-primary font-semibold border-primary/20"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Création en cours...</span>
            </motion.div>
          )}
        </div>

        {/* Weekly grid */}
        <div className="flex-1 min-w-0 glass-card rounded-xl overflow-hidden border border-border/40">
          {/* Week navigation */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 bg-muted/30">
            <button
              onClick={() => onWeekChange(addDays(weekStart, -7))}
              className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center space-y-0.5">
              <p className="text-sm font-bold text-foreground tracking-tight">
                {format(weekDays[0], "d MMM", { locale: fr })} — {format(weekDays[6], "d MMM yyyy", { locale: fr })}
              </p>
              <button
                onClick={() => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="text-[10px] text-primary hover:text-primary/80 font-semibold transition-colors"
              >
                Revenir à cette semaine
              </button>
            </div>
            <button
              onClick={() => onWeekChange(addDays(weekStart, 7))}
              className="p-2 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[750px]">
              {/* Day headers */}
              <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border/40 bg-muted/20">
                <div className="p-2 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
                {weekDays.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const count = lessonCountByDay[dateKey] || 0;
                  const isCurrentDay = isToday(day);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "py-3 px-2 text-center border-l border-border/30 transition-colors",
                        isCurrentDay && "bg-primary/[0.04]"
                      )}
                    >
                      <p className={cn(
                        "text-[10px] uppercase font-semibold tracking-wider",
                        isCurrentDay ? "text-primary" : "text-muted-foreground"
                      )}>
                        {format(day, "EEE", { locale: fr })}
                      </p>
                      <div className="flex items-center justify-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "text-lg font-bold leading-none",
                          isCurrentDay
                            ? "w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm"
                            : "text-foreground"
                        )}>
                          {format(day, "d")}
                        </span>
                        {count > 0 && (
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                            isCurrentDay ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                          )}>
                            {count}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time slots */}
              {HOURS.map((hour, hourIdx) => (
                <div key={hour} className="grid grid-cols-[56px_repeat(7,1fr)]">
                  <div className={cn(
                    "px-2 text-[10px] font-semibold text-muted-foreground/60 border-r border-border/30 flex items-start justify-end pt-1.5 pr-3 tabular-nums",
                    hourIdx % 2 === 0 ? "bg-muted/20" : ""
                  )}>
                    {String(hour).padStart(2, "0")}:00
                  </div>
                  {weekDays.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");

                    return (
                      <TimeSlotCell key={`${dateKey}-${hour}`} date={day} hour={hour} isEven={hourIdx % 2 === 0}>
                        {hour === HOURS[0] && (lessonsByDay[dateKey] || []).map((l) => (
                          <DraggableLessonBlock key={l.id} lesson={l} onClick={() => onEditLesson(l)} />
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

      {/* Duration picker modal */}
      <AnimatePresence>
        {pendingDrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={() => setPendingDrop(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-2xl shadow-2xl p-5 w-72 space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Durée de la séance</p>
                  </div>
                </div>
                <div className="ml-10">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{pendingDrop.student.first_name} {pendingDrop.student.last_name}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(pendingDrop.date, "EEEE d MMMM", { locale: fr })} à {pendingDrop.hour}h00
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[{ label: "1h", value: 1 }, { label: "1h30", value: 1.5 }, { label: "2h", value: 2 }].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => confirmDrop(opt.value)}
                    disabled={creating}
                    className={cn(
                      "relative px-3 py-3 rounded-xl border-2 border-border/60 bg-background text-sm font-bold text-foreground transition-all duration-200",
                      "hover:border-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:scale-[1.02]",
                      "active:scale-[0.98]",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPendingDrop(null)}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center py-1.5 transition-colors rounded-lg hover:bg-muted"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedStudent && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xl ring-2 ring-primary/30">
            <div className="w-5 h-5 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-3 h-3" />
            </div>
            {draggedStudent.first_name} {draggedStudent.last_name}
          </div>
        )}
        {draggedLesson && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-2xl ring-2 ring-primary/30">
            <Clock className="w-3.5 h-3.5" />
            <span>{draggedLesson.students?.first_name} {draggedLesson.students?.last_name?.[0]}.</span>
            <span className="text-primary-foreground/70">{draggedLesson.start_time?.slice(0, 5)}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
