import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface NotificationSettings {
  id: string;
  reminder_before_hours: number;
  notify_instructor_on_change: boolean;
  notify_student_on_change: boolean;
  auto_reminder_enabled: boolean;
}

export function useNotificationSettings() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notification_settings", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .eq("organization_id", orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as NotificationSettings | null;
    },
    enabled: !!orgId,
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<NotificationSettings>) => {
      if (query.data?.id) {
        const { error } = await supabase
          .from("notification_settings")
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq("id", query.data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("notification_settings")
          .insert({ organization_id: orgId!, ...input });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification_settings"] });
      toast.success("Paramètres de notifications enregistrés");
    },
    onError: () => toast.error("Erreur"),
  });

  return { settings: query.data, isLoading: query.isLoading, upsert };
}
