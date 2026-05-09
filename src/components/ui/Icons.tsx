// Sprite SVG monoline 1.5px — sistema Strata.
// Substitui todos os emojis decorativos do MVP por icones autorais.
//
// Uso:
//   import { Icon, IconSprite } from "@/components/ui/Icons";
//   ...
//   <IconSprite />            // monta as definicoes (chamar 1x na arvore)
//   <Icon name="i-mira" />    // usa o icone

export function IconSprite() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
      <defs>
        {/* mira — talento / alvo cartografico */}
        <symbol id="i-mira" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
          <circle cx="12" cy="12" r="1.5" />
        </symbol>
        {/* megafone — reclamacao / voz */}
        <symbol id="i-meg" viewBox="0 0 24 24">
          <path d="M4 10v4l10 5V5L4 10z" />
          <path d="M17 9c1.2 1 1.2 5 0 6" />
          <path d="M19.5 7c2.2 1.8 2.2 8.2 0 10" />
        </symbol>
        {/* cristal — sugestao */}
        <symbol id="i-cris" viewBox="0 0 24 24">
          <path d="M12 2.5l5 5.5-5 13.5-5-13.5 5-5.5z" />
          <path d="M7 8h10M12 2.5V21.5" />
        </symbol>
        {/* estela — historico */}
        <symbol id="i-estela" viewBox="0 0 24 24">
          <path d="M6 3h12v18H6z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </symbol>
        {/* estrato — loading / camadas */}
        <symbol id="i-estrato" viewBox="0 0 24 24">
          <path d="M3 7c3 1.5 6-1.5 9 0s6-1.5 9 0" />
          <path d="M3 12c3 1.5 6-1.5 9 0s6-1.5 9 0" />
          <path d="M3 17c3 1.5 6-1.5 9 0s6-1.5 9 0" />
        </symbol>
        {/* caderno — curso */}
        <symbol id="i-caderno" viewBox="0 0 24 24">
          <path d="M3 5h8v15H3z" />
          <path d="M21 5h-8v15h8z" />
          <path d="M5 9h4M5 13h4M15 9h4M15 13h4" />
        </symbol>
        {/* caixa-arquivo — vaga */}
        <symbol id="i-caixa" viewBox="0 0 24 24">
          <path d="M9 4h6v3H9z" />
          <path d="M3 7h18v13H3z" />
          <path d="M3 12h18" />
        </symbol>
        {/* broto-vertical — empreender */}
        <symbol id="i-broto" viewBox="0 0 24 24">
          <path d="M12 21V8" />
          <path d="M12 13c-2-3-5-3-7-2 1 4 4 5 7 4" />
          <path d="M12 9c2-3 5-3 7-2-1 4-4 5-7 4" />
        </symbol>
        {/* ampulheta — duracao */}
        <symbol id="i-ampul" viewBox="0 0 24 24">
          <path d="M6 3h12M6 21h12" />
          <path d="M7 3l5 6 5-6" />
          <path d="M7 21l5-6 5 6" />
        </symbol>
        {/* barra de metal — custo */}
        <symbol id="i-barra" viewBox="0 0 24 24">
          <path d="M5 14l4-7h10l-4 7z" />
          <path d="M5 14h10M9 7l-4 7" />
        </symbol>
        {/* pena — mandar / escrever */}
        <symbol id="i-pena" viewBox="0 0 24 24">
          <path d="M4 20l8-8M14 4l6 6-10 10H4v-6L14 4z" />
        </symbol>
        {/* vacuo isobarico — erro / vazio */}
        <symbol id="i-vacuo" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
          <path d="M9 12h6" />
        </symbol>
        {/* microfone glifo */}
        <symbol id="i-mic" viewBox="0 0 24 24">
          <path d="M9 4h6v10H9z" />
          <path d="M5 11c0 4 3 7 7 7s7-3 7-7" />
          <path d="M12 18v3M9 21h6" />
        </symbol>
        {/* camadas horizontais — visao geral */}
        <symbol id="i-layers" viewBox="0 0 24 24">
          <path d="M3 7h18M3 12h18M3 17h18" />
        </symbol>
        {/* 3 pontos triangulares — cidadaos */}
        <symbol id="i-people" viewBox="0 0 24 24">
          <circle cx="12" cy="6" r="2.2" />
          <circle cx="6" cy="17" r="2.2" />
          <circle cx="18" cy="17" r="2.2" />
        </symbol>
        {/* estela com selo — relatorio */}
        <symbol id="i-doc-selo" viewBox="0 0 24 24">
          <path d="M6 3h12v18H6z" />
          <path d="M9 8h6M9 12h4" />
          <circle cx="15" cy="16" r="2" />
        </symbol>
        {/* pizza-quartos — alocacao */}
        <symbol id="i-pizza" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18" />
        </symbol>
        {/* agentes — live */}
        <symbol id="i-agentes" viewBox="0 0 24 24">
          <circle cx="6" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="18" cy="12" r="2" />
          <path d="M8 12h2M14 12h2" />
        </symbol>
        {/* auditoria */}
        <symbol id="i-aud" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
          <path d="M8 11h6" />
        </symbol>
        {/* chevron-right */}
        <symbol id="i-chev" viewBox="0 0 24 24">
          <path d="M9 6l6 6-6 6" />
        </symbol>
        {/* check */}
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </symbol>
        {/* close */}
        <symbol id="i-close" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6L6 18" />
        </symbol>
        {/* search */}
        <symbol id="i-search" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
        </symbol>
        {/* bell */}
        <symbol id="i-bell" viewBox="0 0 24 24">
          <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4l2-2z" />
          <path d="M10 20a2 2 0 0 0 4 0" />
        </symbol>
        {/* chevron up */}
        <symbol id="i-up" viewBox="0 0 24 24">
          <path d="M6 14l6-6 6 6" />
        </symbol>
        {/* chevron down */}
        <symbol id="i-down" viewBox="0 0 24 24">
          <path d="M6 10l6 6 6-6" />
        </symbol>
        {/* arrow-right */}
        <symbol id="i-arr" viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </symbol>
        {/* arrow-left */}
        <symbol id="i-arr-l" viewBox="0 0 24 24">
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </symbol>
        {/* jazida glyph (logo) */}
        <symbol id="i-jglyph" viewBox="0 0 24 24">
          <path d="M3 6h18M3 11h18M3 16h18M3 21h18" strokeWidth="1.6" />
        </symbol>
        {/* calendar */}
        <symbol id="i-cal" viewBox="0 0 24 24">
          <path d="M4 6h16v15H4z" />
          <path d="M4 11h16M9 3v5M15 3v5" />
        </symbol>
        {/* export/download */}
        <symbol id="i-export" viewBox="0 0 24 24">
          <path d="M12 4v12M7 11l5 5 5-5" />
          <path d="M4 20h16" />
        </symbol>
        {/* dialogo / mensagem (replica) */}
        <symbol id="i-balao" viewBox="0 0 24 24">
          <path d="M4 5h16v12H8l-4 4z" />
          <path d="M8 10h8M8 13h5" />
        </symbol>
      </defs>
    </svg>
  );
}

export type IconName =
  | "i-mira"
  | "i-meg"
  | "i-cris"
  | "i-estela"
  | "i-estrato"
  | "i-caderno"
  | "i-caixa"
  | "i-broto"
  | "i-ampul"
  | "i-barra"
  | "i-pena"
  | "i-vacuo"
  | "i-mic"
  | "i-layers"
  | "i-people"
  | "i-doc-selo"
  | "i-pizza"
  | "i-agentes"
  | "i-aud"
  | "i-chev"
  | "i-check"
  | "i-close"
  | "i-search"
  | "i-bell"
  | "i-up"
  | "i-down"
  | "i-arr"
  | "i-arr-l"
  | "i-jglyph"
  | "i-cal"
  | "i-export"
  | "i-balao";

export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
  "aria-label"?: string;
};

export function Icon({
  name,
  size = 16,
  className,
  strokeWidth = 1.5,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={!rest["aria-label"]}
      {...rest}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
