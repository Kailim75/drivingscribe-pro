import { motion } from "framer-motion";
import { Bell, Plus, Send, Clock, CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
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
      type: form.type,
      student_id: form.student_id || undefined,
      invoice_id: form.invoice_id || undefined,
      message: form.message,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
    }, { onSuccess: () => setDialogOpen(false) });
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Rappels & Relances</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{planned.length} planifié{planned.length > 1 ? "s" : ""} · {sent.length} envoyé{sent.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { setForm({ type: "séance", student_id: "", invoice_id: "", message: "", scheduled_at: new Date().toISOString().split("T")[0] }); setDialogOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
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
        <p className="text-xs text-muted-foreground text-center">📧 Email disponible · 📱 SMS et WhatsApp prévus en v2</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nouveau rappel</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
                <option value="séance">Rappel séance</option>
                <option value="impayé">Relance impayé</option>
                <option value="document">Rappel document</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <Label>Élève (optionnel)</Label>
              <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
                <option value="">Aucun</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            {form.type === "impayé" && (
              <div>
                <Label>Facture</Label>
                <select value={form.invoice_id} onChange={(e) => setForm((f) => ({ ...f, invoice_id: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
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
              <textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border h-20 resize-none" placeholder="Contenu du rappel..." />
            </div>
            <button onClick={handleSubmit} disabled={create.isPending} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {create.isPending ? "Création..." : "Créer le rappel"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReminderCard({ reminder, onSend }: { reminder: any; onSend?: () => void }) {
  const cfg = statusConfig[reminder.status] || statusConfig.planifié;
  const Icon = cfg.icon;
  const studentName = reminder.students ? `${reminder.students.first_name} ${reminder.students.last_name}` : null;
  return (
    <div className="glass-card rounded-xl p-4 flex items-start gap-4 hover:border-primary/20 transition-colors">
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
            {typeLabels[reminder.type] || reminder.type}
          </span>
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", cfg.color)}>{cfg.label}</span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Mail className="w-3 h-3" />Email</span>
        </div>
        <p className="text-sm text-foreground mt-1.5">{reminder.message}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {studentName && <span>{studentName}</span>}
          <span>{reminder.sent_at ? `Envoyé le ${formatDate(reminder.sent_at)}` : `Prévu le ${formatDate(reminder.scheduled_at)}`}</span>
        </div>
      </div>
      {reminder.status === "planifié" && onSend && (
        <button onClick={onSend} className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
          <Send className="w-3 h-3" /> Envoyer
        </button>
      )}
    </div>
  );
}
