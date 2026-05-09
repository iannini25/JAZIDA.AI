"use client";

// ESGReportPreview — renderiza um (ou varios) ESGReportFragment com fonte serif
// e estilo de documento corporativo.

import ReactMarkdown from "react-markdown";
import type { ESGReportFragment } from "@/types";
import { cn } from "@/lib/utils";

export function ESGReportPreview({
  fragments,
  className,
  showAll = false,
  emptyHint,
}: {
  fragments: ESGReportFragment[];
  className?: string;
  showAll?: boolean; // se false, mostra so o primeiro fragment
  emptyHint?: string;
}) {
  if (fragments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-text-secondary">
        {emptyHint || "Nenhum rascunho gerado ainda."}
      </div>
    );
  }
  const visible = showAll ? fragments : fragments.slice(0, 1);
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {visible.map((f, i) => (
        <article
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-5"
          style={{ fontFamily: "Georgia, serif" }}
        >
          <header className="flex items-center justify-between border-b border-gray-100 pb-2 text-[10px] uppercase tracking-widest text-text-secondary">
            <span>{f.framework} · {f.section}</span>
            <span>JAZIDA · Mariana</span>
          </header>
          <div className="prose-jazida mt-3 text-sm leading-relaxed text-text-primary">
            <ReactMarkdown>{f.content}</ReactMarkdown>
          </div>
          {f.evidence && f.evidence.length > 0 && (
            <footer className="mt-4 border-t border-gray-100 pt-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                Evidencias
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {f.evidence.slice(0, 8).map((e, j) => (
                  <li
                    key={j}
                    className="rounded-md bg-brand-bg px-2 py-1 font-mono text-[10px] text-text-primary"
                  >
                    {e.type}: {e.reference}
                  </li>
                ))}
              </ul>
            </footer>
          )}
        </article>
      ))}
    </div>
  );
}
