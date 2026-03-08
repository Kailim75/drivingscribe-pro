import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, Clock, Users, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLessons } from "@/hooks/useLessons";
import { useStudents } from "@/hooks/useStudents";
import { useInstructors } from "@/hooks/useInstructors";
import { useVehicles } from "@/hooks/useVehicles";
import { lessonStatusLabels, lessonStatusColors } from "@/lib/labels";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const todayStr = new Date().toISOString().split("T")[0];
  const { lessons: todayLessons, isLoading: loadingLessons } = useLessons({ date: todayStr });
  const { lessons: allLessons } = useLessons();
  const { students, isLoading: loadingStudents } = useStudents();
  const { instructors } = useInstructors();
  const { vehicles } = useVehicles();

  const isLoading = loadingLessons || loadingStudents;

  const planned = allLessons.filter((l: any) => l.status === "prevu").length;
  const completed = allLessons.filter((l: any) => l.status === "effectue").length;
  const activeStudents = students.filter((s) => s.status === "actif").length;
  const activeInstructors = instructors.filter((i) => i.status === "actif").length;
  const activeVehicles = vehicles.filter((v) => v.status === "actif").length;

  const sorted = [...todayLessons].sort((a: any, b: any) => (a.start_time || "").localeCompare(b.start_time || ""));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const kpis = [
    { label: "Élèves actifs", value: activeStudents, icon: Users },
    { label: "Séances prévues", value: planned, icon: CalendarDays },
    { label: "Séances effectuées", value: completed, icon: CheckCircle2 },
    { label: "Formateurs actifs", value: activeInstructors, icon: Users },
    { label: "Véhicules actifs", value: activeVehicles, icon: Clock },
    { label: "Aujourd'hui", value: sorted.length, icon: CalendarDays },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* KPIs */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi) => (
          <motion.div key={kpi.label} variants={item} className="glass-card rounded-xl p-4 flex flex-col gap-2 hover:border-primary/20 transition-colors">
            <kpi.icon className="w-4 h-4 text-muted-foreground" />
            <p className="text-xl md:text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Today's lessons */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card rounded-xl">
        <div className="flex items-center justify-between p-4 pb-0">
          <h2 className="font-semibold text-foreground">Séances du jour</h2>
          <Link to="/planning" className="text-xs text-primary hover:underline flex items-center gap-1">
            Voir le planning <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="p-4">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CalendarDays className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-sm">Aucune séance aujourd'hui</p>
            </div>
          ) : (
            <div className="space-y-1">
              {sorted.map((session: any) => (
                <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="w-14 text-center flex-shrink-0">
                    <span className="text-sm font-semibold text-foreground">{session.start_time?.slice(0, 5)}</span>
                    <span className="block text-[10px] text-muted-foreground">{session.duration_hours}h</span>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {session.students?.first_name} {session.students?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session.vehicles?.brand} {session.vehicles?.model} · {session.instructors?.first_name} {session.instructors?.last_name}
                    </p>
                  </div>
                  <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", lessonStatusColors[session.status])}>
                    {lessonStatusLabels[session.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
