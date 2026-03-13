import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, UserCog, Car, CalendarDays, Package,
  FileText, CreditCard, Receipt, TrendingUp, FolderOpen, Bell,
  Settings, Upload, ClipboardList, ChevronLeft, Menu, LogOut, ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";

interface NavItem { label: string; path: string; icon: React.ElementType; roles?: string[] }
interface NavGroup { title: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  { title: "PRINCIPAL", items: [
    { label: "Tableau de bord", path: "/tableau-de-bord", icon: LayoutDashboard },
  ]},
  { title: "GESTION", items: [
    { label: "Élèves", path: "/eleves", icon: Users },
    { label: "Formateurs", path: "/formateurs", icon: UserCog, roles: ["owner", "admin"] },
    { label: "Véhicules", path: "/vehicules", icon: Car, roles: ["owner", "admin"] },
    { label: "Planning", path: "/planning", icon: CalendarDays },
  ]},
  { title: "COMMERCIAL", items: [
    { label: "Offres", path: "/offres", icon: Package, roles: ["owner", "admin"] },
    { label: "Devis & Factures", path: "/facturation", icon: FileText, roles: ["owner", "admin", "accountant"] },
    { label: "Paiements", path: "/paiements", icon: CreditCard, roles: ["owner", "admin", "accountant"] },
  ]},
  { title: "ANALYSE", items: [
    { label: "Dépenses", path: "/depenses", icon: Receipt, roles: ["owner", "admin", "accountant"] },
    { label: "Rentabilité", path: "/rentabilite", icon: TrendingUp, roles: ["owner", "admin", "accountant"] },
  ]},
  { title: "OUTILS", items: [
    { label: "Documents", path: "/documents", icon: FolderOpen },
    { label: "Rappels", path: "/rappels", icon: Bell, roles: ["owner", "admin"] },
    { label: "Import", path: "/import", icon: Upload, roles: ["owner", "admin"] },
    { label: "Journal", path: "/journal", icon: ClipboardList, roles: ["owner", "admin"] },
  ]},
  { title: "ADMINISTRATION", items: [
    { label: "Super Admin", path: "/admin", icon: ShieldCheck, roles: ["owner"] },
  ]},
];

const settingsItem: NavItem = { label: "Paramètres", path: "/parametres", icon: Settings, roles: ["owner", "admin"] };

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();
  const { organization, userRoles } = useOrg();

  const canSee = (item: NavItem) => {
    if (!item.roles) return true;
    return item.roles.some((r) => (userRoles as string[]).includes(r));
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar">
      {/* Brand */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-sidebar-primary font-bold text-sm">DF</span>
          </div>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-hidden">
              <span className="font-semibold text-sidebar-accent-foreground text-sm block truncate">
                {organization?.name || "DriveFlow"}
              </span>
              <span className="text-[10px] text-sidebar-foreground/60 capitalize">{organization?.mode || ""}</span>
            </motion.div>
          )}
        </div>
        <button onClick={onToggle} className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter(canSee);
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.title}>
              {!collapsed && (
                <span className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/40 uppercase mb-1.5 block">
                  {group.title}
                </span>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== "/tableau-de-bord" && location.pathname.startsWith(item.path));
                  return (
                    <NavLink key={item.path} to={item.path} onClick={onMobileClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                      )}>
                      <item.icon className={cn("w-[17px] h-[17px] flex-shrink-0", isActive && "text-sidebar-primary")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2 space-y-0.5">
        {canSee(settingsItem) && (
          <NavLink to={settingsItem.path} onClick={onMobileClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150",
              location.pathname === settingsItem.path ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
            )}>
            <settingsItem.icon className="w-[17px] h-[17px] flex-shrink-0" />
            {!collapsed && <span>{settingsItem.label}</span>}
          </NavLink>
        )}
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full">
          <LogOut className="w-[17px] h-[17px] flex-shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className={cn("hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 z-30 border-r border-sidebar-border", collapsed ? "w-[68px]" : "w-[232px]")}>
        {sidebarContent}
      </aside>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={onMobileClose} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-[260px] z-50 lg:hidden border-r border-sidebar-border">
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
      <Menu className="w-5 h-5" />
    </button>
  );
}
