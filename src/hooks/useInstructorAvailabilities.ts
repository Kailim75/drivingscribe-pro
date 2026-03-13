import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface Availability {
  id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export function useInstructorAvailabilities(instructorId?: string) {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["instructor_availabilities", orgId, instructorId],
    queryFn: async () => {
      let q = supabase
        .from("instructor_availabilities")
        .select("*")
        .eq("organization_id", orgId!)
        .order("day_of_week")
        .order("start_time");
      if (instructorId) q = q.eq("instructor_id", instructorId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Availability[];
    },
    enabled: !!orgId,
  });

  const upsertSlots = useMutation({
    mutationFn: async (input: { instructor_id: string; slots: { day_of_week: number; start_time: string; end_time: string }[] }) => {
      // Delete existing then insert new
      const { error: delError } = await supabase
        .from("instructor_availabilities")
        .delete()
        .eq("instructor_id", input.instructor_id)
        .eq("organization_id", orgId!);
      if (delError) throw delError;

      if (input.slots.length > 0) {
        const rows = input.slots.map((s) => ({
          organization_id: orgId!,
          instructor_id: input.instructor_id,
          ...s,
        }));
        const { error } = await supabase.from("instructor_availabilities").insert(rows);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["instructor_availabilities"] });
      toast.success("Disponibilités enregistrées");
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  return { ...query, availabilities: query.data ?? [], upsertSlots };
}
