import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

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
    mutationFn: async (input: Omit<TablesInsert<"vehicles">, "organization_id">) => {
      const { error } = await supabase.from("vehicles").insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule créé"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TablesUpdate<"vehicles">) => {
      const { data, error } = await supabase.from("vehicles").update(input).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const update: TablesUpdate<"vehicles"> = { status: "archive" };
      const { error } = await supabase.from("vehicles").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vehicles"] }); toast.success("Véhicule archivé"); },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  return { ...query, vehicles: query.data ?? [], create, update, archive };
}
