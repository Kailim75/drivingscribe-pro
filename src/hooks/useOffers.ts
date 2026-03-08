import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function useOffers() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["offers", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; type?: string; price?: number; hours?: number | null; tva_rate?: number; deposit_percent?: number; cancellation_policy?: string; activity_type?: string; active?: boolean }) => {
      const { error } = await supabase.from("offers").insert({ ...input, organization_id: orgId! } as any);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre créée"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("offers").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre mise à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre supprimée"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return { ...query, offers: query.data ?? [], create, update, remove };
}
