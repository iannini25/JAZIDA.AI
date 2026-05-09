"use client";

// ProtocolBadge — destaque visual pro numero de protocolo (ex: JZD-2026-00123).
import { motion } from "framer-motion";

export function ProtocolBadge({ protocol }: { protocol: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="flex flex-col items-center gap-1 rounded-2xl border-2 border-brand-green bg-white px-6 py-4 shadow-sm"
    >
      <span className="text-xs uppercase tracking-wider text-text-secondary">
        Seu protocolo
      </span>
      <span className="font-mono text-2xl font-bold text-brand-green">
        {protocol}
      </span>
      <span className="text-xs text-text-secondary">
        guarda isso, viu? e a tua prova
      </span>
    </motion.div>
  );
}
