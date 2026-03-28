import { motion } from "framer-motion";
import { Bell, Plus, Clock, CheckCircle2, XCircle, Mail, Loader2, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useReminders } from "@/hooks/useReminders";
import { useStudents } from "@/hooks/useStudents";
import { useInvoices } from "@/hooks/useInvoices";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  planifié: { label: "Planifié", color: "bg-info/10 text-info", icon: Clock },
  envoyé: { label: "Envoyé", color: "bg-success/10 text-success", icon: CheckCircle2 },
  échoué: { label: "Échoué", color: "bg-destructive/10 text-destructive", icon: XCircle },
};

const typeLabels: Record<string, string> = {
  séance: "Rappel séance",
  impayé: "Relance impayé",
  document: "Rappel document",
  autre: "Autre",
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Reminders() {
  const { reminders, isLoading, create, markSent } = useReminders();
  const { students } = useStudents();
  const { invoices } = useInvoices();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: "séance", student_id: "", invoice_id: "", message: "", scheduled_at: new Date().toISOString().split("T")[0] });

  const planned = reminders.filter((r) => r.status === "planifié");
  const sent = reminders.filter((r) => r.status !== "planifié");

  const handleSubmit = () => {
    if (!form.message) return;
    create.mutate({
      type: form.type as "séance" | "impayé" | "document" | "autre",
      student_id: form.student_id || undefined,
      invoice_id: form.invoice_id || undefined,
      message: form.message,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
    }, { onSuccess: () => setDialogOpen(false) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Rappels & Relances</h1>
          <p className="page-subtitle">{planned.length} planifié{planned.length > 1 ? "s" : ""} · {sent.length} envoyé{sent.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setForm({ type: "séance", student_id: "", invoice_id: "", message: "", scheduled_at: new Date().toISOString().split("T")[0] }); setDialogOpen(true); }} className="btn-primary">
          <Plus className="w-4 h-4" /> Nouveau rappel
        </button>
      </div>

      {planned.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">À envoyer</h2>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {planned.map((rem) => <ReminderCard key={rem.id} reminder={rem} onSend={() => markSent.mutate(rem.id)} />)}
          </motion.div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Historique</h2>
        <div className="space-y-2">
          {sent.length === 0 && (
            <div className="glass-card rounded-xl py-12 flex flex-col items-center text-muted-foreground">
              <Bell className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-sm">Aucun rappel envoyé</p>
            </div>
          )}
          {sent.map((rem) => <ReminderCard key={rem.id} reminder={rem} />)}
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 border-dashed">
        <p className="text-xs text-muted-foreground text-center">📧 Email disponible · 📱 WhatsApp disponible (lien direct)</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau rappel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="séance">Rappel séance</option>
                <option value="impayé">Relance impayé</option>
                <option value="document">Rappel document</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <Label>Élève (optionnel)</Label>
              <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Aucun</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            {form.type === "impayé" && (
              <div>
                <Label>Facture</Label>
                <select value={form.invoice_id} onChange={(e) => setForm((f) => ({ ...f, invoice_id: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Aucune</option>
                  {invoices.filter((i) => i.remaining_amount > 0).map((i) => <option key={i.id} value={i.id}>{i.number}</option>)}
                </select>
              </div>
            )}
            <div>
              <Label>Date d'envoi</Label>
              <Input type="date" value={form.scheduled_at} onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Message</Label>
              <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none" placeholder="Contenu du rappel..." />
            </div>
            <button onClick={handleSubmit} disabled={create.isPending} className="w-full btn-primary justify-center">
              {create.isPending ? "Création..." : "Créer le rappel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("0") && cleaned.length === 10) return "+33" + cleaned.slice(1);
  return cleaned;
}

function ReminderCard({ reminder, onSend }: { reminder: any; onSend?: () => void }) {
  const cfg = statusConfig[reminder.status] || statusConfig.planifié;
  const Icon = cfg.icon;
  const studentName = reminder.students ? `${reminder.students.first_name} ${reminder.students.last_name}` : null;
  const studentPhone = reminder.students?.phone;

  const handleWhatsApp = () => {
    if (!studentPhone) return;
    const phone = formatPhone(studentPhone);
    const text = encodeURIComponent(reminder.message || "");
    window.open(`https://wa.me/${phone.replace("+", "")}?text=${text}`, "_blank");
  };

  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-4 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="status-badge rounded-md bg-accent text-accent-foreground">
            {typeLabels[reminder.type] || reminder.type}
          </span>
          <span className={cn("status-badge rounded-md", cfg.color)}>{cfg.label}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Mail className="w-3 h-3" />Email</span>
        </div>
        <p className="text-sm text-foreground mt-1.5">{reminder.message}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {studentName && <span className="font-medium">{studentName}</span>}
          <span>{reminder.sent_at ? `Envoyé le ${formatDate(reminder.sent_at)}` : `Prévu le ${formatDate(reminder.scheduled_at)}`}</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {studentPhone && (
          <button onClick={handleWhatsApp} title="Envoyer par WhatsApp" className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors font-medium">
            <MessageCircle className="w-3 h-3" /> WhatsApp
          </button>
        )}
        {reminder.status === "planifié" && onSend && (
          <button onClick={onSend} className="flex-shrink-0 btn-secondary text-xs !px-3 !py-1.5" title="Marquer ce rappel comme envoyé manuellement">
            <CheckCircle2 className="w-3 h-3" /> Marquer envoyé
          </button>
        )}
      </div>
    </div>
  );
}