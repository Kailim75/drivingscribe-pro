import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useIsSuperAdmin() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["is_super_admin", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("is_super_admin");
      // Fonction absente ou accès refusé = pas super admin
      if (error) return false;
      return data === true;
    },
  });

  return { isSuperAdmin: query.data === true, loading: query.isLoading };
}
