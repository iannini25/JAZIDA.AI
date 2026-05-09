"use client";

// AlertsPanel Strata Solo — alertas com border-left por severidade.
// Crítico = ferro, alerta = ocre, info = azul-mineral.

import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Alert } from "@/types";
import { Icon } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  Alert["level"],
  { label: string; borderColor: string; tagColor: string; tagBg: string }
> = {
  warning: {
    label: "atenção",
    borderColor: "var(--sinal-atencao)",
    tagColor: "var(--sinal-atencao)",
    tagBg: "rgba(201,169,97,0.10)",
  },
  alert: {
    label: "alerta",
    borderColor: "var(--sinal-alerta)",
    tagColor: "var(--sinal-alerta)",
    tagBg: "rgba(201,133,58,0.10)",
  },
  critical: {
    label: "crítico",
    borderColor: "var(--sinal-critico)",
    tagColor: "var(--sinal-critico)",
    tagBg: "rgba(168,58,40,0.10)",
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
      <p className="rounded-[10px] border border-dashed border-solo-linha-forte p-6 text-center body-s text-solo-tinta-tenue">
        Nenhum alerta ativo. Tudo sob controle.
      </p>
    );
  }
  return (
    <ul className="flex flex-col">
      <AnimatePresence initial={false}>
        {visible.map((a) => {
          const meta = LEVEL_META[a.level];
          return (
            <motion.li
              layout
              key={a.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
              className={cn(
                "border-b border-l-2 border-solo-linha py-4 pl-5 pr-4 last:border-b-0"
              )}
              style={{ borderLeftColor: meta.borderColor }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="micro inline-flex items-center gap-1.5 px-1.5 py-0.5"
                      style={{
                        color: meta.tagColor,
                        background: meta.tagBg,
                        borderRadius: 3,
                      }}
                    >
                      ◈ {meta.label}
                    </span>
                    <span className="caption text-solo-tinta-tenue">
                      {formatRelative(a.createdAt)}
                    </span>
                  </div>
                  <h4 className="body-strata mt-1.5 font-medium text-solo-tinta">
                    {a.title}
                  </h4>
                  <p className="body-s mt-1 text-solo-tinta-suave">
                    {a.description}
                  </p>
                  <p className="caption mt-2 text-ferro">
                    ⌛ ação sugerida: {a.recommendedAction}
                  </p>
                </div>
                {onDismiss && (
                  <button
                    type="button"
                    onClick={() => onDismiss(a.id)}
                    className="text-solo-tinta-tenue hover:text-solo-tinta"
                    aria-label="dispensar"
                  >
                    <Icon name="i-close" size={14} />
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
  if (ms < 60 * 60_000) return `há ${Math.floor(ms / 60_000)} min`;
  if (ms < 24 * 60 * 60_000) return `há ${Math.floor(ms / 3_600_000)}h`;
  try {
    return format(new Date(iso), "dd/MM HH:mm", { locale: ptBR });
  } catch {
    return iso;
  }
}
