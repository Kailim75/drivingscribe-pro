import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";

export function useReminders() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();
  const { log } = useAuditLog();

  const remindersQuery = useQuery({
    queryKey: ["reminders", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*, students(first_name, last_name), invoices(number)")
        .eq("organization_id", orgId!)
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      type: string;
      channel?: string;
      student_id?: string;
      invoice_id?: string;
      message: string;
      scheduled_at: string;
    }) => {
      const { data, error } = await supabase
        .from("reminders")
        .insert({ ...input, organization_id: orgId! } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      log({ action: "Rappel créé", entity: "reminder", entity_id: data.id, details: data.message?.substring(0, 60) });
      toast({ title: "Rappel créé" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const markSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reminders").update({ status: "envoyé" as const, sent_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["reminders"] });
      log({ action: "Rappel envoyé", entity: "reminder", entity_id: id });
      toast({ title: "Rappel marqué comme envoyé" });
    },
  });

  return { reminders: remindersQuery.data || [], isLoading: remindersQuery.isLoading, create, markSent };
}
