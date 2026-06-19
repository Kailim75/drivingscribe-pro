import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar, { MobileMenuButton } from "./AppSidebar";
import { useOrg } from "@/contexts/OrgContext";
import GlobalSearch from "@/components/GlobalSearch";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { Search } from "lucide-react";

type OrganizationBranding = {
  logo_url?: string | null;
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { organization } = useOrg();
  const organizationBranding = organization as OrganizationBranding | null;
  useKeyboardShortcuts();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onOpenSearch={() => setSearchOpen(true)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card sticky top-0 z-20">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <div className="flex items-center gap-2 ml-3">
            {organizationBranding?.logo_url ? (
              <img src={organizationBranding.logo_url} alt="Logo" className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-[10px]">
                  {(organization?.name || "D").slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="font-semibold text-foreground text-sm truncate">
              {organization?.name || "Drivflow"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Rechercher"
          >
            <Search className="h-5 w-5" />
          </button>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
