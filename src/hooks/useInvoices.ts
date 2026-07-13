import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type InvoiceStatus = Database["public"]["Enums"]["invoice_status"];
type InvoiceType = Database["public"]["Enums"]["invoice_type"];

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
        .select("*, invoice_lines(*), students(first_name, last_name), payers(name)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      number: string;
      type: InvoiceType;
      student_id: string;
      status?: InvoiceStatus;
      total_ht: number;
      tva_amount: number;
      total_ttc: number;
      issue_date: string;
      due_date: string;
      notes?: string;
      converted_from_id?: string;
      lines: { description: string; quantity: number; unit_price: number; total_ht: number }[];
      offer_formula?: { offer_id: string; offer_name: string; offer_type: string; hours_bought: number; total_price: number };
    }) => {
      const { lines, offer_formula, ...invoiceData } = input;
      const { data, error } = await supabase
        .from("invoices")
        .insert({
          ...invoiceData,
          organization_id: orgId!,
          remaining_amount: input.total_ttc,
        })
        .select()
        .single();
      if (error) throw error;

      if (lines.length > 0) {
        const { error: linesError } = await supabase
          .from("invoice_lines")
          .insert(lines.map((l) => ({ ...l, invoice_id: data.id })));
        if (linesError) {
          // Rollback the empty invoice — otherwise it becomes a shell that renders an empty PDF
          await supabase.from("invoices").delete().eq("id", data.id).eq("organization_id", orgId!);
          throw linesError;
        }
      }

      // Auto-create student formula for pack/forfait
      if (offer_formula) {
        const { error: formulaError } = await supabase.from("student_formulas").insert({
          organization_id: orgId!,
          student_id: input.student_id,
          offer_id: offer_formula.offer_id,
          offer_name: offer_formula.offer_name,
          offer_type: offer_formula.offer_type as any,
          hours_bought: offer_formula.hours_bought,
          total_price: offer_formula.total_price,
        });
        if (formulaError) console.error("Erreur création formule:", formulaError);
      }

      return data;
    },
    onSuccess: (data, input) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["student_formulas"] });
      log({ action: input.type === "devis" ? "Devis créé" : "Facture créée", entity: "invoice", entity_id: data.id, details: `${input.number} — ${input.total_ttc} € TTC` });
      toast.success(input.type === "devis" ? "Devis créé" : "Facture créée", { description: input.offer_formula ? "Formule élève créée automatiquement" : undefined });
    },
    onError: () => toast.error("Erreur", { description: "Impossible de créer le document" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & TablesUpdate<"invoices">) => {
      const { error } = await supabase.from("invoices").update(updates).eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      if (input.status) {
        log({ action: "Statut facture modifié", entity: "invoice", entity_id: input.id, details: `→ ${input.status}` });
      }
    },
  });

  const updateWithLines = useMutation({
    mutationFn: async ({ id, due_date, notes, lines }: {
      id: string;
      due_date: string;
      notes: string;
      lines: { description: string; quantity: number; unit_price: number; total_ht: number }[];
    }) => {
      const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
      const inv = invoicesQuery.data?.find((i) => i.id === id);
      const isFranchise = (organization as any)?.tva_regime === "franchise_en_base";
      const rate = isFranchise ? 0 : (inv && inv.total_ht > 0 ? (inv.tva_amount / inv.total_ht) * 100 : (organization?.tva_rate || 20));
      const tvaAmount = isFranchise ? 0 : totalHt * (rate / 100);
      const totalTtc = totalHt + tvaAmount;

      const { error } = await supabase
        .from("invoices")
        .update({
          due_date,
          notes,
          total_ht: totalHt,
          tva_amount: tvaAmount,
          total_ttc: totalTtc,
          remaining_amount: totalTtc - (inv?.paid_amount || 0),
        })
        .eq("id", id)
        .eq("organization_id", orgId!);
      if (error) throw error;

      await supabase.from("invoice_lines").delete().eq("invoice_id", id);
      if (lines.length > 0) {
        const { error: linesError } = await supabase
          .from("invoice_lines")
          .insert(lines.map((l) => ({ ...l, invoice_id: id })));
        if (linesError) throw linesError;
      }
    },
    onSuccess: (_, input) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Facture brouillon modifiée", entity: "invoice", entity_id: input.id, details: `${input.lines.length} lignes` });
      toast.success("Facture modifiée");
    },
    onError: () => toast.error("Erreur", { description: "Impossible de modifier la facture" }),
  });

  const convertToInvoice = useMutation({
    mutationFn: async (devisId: string) => {
      const devis = invoicesQuery.data?.find((i) => i.id === devisId);
      if (!devis) throw new Error("Devis introuvable");

      const { data: number, error: numErr } = await supabase.rpc("next_document_number", {
        _org_id: orgId!,
        _type: "facture",
      });
      if (numErr || !number) throw new Error("Impossible de générer le numéro de facture");

      const invoiceType: InvoiceType = "facture";
      const invoiceStatus: InvoiceStatus = "brouillon";
      const archiveStatus: InvoiceStatus = "archivé";

      const { data, error } = await supabase
        .from("invoices")
        .insert({
          organization_id: orgId!,
          number,
          type: invoiceType,
          student_id: devis.student_id,
          status: invoiceStatus,
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

      const lines = devis.invoice_lines || [];
      if (lines.length > 0) {
        const { error: linesError } = await supabase.from("invoice_lines").insert(
          lines.map((l) => ({ invoice_id: data.id, description: l.description, quantity: l.quantity, unit_price: l.unit_price, total_ht: l.total_ht }))
        );
        // Rollback the newly created invoice if lines fail — avoids archiving the devis with an incomplete invoice
        if (linesError) {
          await supabase.from("invoices").delete().eq("id", data.id).eq("organization_id", orgId!);
          throw linesError;
        }
      }

      // Only archive the devis AFTER lines are safely inserted
      const { error: archErr } = await supabase
        .from("invoices")
        .update({ status: archiveStatus })
        .eq("id", devisId)
        .eq("organization_id", orgId!);
      if (archErr) throw archErr;

      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      log({ action: "Devis converti en facture", entity: "invoice", entity_id: data.id, details: data.number });
      toast.success("Devis converti en facture");
    },
    onError: () => toast.error("Erreur", { description: "Impossible de convertir le devis" }),
  });

  const archive = useMutation({
    mutationFn: async (id: string) => {
      const status: InvoiceStatus = "archivé";
      const { error } = await supabase.from("invoices").update({ status }).eq("id", id).eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Document archivé");
    },
  });

  return { invoices: invoicesQuery.data || [], isLoading: invoicesQuery.isLoading, create, update, updateWithLines, convertToInvoice, archive };
}
