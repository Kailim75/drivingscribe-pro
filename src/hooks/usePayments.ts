import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";

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
      method: string;
      date: string;
      reference?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from("payments")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;

      // Update invoice paid_amount & remaining_amount
      if (input.invoice_id) {
        const { data: inv } = await supabase.from("invoices").select("paid_amount, total_ttc").eq("id", input.invoice_id).single();
        if (inv) {
          const newPaid = (inv.paid_amount || 0) + input.amount;
          const newRemaining = inv.total_ttc - newPaid;
          const newStatus = newRemaining <= 0 ? "payé" : newPaid > 0 ? "partiellement_payé" : undefined;
          await supabase.from("invoices").update({
            paid_amount: newPaid,
            remaining_amount: Math.max(0, newRemaining),
            ...(newStatus ? { status: newStatus as any } : {}),
          }).eq("id", input.invoice_id);
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
