"use client";

// Sidebar do Subsolo (Strata). Tinta escura, hairlines, micro labels agrupados.

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
    label: "Operacao",
    items: [
      { href: "/dashboard", label: "Visao geral", icon: "i-layers" },
      { href: "/dashboard/citizens", label: "Cidadaos", icon: "i-people" },
    ],
  },
  {
    label: "Recomendacao",
    items: [
      { href: "/dashboard/oportunidades", label: "Oportunidades", icon: "i-broto" },
      { href: "/dashboard/alocacao", label: "Alocacao ESG", icon: "i-pizza" },
      { href: "/dashboard/esg-report", label: "Relatorio CSRD", icon: "i-doc-selo" },
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
    <aside className="hidden w-56 shrink-0 flex-col bg-subsolo-tinta py-5 md:flex border-r border-subsolo-linha-forte">
      <Link
        href="/dashboard"
        className="px-5 pb-5 flex flex-col gap-1"
        aria-label="JAZIDA"
      >
        <div className="flex items-center gap-2 text-jazida-verde-vivo">
          <Icon name="i-jglyph" size={22} />
          <span className="display-s text-subsolo-osso" style={{ fontSize: 20 }}>
            Jazida
          </span>
        </div>
        <span className="micro" style={{ color: "var(--ferro)" }}>
          Inteligencia
        </span>
      </Link>

      <div className="h-px bg-subsolo-linha" />

      <nav className="mt-2 flex flex-col">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <p className="micro px-5 pb-1.5 pt-4 text-subsolo-osso-tenue">
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
                      ? "border-jazida-verde-vivo bg-jazida-verde/10 text-subsolo-osso"
                      : "border-transparent text-subsolo-osso-suave hover:text-subsolo-osso"
                  )}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 animate-pulse-dot rounded-full bg-jazida-verde-vivo" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="mt-auto border-t border-subsolo-linha px-5 pt-4">
        {userName && (
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-subsolo-tinta"
              style={{ background: "var(--ocre)", fontFamily: "var(--font-display)" }}
            >
              {userName
                .split(/\s+/)
                .map((p) => p[0]?.toUpperCase())
                .filter(Boolean)
                .slice(0, 2)
                .join("")}
            </div>
            <div className="min-w-0">
              <p className="body-s font-medium text-subsolo-osso truncate">
                {userName}
              </p>
              <p className="mono-s text-subsolo-osso-tenue" style={{ fontSize: 11 }}>
                {userRole}
              </p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="strata-btn strata-btn-outline-sub mt-3 w-full justify-center"
          style={{ height: 32, fontSize: 12 }}
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
