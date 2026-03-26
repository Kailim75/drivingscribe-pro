import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export function usePayers() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["payers", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payers")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: { name: string; email?: string; phone?: string; address?: string; siret?: string; notes?: string }) => {
      const { data, error } = await supabase
        .from("payers")
        .insert({ ...input, organization_id: orgId! })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payers"] });
      toast.success("Tiers payeur créé");
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Record<string, any>) => {
      const { error } = await supabase
        .from("payers")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payers"] });
      toast.success("Tiers payeur mis à jour");
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payers")
        .update({ active: false })
        .eq("id", id)
        .eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payers"] });
      toast.success("Tiers payeur archivé");
    },
  });

  return {
    payers: query.data?.filter((p) => p.active) ?? [],
    allPayers: query.data ?? [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
  };
}
