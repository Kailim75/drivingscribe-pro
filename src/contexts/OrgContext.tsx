import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface OrgContextType {
  organization: Organization | null;
  userRoles: AppRole[];
  loading: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (...roles: AppRole[]) => boolean;
  isOwnerOrAdmin: boolean;
  userSuspended: boolean;
  orgSuspended: boolean;
  refreshOrg: () => Promise<void>;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [userSuspended, setUserSuspended] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchOrg = async () => {
    if (!user) {
      setOrganization(null);
      setUserRoles([]);
      setUserSuspended(false);
      setLoading(false);
      return;
    }

    try {
      // Get user's organization membership
      const { data: members } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1);

      if (members && members.length > 0) {
        const orgId = members[0].organization_id;

        // Fetch org and roles in parallel
        const [orgResult, rolesResult, profileResult] = await Promise.all([
          supabase.from("organizations").select("*").eq("id", orgId).single(),
          supabase.from("user_roles").select("role").eq("user_id", user.id).eq("organization_id", orgId),
          supabase.from("profiles").select("suspended").eq("user_id", user.id).maybeSingle(),
        ]);

        setOrganization(orgResult.data);
        setUserRoles((rolesResult.data || []).map((r) => r.role));
        setUserSuspended(!!(profileResult.data as any)?.suspended);
      } else {
        setOrganization(null);
        setUserRoles([]);
        setUserSuspended(false);
      }
    } catch (err) {
      console.error("Error fetching organization:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrg();
  }, [user]);

  const hasRole = (role: AppRole) => userRoles.includes(role);
  const hasAnyRole = (...roles: AppRole[]) => roles.some((r) => userRoles.includes(r));
  const isOwnerOrAdmin = hasAnyRole("owner", "admin");
  const orgSuspended = !!(organization as any)?.suspended;

  return (
    <OrgContext.Provider value={{ organization, userRoles, loading, hasRole, hasAnyRole, isOwnerOrAdmin, userSuspended, orgSuspended, refreshOrg: fetchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) throw new Error("useOrg must be used within OrgProvider");
  return context;
}
