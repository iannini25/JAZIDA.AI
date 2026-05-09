"use client";

// AlertsPanel — lista de alertas do Vigia. Cor por level: warning/alert/critical.

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Alert } from "@/types";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  Alert["level"],
  { label: string; pillClass: string; cardClass: string }
> = {
  warning: {
    label: "warning",
    pillClass: "bg-amber-100 text-amber-800",
    cardClass: "border-amber-200 bg-amber-50/50",
  },
  alert: {
    label: "alert",
    pillClass: "bg-orange-100 text-orange-800",
    cardClass: "border-orange-200 bg-orange-50/40",
  },
  critical: {
    label: "critical",
    pillClass: "bg-red-100 text-red-800",
    cardClass: "border-red-200 bg-red-50/40",
  },
};

export function AlertsPanel({
  alerts,
  limit = 4,
  onDismiss,
}: {
  alerts: Alert[];
  limit?: number;
  onDismiss?: (alertId: string) => void;
}) {
  const visible = alerts.slice(0, limit);
  if (visible.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
        Sem alertas ativos. Tudo sob controle.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const meta = LEVEL_META[a.level];
          return (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              className={cn(
                "rounded-xl border p-4 transition-shadow hover:shadow-sm",
                meta.cardClass
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                        meta.pillClass
                      )}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-text-secondary">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                  <h4 className="mt-1 text-sm font-semibold text-text-primary">
                    {a.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {a.description}
                  </p>
                  <div className="mt-2 rounded-md bg-white/70 p-2 text-xs">
                    <span className="font-semibold text-text-primary">
                      Acao recomendada:
                    </span>{" "}
                    <span className="text-text-primary">
                      {a.recommendedAction}
                    </span>
                  </div>
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(a.id)}
                    className="text-[11px] text-text-secondary hover:text-text-primary"
                  >
                    ✕
                  </button>
                )}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "agora";
  if (ms < 60 * 60_000) return `${Math.floor(ms / 60_000)} min atras`;
  if (ms < 24 * 60 * 60_000) return `${Math.floor(ms / 3_600_000)} h atras`;
  try {
    return format(new Date(iso), "dd/MM HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}
