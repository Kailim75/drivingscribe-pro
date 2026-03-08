import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function useVehicles() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["vehicles", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("organization_id", orgId!)
        .order("plate");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: { plate: string; brand?: string; model?: string; category?: string; monthly_cost?: number; notes?: string }) => {
      const { error } = await supabase.from("vehicles").insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Record<string, any>) => {
      const { error } = await supabase.from("vehicles").update(input).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule supprimé"); },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  return { ...query, vehicles: query.data ?? [], create, update, remove };
}
