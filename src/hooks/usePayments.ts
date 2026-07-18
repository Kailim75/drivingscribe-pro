import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type PaymentMethod = Database["public"]["Enums"]["payment_method"];

// Les totaux de facture (payé / reste dû / statut) sont recalculés par le trigger
// trg_payments_recalc_invoice en base : aucun recalcul côté client.
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
      return data;
    },
    onSuccess: (data, input) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement enregistré", entity: "payment", entity_id: data.id, details: `${input.amount} € — ${input.method}` });
      toast.success("Paiement enregistré");
    },
    onError: () => toast.error("Erreur", { description: "Impossible d'enregistrer le paiement" }),
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
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement modifié", entity: "payment", entity_id: data.id });
      toast.success("Paiement modifié");
    },
    onError: () => toast.error("Erreur", { description: "Impossible de modifier le paiement" }),
  });

  const remove = useMutation({
    mutationFn: async (payment: { id: string; invoice_id?: string | null }) => {
      const { error } = await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id)
        .eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Paiement supprimé", entity: "payment", entity_id: input.id });
      toast.success("Paiement supprimé");
    },
    onError: () => toast.error("Erreur", { description: "Impossible de supprimer le paiement" }),
  });

  return { payments: paymentsQuery.data || [], isLoading: paymentsQuery.isLoading, create, update, remove };
}
