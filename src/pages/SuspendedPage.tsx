import { ShieldOff, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useNoIndex } from "@/hooks/useNoIndex";

export default function SuspendedPage() {
  useNoIndex();
  const { signOut } = useAuth();
  const { userSuspended, orgSuspended } = useOrg();

  const isOrgSuspended = orgSuspended && !userSuspended;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
          <ShieldOff className="w-8 h-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">
            {isOrgSuspended ? "Organisation suspendue" : "Compte suspendu"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isOrgSuspended
              ? "Votre organisation a été suspendue par un administrateur. L'accès à l'application est temporairement désactivé pour tous les membres."
              : "Votre compte a été suspendu par un administrateur. L'accès à l'application est temporairement désactivé."}
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Si vous pensez qu'il s'agit d'une erreur, veuillez contacter le support.
          </p>
        </div>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
