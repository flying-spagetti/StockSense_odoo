"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  ProductsIcon,
  ReceiptsIcon,
  DeliveriesIcon,
  TransfersIcon,
  AdjustmentsIcon,
  MoveHistoryIcon,
  SettingsIcon,
  MenuIcon,
  XIcon,
} from "@/components/ui/icons";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const mainNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/operations", label: "Operations", icon: PackageIcon },
  { href: "/products", label: "Products", icon: ProductsIcon },
  { href: "/receipts", label: "Receipts", icon: ReceiptsIcon },
  { href: "/deliveries", label: "Deliveries", icon: DeliveriesIcon },
  { href: "/transfers", label: "Transfers", icon: TransfersIcon },
  { href: "/adjustments", label: "Adjustments", icon: AdjustmentsIcon },
  { href: "/move-history", label: "Move History", icon: MoveHistoryIcon },
];

const secondaryNavItems: NavItem[] = [
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const getPageTitle = () => {
    if (pathname === "/" || pathname === "/dashboard") return "Dashboard Overview";
    if (pathname.startsWith("/operations")) return "Operations Workspace";
    if (pathname.startsWith("/products")) return "Product Master Catalog";
    if (pathname.startsWith("/receipts")) return "Stock Receipts (Incoming)";
    if (pathname.startsWith("/deliveries")) return "Stock Deliveries (Outgoing)";
    if (pathname.startsWith("/transfers")) return "Internal Stock Transfers";
    if (pathname.startsWith("/adjustments")) return "Stock Inventory Adjustments";
    if (pathname.startsWith("/move-history")) return "Complete Move Ledger";
    if (pathname.startsWith("/settings")) return "System Settings";
    return "StockSense Engine";
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-900 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-800 px-5">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:bg-amber-500/20 transition">
              <span className="font-mono font-bold text-lg tracking-tighter">SS</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-base">STOCKSENSE</span>
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                Odoo-Inspired Stock Engine
              </p>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
              INVENTORY MANAGEMENT
            </div>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-zinc-800 text-white font-semibold border-l-2 border-amber-500 shadow-sm pl-[10px]"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${
                          active ? "text-amber-400" : "text-zinc-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div>
            <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 font-mono">
              CONFIGURATION
            </div>
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-zinc-800 text-white font-semibold border-l-2 border-amber-500 shadow-sm pl-[10px]"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 ${
                          active ? "text-amber-400" : "text-zinc-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Industrial Sidebar Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950/60 p-4 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-medium text-zinc-300">HUB-MAIN-A</span>
            </div>
            <span className="text-[10px] text-zinc-500">v1.2.0</span>
          </div>
          <p className="mt-1 text-[10px] text-zinc-500 truncate">
            Quantity derived from completed moves
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 bg-zinc-900">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 sm:px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden"
              aria-label="Open Sidebar"
            >
              <MenuIcon className="h-6 w-6" />
            </button>

            <div>
              <h1 className="text-base font-semibold text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400 font-mono mt-0.5">
                <span>StockSense</span>
                <span>/</span>
                <span className="text-zinc-300 capitalize">
                  {pathname === "/" ? "dashboard" : pathname.split("/")[1]}
                </span>
              </div>
            </div>
          </div>

          {/* Header Right Status Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>STOCK COMPUTATION: DERIVED</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
