"use client";

// ProtocolBadge Strata — borda dupla cor ferro, mono grande no centro.
import { motion } from "framer-motion";

export function ProtocolBadge({ protocol }: { protocol: string }) {
  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      className="strata-proto"
    >
      <p className="micro" style={{ color: "var(--ferro)" }}>
        § Protocolo
      </p>
      <p className="mono-l mt-3 text-jazida-verde">{protocol}</p>
      <p className="body-s mt-3 text-solo-tinta-suave">
        guarde esse número. é sua prova.
      </p>
    </motion.div>
  );
}
