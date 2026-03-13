import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];
type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];

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

      // Update invoice paid_amount & remaining_amount
      if (input.invoice_id) {
        const { data: inv } = await supabase.from("invoices").select("paid_amount, total_ttc").eq("id", input.invoice_id).single();
        if (inv) {
          const newPaid = (inv.paid_amount || 0) + input.amount;
          const newRemaining = inv.total_ttc - newPaid;
          const newStatus: InvoiceStatus | undefined = newRemaining <= 0 ? "payé" : newPaid > 0 ? "partiellement_payé" : undefined;
          const updateData: TablesUpdate<"invoices"> = {
            paid_amount: newPaid,
            remaining_amount: Math.max(0, newRemaining),
            ...(newStatus ? { status: newStatus } : {}),
          };
          await supabase.from("invoices").update(updateData).eq("id", input.invoice_id);
        }
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

  return { payments: paymentsQuery.data || [], isLoading: paymentsQuery.isLoading, create };
}
