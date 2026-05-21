"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  Plane,
  LayoutDashboard,
  MapPin,
  Cpu,
  Users,
  Package,
  FileBarChart,
  Truck,
  LogOut,
  Menu,
  X,
  User,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import NotificationDropdown from "@/app/components/notifications/notification-dropdown";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const roleNavItems: Record<string, NavItem[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Stations", href: "/admin/stations", icon: <MapPin className="w-4 h-4" /> },
    { label: "Drones", href: "/admin/drones", icon: <Cpu className="w-4 h-4" /> },
    { label: "Operators", href: "/admin/operators", icon: <Users className="w-4 h-4" /> },
    { label: "Deliveries", href: "/admin/deliveries", icon: <Package className="w-4 h-4" /> },
    { label: "Reports", href: "/admin/reports", icon: <FileBarChart className="w-4 h-4" /> },
  ],
  OPERATOR: [
    { label: "Dashboard", href: "/operator", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "Deliveries", href: "/operator/deliveries", icon: <Package className="w-4 h-4" /> },
    { label: "Drones", href: "/operator/drones", icon: <Cpu className="w-4 h-4" /> },
  ],
  CLIENT: [
    { label: "Dashboard", href: "/client", icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: "New Delivery", href: "/client/new-delivery", icon: <Truck className="w-4 h-4" /> },
    { label: "Deliveries", href: "/client/deliveries", icon: <Package className="w-4 h-4" /> },
    { label: "Profile", href: "/client/profile", icon: <User className="w-4 h-4" /> },
  ],
};

const roleLabels: Record<string, string> = {
  ADMIN: "Super Admin",
  OPERATOR: "Station Operator",
  CLIENT: "Business Client",
};

export default function Sidebar({
  role,
  userName,
  notificationCount,
}: {
  role: string;
  userName: string;
  notificationCount: number;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = roleNavItems[role] || [];

  const isActive = (href: string) => {
    if (href === `/${role.toLowerCase()}`) return pathname === href;
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-5 border-b border-border-light">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
            <Plane className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-foreground">
              Sky<span className="text-primary">Drop</span>
            </span>
            <p className="text-[10px] font-medium text-muted uppercase tracking-wider">
              {roleLabels[role]}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium group ${
              isActive(item.href)
                ? "bg-primary/10 text-primary"
                : "text-muted hover:bg-surface-hover hover:text-foreground"
            }`}
          >
            <span className={isActive(item.href) ? "text-primary" : "text-muted-light group-hover:text-foreground"}>
              {item.icon}
            </span>
            {item.label}
            {isActive(item.href) && (
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary" />
            )}
          </Link>
        ))}
      </nav>

      {/* Notifications */}
      <div className="p-3 border-t border-border-light">
        <NotificationDropdown initialCount={notificationCount} />
      </div>

      {/* User info + Logout */}
      <div className="p-3 border-t border-border-light">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-primary">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{userName}</p>
            <p className="text-[10px] text-muted">{roleLabels[role]}</p>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-error/70 hover:bg-error/5 hover:text-error w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-white rounded-xl p-2 shadow-md border border-border-light"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-border-light flex flex-col transform transition-transform duration-300 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4"
        >
          <X className="w-5 h-5 text-muted" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-border-light flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  );
}
