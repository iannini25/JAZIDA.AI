"use client";

// Sidebar do Dashboard — Strata Solo (modo claro).
// Papel cremoso, hairlines, microlabels agrupados, border-left verde no ativo.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth-storage";
import { logout as apiLogout } from "@/lib/api/auth";
import { Icon, type IconName } from "@/components/ui/Icons";

type NavGroup = {
  label: string;
  items: { href: string; label: string; icon: IconName }[];
};

const GROUPS: NavGroup[] = [
  {
    label: "Operação",
    items: [
      { href: "/dashboard", label: "Visão geral", icon: "i-layers" },
      { href: "/dashboard/citizens", label: "Cidadãos", icon: "i-people" },
      { href: "/dashboard/canais", label: "Canais de captura", icon: "i-meg" },
    ],
  },
  {
    label: "Regulatório",
    items: [
      { href: "/dashboard/condicionantes", label: "Condicionantes", icon: "i-aud" },
      { href: "/dashboard/esg-report", label: "Relatório CSRD", icon: "i-doc-selo" },
    ],
  },
  {
    label: "Recomendação",
    items: [
      { href: "/dashboard/oportunidades", label: "Oportunidades", icon: "i-broto" },
      { href: "/dashboard/alocacao", label: "Alocação ESG", icon: "i-pizza" },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/");
      return;
    }
    if (auth.role !== "funcionario") {
      router.replace("/app");
      return;
    }
    setUserName(auth.displayName);
    setUserRole("RC · Mariana");
  }, [router]);

  async function handleLogout() {
    await apiLogout();
    clearStoredAuth();
    router.replace("/");
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-solo-linha bg-solo-papel-claro py-5 md:flex">
      <Link
        href="/dashboard"
        className="flex flex-col gap-1 px-5 pb-5"
        aria-label="JAZIDA"
      >
        <div className="flex items-center gap-2 text-jazida-verde">
          <Icon name="i-jglyph" size={22} />
          <span className="display-s text-solo-tinta" style={{ fontSize: 20 }}>
            Jazida
          </span>
        </div>
        <span className="micro" style={{ color: "var(--ferro)" }}>
          Inteligência
        </span>
      </Link>

      <div className="h-px bg-solo-linha" />

      <nav className="mt-2 flex flex-col">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="micro px-5 pb-1.5 pt-4 text-solo-tinta-tenue">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 border-l-2 px-4 py-2 text-[13px] font-medium transition-colors duration-150 ease-strata",
                    active
                      ? "border-jazida-verde bg-jazida-verde/10 text-solo-tinta"
                      : "border-transparent text-solo-tinta-suave hover:bg-solo-papel-fundo hover:text-solo-tinta"
                  )}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 animate-pulse-dot rounded-full bg-jazida-verde" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-solo-linha px-5 pt-4">
        {userName && (
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-solo-tinta"
              style={{
                background: "var(--ocre)",
                fontFamily: "var(--font-display)",
              }}
            >
              {userName
                .split(/\s+/)
                .map((p) => p[0]?.toUpperCase())
                .filter(Boolean)
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="body-s truncate font-medium text-solo-tinta">
                {userName}
              </p>
              <p className="mono-s text-solo-tinta-tenue" style={{ fontSize: 11 }}>
                {userRole}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="strata-btn strata-btn-outline-solo mt-3 w-full justify-center"
          style={{ height: 32, fontSize: 12 }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
