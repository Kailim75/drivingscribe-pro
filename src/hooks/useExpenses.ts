import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "@/hooks/use-toast";
import type { Database, TablesUpdate } from "@/integrations/supabase/types";

type ExpenseType = Database["public"]["Enums"]["expense_type"];

export function useExpenses() {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*, vehicles(brand, model, plate), instructors(first_name, last_name)")
        .eq("organization_id", orgId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (input: {
      category: string;
      description: string;
      amount: number;
      type: ExpenseType;
      date: string;
      recurring?: boolean;
      recurring_period?: string;
      vehicle_id?: string;
      instructor_id?: string;
    }) => {
      const { data, error } = await supabase
        .from("expenses")
        .insert({
          category: input.category,
          description: input.description,
          amount: input.amount,
          type: input.type,
          date: input.date,
          recurring: input.recurring ?? false,
          recurring_period: input.recurring_period,
          vehicle_id: input.vehicle_id,
          instructor_id: input.instructor_id,
          organization_id: orgId!,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Dépense enregistrée" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async (input: { id: string } & Partial<{
      category: string;
      description: string;
      amount: number;
      type: ExpenseType;
      date: string;
      recurring: boolean;
      recurring_period: string | null;
      vehicle_id: string | null;
      instructor_id: string | null;
    }>) => {
      const { id, ...rest } = input;
      const updateData: TablesUpdate<"expenses"> = { ...rest };
      const { data, error } = await supabase
        .from("expenses")
        .update(updateData)
        .eq("id", id)
        .eq("organization_id", orgId!)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Dépense modifiée" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("organization_id", orgId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast({ title: "Dépense supprimée" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  return { expenses: expensesQuery.data || [], isLoading: expensesQuery.isLoading, create, update, remove };
}
