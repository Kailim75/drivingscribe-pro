import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Mail, MapPin, Edit2, Loader2, Clock, CalendarDays, MessageCircle, AlertTriangle, Star, Target, FileText, FolderOpen, Download, Plus, Upload } from "lucide-react";
import { useState } from "react";
import { useStudents } from "@/hooks/useStudents";
import { useStudentFormulas } from "@/hooks/useStudentFormulas";
import { useLessons } from "@/hooks/useLessons";
import { useSkillCategories, useSkillEvaluations } from "@/hooks/useSkills";
import { useInvoices } from "@/hooks/useInvoices";
import { useDocuments } from "@/hooks/useDocuments";
import { computeHealthScore } from "@/hooks/useStudentHealthScore";
import StudentHealthBadge from "@/components/students/StudentHealthBadge";
import { studentStatusLabels, studentStatusColors, activityTypeLabels, lessonStatusLabels, lessonStatusColors, offerTypeLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import StudentFormDialog from "@/components/students/StudentFormDialog";
import SkillRadarChart from "@/components/students/SkillRadarChart";
import SkillEvaluationDialog from "@/components/students/SkillEvaluationDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

const statusConfig: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-muted text-muted-foreground" },
  envoyé: { label: "Envoyé", color: "bg-info/10 text-info" },
  partiellement_payé: { label: "Partiel", color: "bg-warning/10 text-warning" },
  payé: { label: "Payé", color: "bg-success/10 text-success" },
  en_retard: { label: "En retard", color: "bg-destructive/10 text-destructive" },
  annulé: { label: "Annulé", color: "bg-muted text-muted-foreground" },
  archivé: { label: "Archivé", color: "bg-muted text-muted-foreground" },
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, isLoading, update } = useStudents();
  const { formulas } = useStudentFormulas(id);
  const { lessons } = useLessons({ studentId: id });
  const { invoices } = useInvoices();
  const { documents, getDownloadUrl } = useDocuments();
  const [showEdit, setShowEdit] = useState(false);
  const [showEval, setShowEval] = useState(false);
  const { categories } = useSkillCategories();
  const { evaluations, evaluate } = useSkillEvaluations(id);
  const [activeTab, setActiveTab] = useState("overview");

  const student = students.find((s) => s.id === id);

  // Filter invoices and documents for this student
  const studentInvoices = invoices.filter((inv) => inv.student_id === id);
  const studentDocuments = documents.filter((doc) => doc.student_id === id);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  if (!student) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Élève introuvable</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/eleves")}>Retour</Button>
      </div>
    );
  }

  const activeFormulas = formulas.filter((f) => f.active);
  const totalHoursBought = formulas.reduce((s, f) => s + Number(f.hours_bought), 0);
  const healthScore = computeHealthScore(lessons, formulas, evaluations, categories.length);
  const completedLessons = lessons.filter((l: any) => l.status === "effectue");
  const plannedLessons = lessons.filter((l: any) => l.status === "prevu");
  const totalHoursDone = completedLessons.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
  const totalHoursPlanned = plannedLessons.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
  const totalHoursRemaining = totalHoursBought - totalHoursDone;

  const handleUpdate = (data: any) => {
    update.mutate({ id: student.id, ...data }, { onSuccess: () => setShowEdit(false) });
  };

  const handleDownloadDoc = async (filePath: string, name: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) window.open(url, "_blank");
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1000px] mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/eleves")} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="page-title">{student.first_name} {student.last_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn("status-badge", studentStatusColors[student.status])}>{studentStatusLabels[student.status]}</span>
            <StudentHealthBadge score={healthScore} />
            <span className="text-sm text-muted-foreground">{activityTypeLabels[student.activity_type]}</span>
          </div>
        </div>
        {student.phone && (
          <button onClick={() => { const cleaned = student.phone.replace(/[\s\-().]/g, ""); const phone = cleaned.startsWith("+") ? cleaned : cleaned.startsWith("0") && cleaned.length === 10 ? "+33" + cleaned.slice(1) : cleaned; window.open(`https://wa.me/${phone.replace("+", "")}`, "_blank"); }} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </button>
        )}
        <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
          <Edit2 className="w-4 h-4 mr-1" /> Modifier
        </Button>
      </div>

      {/* Contact info */}
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {student.phone && (<div className="flex items-center gap-2.5 text-sm"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Phone className="w-4 h-4 text-muted-foreground" /></div><span className="text-foreground">{student.phone}</span></div>)}
        {student.email && (<div className="flex items-center gap-2.5 text-sm"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><Mail className="w-4 h-4 text-muted-foreground" /></div><span className="text-foreground">{student.email}</span></div>)}
        {student.address && (<div className="flex items-center gap-2.5 text-sm"><div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center"><MapPin className="w-4 h-4 text-muted-foreground" /></div><span className="text-foreground">{student.address}</span></div>)}
      </motion.div>

      {/* Alert low hours */}
      {totalHoursBought > 0 && totalHoursRemaining <= 3 && (
        <div className={cn("flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium", totalHoursRemaining <= 0 ? "bg-destructive/8 text-destructive border border-destructive/15" : "bg-warning/8 text-warning border border-warning/15")}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {totalHoursRemaining <= 0 ? "Forfait épuisé — Proposez un renouvellement de formule" : `Plus que ${totalHoursRemaining}h restantes — Pensez à proposer un renouvellement`}
        </div>
      )}

      {/* Hours summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-2xl font-bold text-foreground">{totalHoursBought}h</p><p className="text-xs text-muted-foreground mt-1">Achetées</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className="text-2xl font-bold text-success">{totalHoursDone}h</p><p className="text-xs text-muted-foreground mt-1">Réalisées</p></div>
        <div className="glass-card rounded-xl p-4 text-center"><p className={cn("text-2xl font-bold", totalHoursRemaining <= 3 ? "text-warning" : "text-foreground")}>{totalHoursRemaining}h</p><p className="text-xs text-muted-foreground mt-1">Restantes</p></div>
      </div>

      {/* Tabs: Overview / Factures / Documents */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview"><CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Suivi</TabsTrigger>
          <TabsTrigger value="invoices"><FileText className="w-3.5 h-3.5 mr-1.5" /> Factures ({studentInvoices.length})</TabsTrigger>
          <TabsTrigger value="documents"><FolderOpen className="w-3.5 h-3.5 mr-1.5" /> Documents ({studentDocuments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5 mt-4">
          {/* Formulas */}
          <div className="glass-card rounded-xl">
            <div className="px-4 py-3 border-b border-border"><h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Clock className="w-4 h-4" /> Formules</h2></div>
            <div className="p-4">
              {formulas.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">Aucune formule</p>) : (
                <div className="space-y-2">
                  {formulas.map((f) => {
                    const fLessons = lessons.filter((l: any) => l.formula_id === f.id && l.status === "effectue");
                    const done = fLessons.reduce((s: number, l: any) => s + Number(l.duration_hours), 0);
                    const remaining = Number(f.hours_bought) - done;
                    const progress = Number(f.hours_bought) > 0 ? (done / Number(f.hours_bought)) * 100 : 0;
                    return (
                      <div key={f.id} className="p-3 rounded-lg bg-muted/40 border border-border/60">
                        <div className="flex items-center justify-between mb-2">
                          <div><p className="text-sm font-medium text-foreground">{f.offer_name}</p><p className="text-xs text-muted-foreground">{offerTypeLabels[f.offer_type]} · {f.active ? "Active" : "Inactive"}</p></div>
                          <div className="text-right"><p className="text-sm font-semibold text-foreground">{done}/{f.hours_bought}h</p><p className={cn("text-xs", remaining <= 3 && remaining > 0 ? "text-warning" : "text-muted-foreground")}>Reste {remaining}h</p></div>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden"><div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Recent lessons */}
          <div className="glass-card rounded-xl">
            <div className="px-4 py-3 border-b border-border"><h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><CalendarDays className="w-4 h-4" /> Séances récentes</h2></div>
            <div className="p-4">
              {lessons.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-4">Aucune séance</p>) : (
                <div className="space-y-1">
                  {lessons.slice(0, 10).map((l: any) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-center w-14"><p className="text-xs font-medium text-foreground">{new Date(l.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p><p className="text-[10px] text-muted-foreground">{l.start_time?.slice(0, 5)}</p></div>
                        <div><p className="text-sm text-foreground">{l.instructors?.first_name} {l.instructors?.last_name}</p><p className="text-xs text-muted-foreground">{l.vehicles?.brand} {l.vehicles?.model} · {l.duration_hours}h</p></div>
                      </div>
                      <span className={cn("status-badge", lessonStatusColors[l.status])}>{lessonStatusLabels[l.status]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Skill Progression Radar */}
          <div className="glass-card rounded-xl">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground flex items-center gap-2 text-sm"><Target className="w-4 h-4" /> Progression des compétences</h2>
              <Button variant="outline" size="sm" onClick={() => setShowEval(true)} disabled={categories.length === 0}><Star className="w-3.5 h-3.5 mr-1" /> Évaluer</Button>
            </div>
            <div className="p-4"><SkillRadarChart categories={categories} evaluations={evaluations} /></div>
          </div>

          {/* Notes */}
          {student.notes && (
            <div className="glass-card rounded-xl p-4">
              <h2 className="font-semibold text-foreground mb-2 text-sm">Notes</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{student.notes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => navigate(`/facturation?student_id=${student.id}&action=create`)}>
              <Plus className="w-4 h-4 mr-1" /> Créer une facture
            </Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            {studentInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-sm">Aucune facture pour cet élève</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead><tr><th>N°</th><th>Type</th><th>Date</th><th className="text-right">Montant TTC</th><th className="text-right">Reste dû</th><th>Statut</th></tr></thead>
                  <tbody>
                    {studentInvoices.map((inv) => {
                      const cfg = statusConfig[inv.status] || statusConfig.brouillon;
                      return (
                        <tr key={inv.id}>
                          <td className="font-mono text-xs font-medium text-foreground">{inv.number}</td>
                          <td className="text-xs text-muted-foreground capitalize">{inv.type}</td>
                          <td className="text-xs text-muted-foreground">{formatDate(inv.issue_date)}</td>
                          <td className="text-right font-semibold text-foreground">{formatEur(inv.total_ttc)}</td>
                          <td className="text-right"><span className={cn("text-xs font-medium", inv.remaining_amount > 0 ? "text-destructive" : "text-success")}>{formatEur(inv.remaining_amount)}</span></td>
                          <td><Badge variant="outline" className={cn("text-[11px] font-medium border", cfg.color)}>{cfg.label}</Badge></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => navigate(`/documents?student_id=${student.id}&action=upload`)}>
              <Upload className="w-4 h-4 mr-1" /> Ajouter un document
            </Button>
          </div>
          <div className="glass-card rounded-xl overflow-hidden">
            {studentDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FolderOpen className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-sm">Aucun document pour cet élève</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead><tr><th>Nom</th><th>Type</th><th>Taille</th><th>Date</th><th className="w-10"></th></tr></thead>
                  <tbody>
                    {studentDocuments.map((doc) => (
                      <tr key={doc.id}>
                        <td className="font-medium text-foreground">{doc.name}</td>
                        <td className="text-xs text-muted-foreground">{doc.type}</td>
                        <td className="text-xs text-muted-foreground">{doc.file_size}</td>
                        <td className="text-xs text-muted-foreground">{formatDate(doc.created_at)}</td>
                        <td>
                          <button onClick={() => handleDownloadDoc(doc.file_path, doc.name)} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <StudentFormDialog open={showEdit} onClose={() => setShowEdit(false)} onSubmit={handleUpdate} loading={update.isPending} initial={student} />
      <SkillEvaluationDialog open={showEval} onClose={() => setShowEval(false)} categories={categories} onSubmit={(evals) => { evaluate.mutate({ student_id: student.id, evaluations: evals }, { onSuccess: () => setShowEval(false) }); }} loading={evaluate.isPending} />
    </div>
  );
}
