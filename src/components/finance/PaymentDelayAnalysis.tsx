import { useMemo } from "react";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isInvoiceOverdue } from "@/lib/labels";

interface Props {
  invoices: any[];
  payments: any[];
}

export default function PaymentDelayAnalysis({ invoices, payments }: Props) {
  const stats = useMemo(() => {
    const paidInvoices = invoices.filter(i => i.type === "facture" && i.status === "payé" && i.issue_date);

    // Calculate average delay between issue_date and full payment
    const delays: number[] = [];
    paidInvoices.forEach(inv => {
      const invPayments = payments.filter(p => p.invoice_id === inv.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (invPayments.length > 0) {
        const lastPayment = invPayments[0];
        const issueDate = new Date(inv.issue_date);
        const payDate = new Date(lastPayment.date);
        const days = Math.round((payDate.getTime() - issueDate.getTime()) / 86400000);
        if (days >= 0) delays.push(days);
      }
    });

    const avgDelay = delays.length > 0 ? delays.reduce((s, d) => s + d, 0) / delays.length : 0;
    const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;
    const under30 = delays.filter(d => d <= 30).length;
    const over30 = delays.filter(d => d > 30 && d <= 60).length;
    const over60 = delays.filter(d => d > 60).length;
    const total = delays.length || 1;

    const overdueInvoices = invoices.filter(i => isInvoiceOverdue(i));
    const overdueAmount = overdueInvoices.reduce((s, i) => s + Number(i.remaining_amount), 0);

    return { avgDelay: Math.round(avgDelay), maxDelay, under30Pct: (under30 / total) * 100, over30Pct: (over30 / total) * 100, over60Pct: (over60 / total) * 100, sampleSize: delays.length, overdueCount: overdueInvoices.length, overdueAmount };
  }, [invoices, payments]);

  return (
    <div className="glass-card rounded-xl p-5">
      <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" /> Délais de paiement
      </h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <p className={cn("text-2xl font-bold", stats.avgDelay <= 30 ? "text-success" : stats.avgDelay <= 45 ? "text-warning" : "text-destructive")}>{stats.avgDelay}j</p>
          <p className="text-[10px] text-muted-foreground">Délai moyen</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{stats.maxDelay}j</p>
          <p className="text-[10px] text-muted-foreground">Délai max</p>
        </div>
        <div className="text-center">
          <p className={cn("text-2xl font-bold", stats.overdueCount > 0 ? "text-destructive" : "text-success")}>{stats.overdueCount}</p>
          <p className="text-[10px] text-muted-foreground">En retard</p>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Répartition des paiements</p>
        <div className="h-4 bg-secondary rounded-full overflow-hidden flex">
          {stats.under30Pct > 0 && <div className="h-full bg-success transition-all" style={{ width: `${stats.under30Pct}%` }} />}
          {stats.over30Pct > 0 && <div className="h-full bg-warning transition-all" style={{ width: `${stats.over30Pct}%` }} />}
          {stats.over60Pct > 0 && <div className="h-full bg-destructive transition-all" style={{ width: `${stats.over60Pct}%` }} />}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-success" /> ≤30j ({stats.under30Pct.toFixed(0)}%)</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-warning" /> 30-60j ({stats.over30Pct.toFixed(0)}%)</span>
          <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-destructive" /> &gt;60j ({stats.over60Pct.toFixed(0)}%)</span>
        </div>
      </div>

      {stats.sampleSize === 0 && <p className="text-xs text-muted-foreground text-center mt-3 italic">Pas encore assez de données pour l'analyse</p>}
    </div>
  );
}
