"use client";

// CitizenRow — uma linha compacta da tabela de cidadaos.
import type { DashboardCitizen } from "@/lib/api/dashboard";
import { cn } from "@/lib/utils";

export function CitizenRow({
  citizen,
  active,
  onClick,
}: {
  citizen: DashboardCitizen;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "grid w-full grid-cols-[1.2fr_1fr_60px_60px_70px] items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left text-sm transition-colors",
        active
          ? "border-brand-green bg-brand-green/5"
          : "hover:bg-gray-50"
      )}
    >
      <div>
        <p className="font-semibold text-text-primary">{citizen.name}</p>
        <p className="text-[11px] text-text-secondary">
          {citizen.occupation || "—"}
        </p>
      </div>
      <div className="text-text-primary">{citizen.neighborhood || "—"}</div>
      <div className="text-center">
        <span className="font-mono tabular-nums">{citizen.talentsCount}</span>
        <span className="ml-1 text-[10px] text-text-secondary">tal</span>
      </div>
      <div className="text-center">
        <span className="font-mono tabular-nums">{citizen.complaintsCount}</span>
        <span className="ml-1 text-[10px] text-text-secondary">vz</span>
      </div>
      <div className="text-right text-[11px] text-text-secondary">
        {formatRelative(citizen.createdAt)}
      </div>
    </button>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60 * 60_000) return "hoje";
  if (ms < 24 * 60 * 60_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / (24 * 3_600_000))}d`;
}
