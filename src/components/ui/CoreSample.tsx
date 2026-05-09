"use client";

// CoreSample — visualizacao-assinatura do JAZIDA.
// Cilindro de testemunho geologico onde cada agente vira um estrato.
// Substitui o spinner clichê por uma imagem-marca: "agentes nao sao um chat,
// sao um processo geologico de refinamento de sinal".
//
// Estados:
//   pending   contorno tracejado, sem fill
//   running   textura tenue + shimmer vertical
//   done      textura cheia (paleta mineral)
//
// Variantes de tamanho: mini | default | hero

import type { CSSProperties } from "react";

export type CoreStratum = {
  agent: string;
  status: "pending" | "running" | "done";
  // Textura visual da camada (decorativa). Default cicla por agentes conhecidos.
  pattern?: "dot" | "solid" | "wave" | "diag" | "dash" | "densedot";
  color?: string; // CSS color
  label?: string;
};

export type CoreSampleProps = {
  strata: CoreStratum[];
  variant?: "mini" | "default" | "hero";
  showLabels?: boolean;
  className?: string;
  style?: CSSProperties;
};

// Mapeamento default por agente — cada um ganha textura+cor consistente
// pra reforcar a metafora geologica (Acolhida = topo, Pacto = base).
const AGENT_DEFAULTS: Record<
  string,
  { pattern: NonNullable<CoreStratum["pattern"]>; color: string }
> = {
  Acolhida: { pattern: "dot", color: "var(--ocre)" },
  Talento: { pattern: "solid", color: "var(--jazida-verde)" },
  Voz: { pattern: "wave", color: "var(--ferro)" },
  Bussola: { pattern: "diag", color: "var(--cobre)" },
  Replica: { pattern: "dash", color: "var(--grafite)" },
  Pulsar: { pattern: "densedot", color: "var(--sinal-info)" },
  Pacto: { pattern: "solid", color: "var(--jazida-verde-vivo)" },
  Semente: { pattern: "wave", color: "var(--jazida-verde-vivo)" },
};

const SIZES: Record<
  NonNullable<CoreSampleProps["variant"]>,
  { width: number; minHeight: number }
> = {
  mini: { width: 40, minHeight: 32 },
  default: { width: 64, minHeight: 34 },
  hero: { width: 96, minHeight: 51 },
};

