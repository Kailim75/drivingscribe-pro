import { motion } from "framer-motion";
import { Plus, Search, CreditCard, Banknote, Building2, FileText, Loader2, MoreHorizontal, Pencil, Trash2, Download } from "lucide-react";
import { useState, useMemo } from "react";
import { PaginationControls, usePagination } from "@/components/PaginationControls";
import DatePeriodFilter, { type Period, getDateRange } from "@/components/DatePeriodFilter";
import { usePayments } from "@/hooks/usePayments";
import { useInvoices } from "@/hooks/useInvoices";
import { useStudents } from "@/hooks/useStudents";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { exportToCsv } from "@/lib/exportCsv";

type PaymentMethod = "espèces" | "virement" | "carte" | "chèque";
const methodConfig: Record<PaymentMethod, { label: string; icon: React.ElementType; color: string }> = {
  espèces: { label: "Espèces", icon: Banknote, color: "bg-success/10 text-success" },
  virement: { label: "Virement", icon: Building2, color: "bg-info/10 text-info" },
  carte: { label: "Carte", icon: CreditCard, color: "bg-primary/10 text-primary" },
  chèque: { label: "Chèque", icon: FileText, color: "bg-muted text-muted-foreground" },
};

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Payments() {
  const { payments, isLoading, create, update, remove } = usePayments();
  const { invoices } = useInvoices();
  const { students } = useStudents();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [page, setPage] = useState(1);
  const range = useMemo(() => getDateRange(period), [period]);
  const [form, setForm] = useState({ student_id: "", invoice_id: "", amount: 0, method: "carte" as PaymentMethod, date: new Date().toISOString().split("T")[0], reference: "", notes: "" });

  // Smart payment: auto-select invoice & pre-fill amount when student changes
  const handleStudentChange = (studentId: string) => {
    const unpaid = invoices.filter((i) => i.student_id === studentId && i.type === "facture" && i.remaining_amount > 0);
    if (unpaid.length === 1) {
      setForm((f) => ({ ...f, student_id: studentId, invoice_id: unpaid[0].id, amount: unpaid[0].remaining_amount }));
    } else if (unpaid.length > 1) {
      const sorted = [...unpaid].sort((a, b) => a.due_date.localeCompare(b.due_date));
      setForm((f) => ({ ...f, student_id: studentId, invoice_id: sorted[0].id, amount: sorted[0].remaining_amount }));
    } else {
      setForm((f) => ({ ...f, student_id: studentId, invoice_id: "", amount: 0 }));
    }
  };

  const handleInvoiceChange = (invoiceId: string) => {
    if (invoiceId) {
      const inv = invoices.find((i) => i.id === invoiceId);
      setForm((f) => ({ ...f, invoice_id: invoiceId, amount: inv ? inv.remaining_amount : f.amount }));
    } else {
      setForm((f) => ({ ...f, invoice_id: "", amount: 0 }));
    }
  };

  const periodPayments = useMemo(() => payments.filter((p) => p.date >= range.start && p.date <= range.end), [payments, range]);

  const filtered = periodPayments.filter((p) => {
    const name = p.students ? `${p.students.first_name} ${p.students.last_name}` : "";
    return name.toLowerCase().includes(search.toLowerCase()) || p.reference.toLowerCase().includes(search.toLowerCase());
  });

  const totalReceived = periodPayments.reduce((s, p) => s + p.amount, 0);
  const methods = (Object.keys(methodConfig) as PaymentMethod[]);
  const totalByMethod = methods.map((m) => ({
    method: m,
    total: periodPayments.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0),
    count: periodPayments.filter((p) => p.method === m).length,
  }));

  const studentInvoices = invoices.filter((i) => i.student_id === form.student_id && i.type === "facture" && i.remaining_amount > 0);

  const openCreate = () => {
    setEditingPayment(null);
    setForm({ student_id: "", invoice_id: "", amount: 0, method: "carte", date: new Date().toISOString().split("T")[0], reference: "", notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditingPayment(p);
    setForm({
      student_id: p.student_id,
      invoice_id: p.invoice_id || "",
      amount: p.amount,
      method: p.method,
      date: p.date,
      reference: p.reference || "",
      notes: p.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.student_id || !form.amount) return;
    if (editingPayment) {
      update.mutate({
        id: editingPayment.id,
        student_id: form.student_id,
        invoice_id: form.invoice_id || null,
        amount: form.amount,
        method: form.method,
        date: form.date,
        reference: form.reference,
        notes: form.notes,
        _old_invoice_id: editingPayment.invoice_id,
      }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate({
        student_id: form.student_id,
        invoice_id: form.invoice_id || undefined,
        amount: form.amount,
        method: form.method,
        date: form.date,
        reference: form.reference,
        notes: form.notes,
      }, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id, invoice_id: deleteTarget.invoice_id }, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const handleExport = () => {
    exportToCsv("paiements.csv",
      ["Date", "Élève", "Facture", "Mode", "Montant", "Référence", "Notes"],
      filtered.map((p) => [
        p.date,
        p.students ? `${p.students.first_name} ${p.students.last_name}` : "",
        p.invoices?.number || "",
        methodConfig[p.method as PaymentMethod]?.label || p.method,
        p.amount,
        p.reference,
        p.notes,
      ])
    );
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Paiements</h1>
          <p className="page-subtitle">{periodPayments.length} paiements · {formatEur(totalReceived)} encaissés</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <DatePeriodFilter value={period} onChange={setPeriod} />
          <button onClick={handleExport} className="btn-secondary" title="Exporter CSV">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" /> Enregistrer un paiement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {totalByMethod.map(({ method, total, count }) => {
          const cfg = methodConfig[method];
          const Icon = cfg.icon;
          return (
            <div key={method} className="glass-card rounded-xl p-4 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{formatEur(total)}</p>
                <p className="text-xs text-muted-foreground">{cfg.label} · {count}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un paiement..." className="w-full bg-card text-foreground text-sm pl-9 pr-4 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground transition-shadow" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Élève</th>
                <th className="hidden md:table-cell">Facture</th>
                <th className="hidden sm:table-cell">Mode</th>
                <th className="text-right">Montant</th>
                <th className="hidden lg:table-cell">Référence</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {usePagination(filtered, page).paginated.map((p) => {
                const cfg = methodConfig[p.method as PaymentMethod] || methodConfig.carte;
                const studentName = p.students ? `${p.students.first_name} ${p.students.last_name}` : "—";
                const invNumber = p.invoices?.number || "—";
                return (
                  <tr key={p.id}>
                    <td className="text-xs text-muted-foreground">{formatDate(p.date)}</td>
                    <td className="font-medium text-foreground">{studentName}</td>
                    <td className="font-mono text-xs text-muted-foreground hidden md:table-cell">{invNumber}</td>
                    <td className="hidden sm:table-cell">
                      <span className={cn("status-badge rounded-md", cfg.color)}>{cfg.label}</span>
                    </td>
                    <td className="text-right font-semibold text-success">{formatEur(p.amount)}</td>
                    <td className="font-mono text-xs text-muted-foreground hidden lg:table-cell">{p.reference}</td>
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 rounded hover:bg-muted">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(p)}>
                            <Pencil className="w-3.5 h-3.5 mr-2" /> Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-destructive">
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CreditCard className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">Aucun paiement trouvé</p>
          </div>
        )}
        <PaginationControls page={page} total={filtered.length} onChange={setPage} />
      </motion.div>

      {/* Create/Edit Payment dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Modifier le paiement" : "Enregistrer un paiement"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Élève</Label>
              <select value={form.student_id} onChange={(e) => handleStudentChange(e.target.value)} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                <option value="">Sélectionner...</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
              </select>
            </div>
            {studentInvoices.length > 0 && (
              <div>
                <Label>Facture (optionnel)</Label>
                <select value={form.invoice_id} onChange={(e) => handleInvoiceChange(e.target.value)} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  <option value="">Sans facture</option>
                  {studentInvoices.map((i) => <option key={i.id} value={i.id}>{i.number} — reste {formatEur(i.remaining_amount)}</option>)}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Montant</Label>
                <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))} className="mt-1" />
              </div>
              <div>
                <Label>Mode</Label>
                <select value={form.method} onChange={(e) => setForm((f) => ({ ...f, method: e.target.value as PaymentMethod }))} className="w-full mt-1 bg-card text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
                  {methods.map((m) => <option key={m} value={m}>{methodConfig[m].label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Référence</Label>
                <Input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>
            <button onClick={handleSubmit} disabled={create.isPending || update.isPending} className="w-full btn-primary justify-center">
              {(create.isPending || update.isPending) ? "Enregistrement..." : editingPayment ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce paiement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le paiement de {deleteTarget ? formatEur(deleteTarget.amount) : ""} sera supprimé et les montants de la facture liée seront recalculés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
