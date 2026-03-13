import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export function useStudents() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["students", orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("organization_id", orgId!)
        .order("last_name");
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const create = useMutation({
    mutationFn: async (input: Omit<TablesInsert<"students">, "organization_id">) => {
      const { data, error } = await supabase.from("students").insert({ ...input, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (student) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Élève créé");

      // Fire webhook only for driving students
      if ((organization as any)?.webhook_url && student.activity_type === "auto_ecole") {
        try {
          await fetch((organization as any).webhook_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            mode: "no-cors",
            body: JSON.stringify({
              event: "student.created",
              timestamp: new Date().toISOString(),
              data: {
                id: student.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email: student.email,
                phone: student.phone,
                activity_type: student.activity_type,
              },
            }),
          });
          console.log("Webhook sent to", (organization as any).webhook_url);
        } catch (err) {
          console.warn("Webhook failed:", err);
        }
      }
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & TablesUpdate<"students">) => {
      const { data, error } = await supabase.from("students").update(input).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève mis à jour"); },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const upd: TablesUpdate<"students"> = { status: "archive" };
      const { error } = await supabase.from("students").update(upd).eq("id", id).eq("organization_id", orgId!).select().single();
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["students"] }); toast.success("Élève archivé"); },
    onError: () => toast.error("Erreur lors de l'archivage"),
  });

  return { ...query, students: query.data ?? [], create, update, archive };
}