export function CoreSample({
  strata,
  variant = "default",
  showLabels = false,
  className,
  style,
}: CoreSampleProps) {
  const size = SIZES[variant];
  const stratumHeight = size.minHeight;
  const totalHeight = stratumHeight * strata.length;

  return (
    <div className={className} style={style}>
      <div
        className="strata-core-cyl"
        style={{ width: size.width, display: "block" }}
      >
        <Patterns />
        <svg
          width={size.width}
          height={totalHeight}
          viewBox={`0 0 ${size.width} ${totalHeight}`}
          style={{ display: "block" }}
        >
          {strata.map((s, i) => {
            const y = i * stratumHeight;
            const def = AGENT_DEFAULTS[s.agent] ?? {
              pattern: "diag" as const,
              color: "var(--grafite)",
            };
            const pattern = s.pattern ?? def.pattern;
            const color = s.color ?? def.color;

            return (
              <g key={i} style={{ color }}>
                {s.status === "done" && (
                  <Stratum
                    y={y}
                    width={size.width}
                    height={stratumHeight}
                    pattern={pattern}
                  />
                )}
                {s.status === "running" && (
                  <RunningStratum
                    y={y}
                    width={size.width}
                    height={stratumHeight}
                    pattern={pattern}
                  />
                )}
                {s.status === "pending" && (
                  <PendingStratum
                    y={y}
                    width={size.width}
                    height={stratumHeight}
                  />
                )}
                {/* hairline divisor entre estratos */}
                {i > 0 && (
                  <line
                    x1={0}
                    y1={y}
                    x2={size.width}
                    y2={y}
                    stroke="var(--solo-linha-forte)"
                    strokeWidth={1}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {showLabels && (
        <ol className="mt-3 flex flex-col gap-0">
          {strata.map((s, i) => (
            <li
              key={i}
              className="flex items-center gap-3 py-1 text-[11px]"
              style={{
                color:
                  s.status === "pending"
                    ? "var(--solo-tinta-tenue)"
                    : "var(--solo-tinta)",
              }}
            >
              <span className="font-mono text-[10px] text-[color:var(--solo-tinta-tenue)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="font-medium">{s.label ?? s.agent}</span>
              <StatusGloss status={s.status} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Stratum({
  y,
  width,
  height,
  pattern,
}: {
  y: number;
  width: number;
  height: number;
  pattern: NonNullable<CoreStratum["pattern"]>;
}) {
  if (pattern === "solid") {
    return <rect x={0} y={y} width={width} height={height} fill="currentColor" />;
  }
  return (
    <rect
      x={0}
      y={y}
      width={width}
      height={height}
      fill={`url(#strata-p-${pattern})`}
    />
  );
}

function RunningStratum({
  y,
  width,
  height,
  pattern,
}: {
  y: number;
  width: number;
  height: number;
  pattern: NonNullable<CoreStratum["pattern"]>;
}) {
  return (
    <>
      {/* fundo tenue */}
      <rect
        x={0}
        y={y}
        width={width}
        height={height}
        fill={pattern === "solid" ? "currentColor" : `url(#strata-p-${pattern})`}
        opacity={0.35}
      />
      {/* borda solida */}
      <rect
        x={0.5}
        y={y + 0.5}
        width={width - 1}
        height={height - 1}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
      />
      {/* shimmer subindo */}
      <g
        clipPath={`inset(${y}px 0 ${y + height}px 0)`}
        style={{ transformOrigin: "top" }}
      >
        <rect
          x={0}
          y={y}
          width={width}
          height={height}
          fill="currentColor"
          opacity={0.25}
          className="animate-shimmer-up"
          style={{ transformOrigin: "top" }}
        />
      </g>
    </>
  );
}

function PendingStratum({
  y,
  width,
  height,
}: {
  y: number;
  width: number;
  height: number;
}) {
  return (
    <rect
      x={0.5}
      y={y + 0.5}
      width={width - 1}
      height={height - 1}
      fill="none"
      stroke="var(--solo-linha-forte)"
      strokeDasharray="2 3"
      strokeWidth={1}
    />
  );
}

function StatusGloss({ status }: { status: CoreStratum["status"] }) {
  if (status === "done")
    return (
      <span className="ml-auto text-[10px] uppercase tracking-microlabel text-[color:var(--jazida-verde)]">
        ouvido
      </span>
    );
  if (status === "running")
    return (
      <span className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-microlabel text-[color:var(--ferro)]">
        <span className="inline-block h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[color:var(--ferro)]" />
        em curso
      </span>
    );
  return (
    <span className="ml-auto text-[10px] uppercase tracking-microlabel text-[color:var(--solo-tinta-tenue)]">
      aguardando
    </span>
  );
}

// Patterns inline — montados 1x na arvore. SVG defs reutilizadas via id global.
function Patterns() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        <pattern
          id="strata-p-dot"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="3" cy="3" r="0.9" fill="currentColor" />
        </pattern>
        <pattern
          id="strata-p-diag"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" strokeWidth="1.6" />
        </pattern>
        <pattern
          id="strata-p-wave"
          width="14"
          height="6"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M0 3 Q3.5 0 7 3 T 14 3"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
          />
        </pattern>
        <pattern
          id="strata-p-dash"
          width="8"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <line x1="0" y1="2" x2="5" y2="2" stroke="currentColor" strokeWidth="1.4" />
        </pattern>
        <pattern
          id="strata-p-densedot"
          width="4"
          height="4"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="0.7" fill="currentColor" />
        </pattern>
      </defs>
    </svg>
  );
}
