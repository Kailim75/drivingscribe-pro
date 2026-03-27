import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];
type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

async function recalcInvoice(invoiceId: string) {
  // Get all payments for this invoice
  const { data: payments } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", invoiceId);
  const totalPaid = (payments || []).reduce((s, p) => s + p.amount, 0);

  const { data: inv } = await supabase
    .from("invoices")
    .select("total_ttc")
    .eq("id", invoiceId)
    .single();
  if (!inv) return;

  const remaining = inv.total_ttc - totalPaid;
  const newStatus: InvoiceStatus | undefined =
    remaining <= 0 ? "payé" : totalPaid > 0 ? "partiellement_payé" : undefined;

  const updateData: TablesUpdate<"invoices"> = {
    paid_amount: totalPaid,
    remaining_amount: Math.max(0, remaining),
    ...(newStatus ? { status: newStatus } : {}),
  };
  await supabase.from("invoices").update(updateData).eq("id", invoiceId);
}

export function usePayments() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();
  const { log } = useAuditLog();

  const paymentsQuery = useQuery({
    queryKey: ["payments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, students(first_name, last_name), invoices(number)")
        .eq("organization_id", orgId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      invoice_id?: string;
      student_id: string;
      amount: number;
      method: PaymentMethod;
      date: string;
      reference?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({
          student_id: input.student_id,
          amount: input.amount,
          method: input.method,
          date: input.date,
          reference: input.reference ?? "",
          notes: input.notes ?? "",
          invoice_id: input.invoice_id,
          organization_id: orgId!,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.invoice_id) {
        await recalcInvoice(input.invoice_id);
      }
      return data;
    },
    onSuccess: (data, input) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement enregistré", entity: "payment", entity_id: data.id, details: `${input.amount} € — ${input.method}` });
      toast({ title: "Paiement enregistré" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'enregistrer le paiement", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (input: {
      id: string;
      invoice_id?: string | null;
      student_id?: string;
      amount?: number;
      method?: PaymentMethod;
      date?: string;
      reference?: string;
      notes?: string;
      _old_invoice_id?: string | null;
    }) => {
      const { _old_invoice_id, id, ...rest } = input;
      const updateData: TablesUpdate<"payments"> = { ...rest };
      if (rest.invoice_id === undefined) delete updateData.invoice_id;

      const { data, error } = await supabase
        .from("payments")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", orgId!)
        .select()
        .single();
      if (error) throw error;

      // Recalc old and new invoices
      if (_old_invoice_id) await recalcInvoice(_old_invoice_id);
      if (data.invoice_id && data.invoice_id !== _old_invoice_id) await recalcInvoice(data.invoice_id);

      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement modifié", entity: "payment", entity_id: data.id });
      toast({ title: "Paiement modifié" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de modifier le paiement", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (payment: { id: string; invoice_id?: string | null }) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id)
        .eq("organization_id", orgId!);
      if (error) throw error;

      if (payment.invoice_id) {
        await recalcInvoice(payment.invoice_id);
      }
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement supprimé", entity: "payment", entity_id: input.id });
      toast({ title: "Paiement supprimé" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer le paiement", variant: "destructive" }),
  });

  return { payments: paymentsQuery.data || [], isLoading: paymentsQuery.isLoading, create, update, remove };
}
