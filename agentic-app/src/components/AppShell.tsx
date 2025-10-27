"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { RoleSelector } from "./RoleSelector";

const navItems = [
  { href: "#dashboard", label: "Dashboard" },
  { href: "#orders", label: "Orders" },
  { href: "#inventory", label: "Inventory" },
  { href: "#billing", label: "Billing" },
  { href: "#expenses", label: "Expenses" },
  { href: "#profit-loss", label: "Profit & Loss" },
  { href: "#analytics", label: "Analytics" },
  { href: "#reports", label: "Reports" },
];

export const AppShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Khakhra Command Center</h1>
            <p className="text-sm text-slate-500">
              Integrated manufacturing & retail management suite for Gujarati khakhra operations.
            </p>
          </div>
          <RoleSelector />
        </div>
        <nav className="border-t border-slate-200 bg-slate-100">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-6 py-3 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={`${pathname}${item.href}`}
                className="rounded-md px-3 py-2 transition hover:bg-white hover:text-orange-600"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
};
