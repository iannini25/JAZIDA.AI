"use client";

// Sidebar de navegacao do dashboard. Desktop-first.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "▦" },
  { href: "/dashboard/citizens", label: "Cidadaos", icon: "◯" },
  { href: "/dashboard/esg-report", label: "ESG Report", icon: "▤" },
  { href: "/dashboard/alocacao", label: "Alocacao", icon: "▢" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r border-gray-200 bg-white px-4 py-6 md:flex">
      <Link
        href="/"
        className="mb-4 flex items-center gap-2"
        aria-label="JAZIDA"
      >
        <span
          className="text-lg font-bold"
          style={{ fontFamily: "Georgia, serif", color: "#047857" }}
        >
          JAZIDA
        </span>
        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
          dashboard
        </span>
      </Link>

      <nav className="flex flex-col gap-0.5">
        {ITEMS.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-green/10 font-semibold text-brand-green"
                  : "text-text-primary hover:bg-gray-100"
              )}
            >
              <span aria-hidden className="font-mono text-xs text-text-secondary">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-lg bg-brand-bg p-3 text-[11px] leading-relaxed text-text-secondary">
        Single-tenant MVP · cidade default <strong>mariana</strong>.
      </div>
    </aside>
  );
}
