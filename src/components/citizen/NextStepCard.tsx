"use client";

// NextStepCard — passo concreto numerado + link externo opcional.
import { motion } from "framer-motion";
import type { ActionStep } from "@/types";

export function NextStepCard({
  step,
  index,
}: {
  step: ActionStep;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index ?? 0) * 0.08 }}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-green/10 font-mono text-sm font-bold text-brand-green">
        {step.order}
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-text-primary">
          {step.title}
        </h4>
        <p className="mt-1 text-xs leading-relaxed text-text-secondary">
          {step.description}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
          {step.estimatedTime && (
            <span className="rounded-md bg-brand-bg px-2 py-0.5 text-text-secondary">
              ⏱️ {step.estimatedTime}
            </span>
          )}
          {step.link && (
            <a
              href={step.link}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand-green hover:underline"
            >
              Acessar →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
