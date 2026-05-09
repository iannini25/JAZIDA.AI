"use client";

// ESGReportPreview Strata — documento corporativo. Newsreader serif,
// hairlines, evidencias chip-style mono.

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
      <div className="rounded-[10px] border border-dashed border-subsolo-linha-forte p-6 text-center body-s text-subsolo-osso-tenue">
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
          className="rounded-[10px] border border-subsolo-linha-forte bg-subsolo-tinta-3 p-5 text-subsolo-osso"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <header className="flex items-center justify-between border-b border-subsolo-linha pb-2 micro text-subsolo-osso-tenue">
            <span>
              {f.framework} · {f.section}
            </span>
            <span>JAZIDA · Mariana</span>
          </header>
          <div className="esg-prose mt-3 body-strata text-subsolo-osso">
            <ReactMarkdown>{f.content}</ReactMarkdown>
          </div>
          {f.evidence && f.evidence.length > 0 && (
            <footer className="mt-4 border-t border-subsolo-linha pt-3">
              <p className="micro text-subsolo-osso-tenue">Evidencias</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {f.evidence.slice(0, 8).map((e, j) => (
                  <li key={j} className="strata-chip strata-chip-sub" style={{ fontSize: 10 }}>
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
