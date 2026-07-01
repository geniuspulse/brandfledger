"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, FileText, CreditCard, Receipt,
  Package, BarChart3, Settings, Zap, UserCircle2, Crown,
  Menu, X, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/products", label: "Products", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/team", label: "Team", icon: UserCircle2 },
  { href: "/subscription", label: "Subscription", icon: Crown },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavItems = () => (
    <>
      {nav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {active && <ChevronRight className="ml-auto h-3 w-3" />}
          </Link>
        );
      })}
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-card border shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 flex h-screen w-60 flex-col border-r bg-card transition-transform md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-4 border-b shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight">Brandfledger</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          <NavItems />
        </nav>
      </aside>
    </>
  );
}
