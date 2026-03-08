import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";

export function useAuditLog() {
  const { organization } = useOrg();
  const { user } = useAuth();

  const log = useMutation({
    mutationFn: async (input: { action: string; entity: string; entity_id?: string; details?: string }) => {
      if (!organization?.id) return;
      const { error } = await supabase.from("audit_logs").insert({
        ...input,
        organization_id: organization.id,
        user_id: user?.id,
        user_name: user?.user_metadata?.first_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}`.trim()
          : user?.email || "Système",
      });
      if (error) console.error("Audit log error:", error);
    },
  });

  return { log: log.mutate };
}
