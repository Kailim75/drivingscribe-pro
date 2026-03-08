import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Car,
  CalendarDays,
  Package,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  FolderOpen,
  Bell,
  Settings,
  Upload,
  ClipboardList,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "PRINCIPAL",
    items: [
      { label: "Tableau de bord", path: "/tableau-de-bord", icon: LayoutDashboard },
    ],
  },
  {
    title: "GESTION",
    items: [
      { label: "Élèves", path: "/eleves", icon: Users },
      { label: "Formateurs", path: "/formateurs", icon: UserCog },
      { label: "Véhicules", path: "/vehicules", icon: Car },
      { label: "Planning", path: "/planning", icon: CalendarDays },
    ],
  },
  {
    title: "COMMERCIAL",
    items: [
      { label: "Offres", path: "/offres", icon: Package },
      { label: "Devis & Factures", path: "/facturation", icon: FileText },
      { label: "Paiements", path: "/paiements", icon: CreditCard },
    ],
  },
  {
    title: "ANALYSE",
    items: [
      { label: "Dépenses", path: "/depenses", icon: Receipt },
      { label: "Rentabilité", path: "/rentabilite", icon: TrendingUp },
    ],
  },
  {
    title: "OUTILS",
    items: [
      { label: "Documents", path: "/documents", icon: FolderOpen },
      { label: "Rappels", path: "/rappels", icon: Bell },
      { label: "Import", path: "/import", icon: Upload },
      { label: "Journal", path: "/journal", icon: ClipboardList },
    ],
  },
];

const settingsItem: NavItem = { label: "Paramètres", path: "/parametres", icon: Settings };

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AppSidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: AppSidebarProps) {
  const location = useLocation();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">DS</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-semibold text-foreground text-base whitespace-nowrap"
            >
              DriveSync
            </motion.span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <span className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-foreground/50 uppercase">
                {group.title}
              </span>
            )}
            <div className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive && "text-primary")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && !collapsed && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings + bottom */}
      <div className="border-t border-sidebar-border p-2">
        <NavLink
          to={settingsItem.path}
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
            location.pathname === settingsItem.path
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
          )}
        >
          <settingsItem.icon className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>{settingsItem.label}</span>}
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0 transition-all duration-300 z-30",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[260px] z-50 lg:hidden"
            >
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
    <button
      onClick={onClick}
      className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}
