import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";

export function useDocuments() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();
  const { log } = useAuditLog();

  const documentsQuery = useQuery({
    queryKey: ["documents", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*, students(first_name, last_name), invoices(number)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const upload = useMutation({
    mutationFn: async (input: {
      file: File;
      name: string;
      type: string;
      student_id?: string;
      invoice_id?: string;
      notes?: string;
    }) => {
      const filePath = `${orgId}/${Date.now()}-${input.file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, input.file);
      if (uploadError) throw uploadError;

      const sizeKb = input.file.size / 1024;
      const fileSize = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${Math.round(sizeKb)} Ko`;

      const { data, error } = await supabase
        .from("documents")
        .insert({
          organization_id: orgId!,
          name: input.name,
          type: input.type,
          student_id: input.student_id || null,
          invoice_id: input.invoice_id || null,
          file_path: filePath,
          file_size: fileSize,
          notes: input.notes || "",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      log({ action: "Document ajouté", entity: "document", entity_id: data.id, details: data.name });
      toast({ title: "Document ajouté" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'ajouter le document", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      if (file_path) await supabase.storage.from("documents").remove([file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "Document supprimé" });
    },
  });

  const getDownloadUrl = async (filePath: string) => {
    const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
    return data?.signedUrl;
  };

  return { documents: documentsQuery.data || [], isLoading: documentsQuery.isLoading, upload, remove, getDownloadUrl };
}
