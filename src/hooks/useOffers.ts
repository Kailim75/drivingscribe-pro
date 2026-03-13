import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type OfferType = Database["public"]["Enums"]["offer_type"];

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
    mutationFn: async (input: {
      name: string;
      type?: OfferType;
      price?: number;
      hours?: number | null;
      tva_rate?: number;
      deposit_percent?: number;
      cancellation_policy?: string;
      activity_type?: string;
      active?: boolean;
    }) => {
      const { error } = await supabase.from("offers").insert({
        name: input.name,
        type: input.type ?? "heure",
        price: input.price,
        hours: input.hours,
        tva_rate: input.tva_rate,
        deposit_percent: input.deposit_percent,
        cancellation_policy: input.cancellation_policy,
        activity_type: input.activity_type,
        active: input.active,
        organization_id: orgId!,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre créée"); },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TablesUpdate<"offers">) => {
      const { data, error } = await supabase.from("offers").update(input).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre mise à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("offers").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["offers"] }); toast.success("Offre désactivée"); },
    onError: () => toast.error("Erreur lors de la désactivation"),
  });

  return { ...query, offers: query.data ?? [], create, update, archive };
}
