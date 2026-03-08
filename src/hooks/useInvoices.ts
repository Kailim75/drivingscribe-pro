import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "@/hooks/use-toast";

export function useInvoices() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();
  const { log } = useAuditLog();

  const invoicesQuery = useQuery({
    queryKey: ["invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_lines(*), students(first_name, last_name)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      number: string;
      type: "devis" | "facture";
      student_id: string;
      status?: string;
      total_ht: number;
      tva_amount: number;
      total_ttc: number;
      issue_date: string;
      due_date: string;
      notes?: string;
      converted_from_id?: string;
      lines: { description: string; quantity: number; unit_price: number; total_ht: number }[];
    }) => {
      const { lines, ...invoiceData } = input;
      const insertData = {
        ...invoiceData,
        organization_id: orgId!,
        remaining_amount: input.total_ttc,
      } as any;
      const { data, error } = await supabase
        .from("invoices")
        .insert(insertData)
        .select()
        .single();
      if (error) throw error;

      if (lines.length > 0) {
        const { error: linesError } = await supabase
          .from("invoice_lines")
          .insert(lines.map((l) => ({ ...l, invoice_id: data.id })));
        if (linesError) throw linesError;
      }
      return data;
    },
    onSuccess: (data, input) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: input.type === "devis" ? "Devis créé" : "Facture créée", entity: "invoice", entity_id: data.id, details: `${input.number} — ${input.total_ttc} € TTC` });
      toast({ title: input.type === "devis" ? "Devis créé" : "Facture créée" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de créer le document", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; status?: string; paid_amount?: number; remaining_amount?: number; notes?: string }) => {
      const { error } = await supabase.from("invoices").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (input.status) {
        log({ action: "Statut facture modifié", entity: "invoice", entity_id: input.id, details: `→ ${input.status}` });
      }
    },
  });

  const convertToInvoice = useMutation({
    mutationFn: async (devisId: string) => {
      const devis = invoicesQuery.data?.find((i) => i.id === devisId);
      if (!devis) throw new Error("Devis introuvable");

      // Get next invoice number
      const { data: org } = await supabase
        .from("organizations")
        .select("invoice_prefix, invoice_next_number")
        .eq("id", orgId!)
        .single();

      const number = `${org?.invoice_prefix || "F"}-${new Date().getFullYear()}-${String(org?.invoice_next_number || 1).padStart(3, "0")}`;

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          organization_id: orgId!,
          number,
          type: "facture" as const,
          student_id: devis.student_id,
          status: "brouillon" as const,
          total_ht: devis.total_ht,
          tva_amount: devis.tva_amount,
          total_ttc: devis.total_ttc,
          remaining_amount: devis.total_ttc,
          issue_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
          converted_from_id: devisId,
          notes: devis.notes,
        })
        .select()
        .single();
      if (error) throw error;

      // Copy lines
      const lines = devis.invoice_lines || [];
      if (lines.length > 0) {
        await supabase.from("invoice_lines").insert(
          lines.map((l: any) => ({ invoice_id: data.id, description: l.description, quantity: l.quantity, unit_price: l.unit_price, total_ht: l.total_ht }))
        );
      }

      // Update devis status
      await supabase.from("invoices").update({ status: "archivé" as const }).eq("id", devisId);

      // Increment invoice number
      await supabase.from("organizations").update({ invoice_next_number: (org?.invoice_next_number || 1) + 1 }).eq("id", orgId!);

      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Devis converti en facture", entity: "invoice", entity_id: data.id, details: data.number });
      toast({ title: "Devis converti en facture" });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),
  });

  return { invoices: invoicesQuery.data || [], isLoading: invoicesQuery.isLoading, create, update, convertToInvoice, remove };
}
