"use client";

// ESGReportPreview Strata Solo — documento corporativo em fundo claro.
// Newsreader serif, hairlines, evidências chip-style mono.

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
  showAll?: boolean;
  emptyHint?: string;
}) {
  if (fragments.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-solo-linha-forte p-6 text-center body-s text-solo-tinta-tenue">
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
          className="rounded-[10px] border border-solo-linha bg-solo-papel-claro p-5 text-solo-tinta"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <header className="micro flex items-center justify-between border-b border-solo-linha pb-2 text-solo-tinta-tenue">
            <span>
              {f.framework} · {f.section}
            </span>
            <span>JAZIDA · Mariana</span>
          </header>
          <div className="esg-prose mt-3 body-strata text-solo-tinta">
            <ReactMarkdown>{f.content}</ReactMarkdown>
          </div>
          {f.evidence && f.evidence.length > 0 && (
            <footer className="mt-4 border-t border-solo-linha pt-3">
              <p className="micro text-solo-tinta-tenue">Evidências</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {f.evidence.slice(0, 8).map((e, j) => (
                  <li
                    key={j}
                    className="strata-chip"
                    style={{ fontSize: 10 }}
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
