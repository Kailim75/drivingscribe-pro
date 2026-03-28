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

  const checkDuplicate = async (firstName: string, lastName: string, excludeId?: string): Promise<boolean> => {
    if (!orgId) return false;
    const { data } = await supabase
      .from("students")
      .select("id, first_name, last_name, status")
      .eq("organization_id", orgId)
      .ilike("first_name", firstName.trim())
      .ilike("last_name", lastName.trim())
      .neq("status", "archive");
    const matches = (data || []).filter((s) => !excludeId || s.id !== excludeId);
    return matches.length > 0;
  };

  const create = useMutation({
    mutationFn: async (input: Omit<TablesInsert<"students">, "organization_id"> & { _skipDuplicateCheck?: boolean }) => {
      const { _skipDuplicateCheck, ...studentInput } = input;
      if (!_skipDuplicateCheck) {
        const isDup = await checkDuplicate(studentInput.first_name, studentInput.last_name);
        if (isDup) {
          throw new Error("DUPLICATE_STUDENT");
        }
      }
      const { data, error } = await supabase.from("students").insert({ ...studentInput, organization_id: orgId! }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (student) => {
      qc.invalidateQueries({ queryKey: ["students"] });
      toast.success("Élève créé");

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
        } catch (err) {
          console.warn("Webhook failed:", err);
        }
      }
    },
    onError: (err: Error) => {
      if (err.message !== "DUPLICATE_STUDENT") {
        toast.error("Erreur lors de la création");
      }
    },
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
