import { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar, { MobileMenuButton } from "./AppSidebar";
import { useOrg } from "@/contexts/OrgContext";
import GlobalSearch from "@/components/GlobalSearch";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { organization } = useOrg();

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center h-14 px-4 border-b border-border bg-card sticky top-0 z-20">
          <MobileMenuButton onClick={() => setMobileOpen(true)} />
          <div className="flex items-center gap-2 ml-3">
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-[10px]">DF</span>
            </div>
            <span className="font-semibold text-foreground text-sm truncate">
              {organization?.name || "Drivflow"}
            </span>
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <GlobalSearch />
    </div>
  );
}
