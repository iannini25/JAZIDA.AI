"use client";

// /dashboard/canais — canais de captura de sinal comunitário.
// Stub editorial mostrando arquitetura: hoje rodamos app proprietário +
// WhatsApp via Twilio em piloto; demais canais em integração.

import { Icon, type IconName } from "@/components/ui/Icons";

type ChannelStatus = "conectado" | "piloto" | "em-integracao";

type Channel = {
  id: string;
  icon: IconName;
  title: string;
  description: string;
  status: ChannelStatus;
  signalsCaptured?: number; // últimos 30 dias
  technicalNote?: string;
  partner?: string;
};

const CHANNELS: Channel[] = [
  {
    id: "app",
    icon: "i-jglyph",
    title: "App proprietário JAZIDA",
    description:
      "Web responsivo mobile-first. Cidadãos enviam talento, queixa, sugestão e ideia de negócio. Protocolo formal emitido em todas as queixas (Resolução ANM 95/2022).",
    status: "conectado",
    signalsCaptured: 1_420,
    technicalNote:
      "Next.js 14 + Tailwind. Hosted no mesmo deployment do dashboard.",
  },
  {
    id: "whatsapp",
    icon: "i-balao",
    title: "WhatsApp das associações",
    description:
      "Bot WhatsApp via Twilio Conversations API. Recebe áudios, textos e fotos de moradores. Réplicas humanizadas saem pela mesma linha.",
    status: "piloto",
    signalsCaptured: 287,
    partner: "Twilio Brasil · piloto em 1 distrito",
    technicalNote:
      "Webhook /api/integrations/twilio recebe mensagem → Acolhida → roteamento. Áudio transcrito via Whisper.",
  },
  {
    id: "ouvidoria",
    icon: "i-doc-selo",
    title: "Ouvidoria oficial municipal",
    description:
      "Integração com sistemas SEI/Ouvidor da Prefeitura. Importa queixas formais já protocoladas e cruza com sinais informais para evitar duplicação.",
    status: "em-integracao",
    partner: "Prefeitura de Mariana · MOU em assinatura",
    technicalNote:
      "Endpoint planejado: GET /api/integrations/ouvidoria/sei. Schema do Tribunal de Contas MG.",
  },
  {
    id: "audiencias",
    icon: "i-people",
    title: "Audiências públicas",
    description:
      "Transcrição automática (Whisper) das atas de audiências obrigatórias do licenciamento. Topic modeling identifica demandas recorrentes não-atendidas.",
    status: "em-integracao",
    technicalNote:
      "Pipeline: gravação MP3 → Whisper → Acolhida → Voz. Histórico desde 2018.",
  },
  {
    id: "redes-sociais",
    icon: "i-meg",
    title: "Redes sociais",
    description:
      "Monitoramento de menções à mineradora e a hashtags do município no Twitter/X, Instagram e Facebook. Sentimento + clusterização de temas.",
    status: "em-integracao",
    partner: "Brand24 · Stilingue · piloto Q3",
    technicalNote:
      "Webhook /api/integrations/social. Filtro: menções com geo-tag em raio de 30 km.",
  },
  {
    id: "ministerio-publico",
    icon: "i-aud",
    title: "Ministério Público + ações civis",
    description:
      "Dossier de ações civis públicas em curso contra a mineradora. Cada ação vinculada a condicionantes do licenciamento e a sinais comunitários.",
    status: "em-integracao",
    partner: "MPMG · acesso público a procedimentos",
    technicalNote:
      "Crawler em sistemas judiciais públicos do TJMG + MPMG. JSON normalizado por número de inquérito.",
  },
];

const STATUS_META: Record<
  ChannelStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  conectado: {
    label: "conectado",
    color: "var(--jazida-verde)",
    bg: "rgba(63,128,96,0.12)",
    border: "rgba(63,128,96,0.45)",
  },
  piloto: {
    label: "em piloto",
    color: "var(--ferro)",
    bg: "rgba(180,90,44,0.12)",
    border: "rgba(180,90,44,0.40)",
  },
  "em-integracao": {
    label: "em integração",
    color: "var(--sinal-info)",
    bg: "rgba(61,111,143,0.12)",
    border: "rgba(61,111,143,0.40)",
  },
};

export default function CanaisPage() {
  return (
    <div className="flex flex-col">
      <header className="border-b border-solo-linha bg-solo-papel-claro px-6 py-5">
        <p className="micro" style={{ color: "var(--ferro)" }}>
          Arquitetura de captura · Mariana, MG
        </p>
        <h1 className="display-m mt-1 text-solo-tinta" style={{ fontSize: 22 }}>
          Canais de captura de sinal comunitário
        </h1>
        <p className="body-s mt-2 max-w-3xl text-solo-tinta-suave">
          A escuta multi-canal é o pilar do JAZIDA: nenhum canal sozinho captura
          o que está acontecendo no município. Por isso integramos canais
          oficiais (ouvidoria, audiências), proprietários (app + WhatsApp) e
          terceiros (redes sociais, MP). Cada sinal, independente do canal,
          passa pela mesma cadeia de agentes (Acolhida → Voz → Pulsar) e gera
          protocolo único.
        </p>
      </header>

      <main className="flex-1 px-6 py-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {CHANNELS.map((c) => (
            <ChannelCard key={c.id} channel={c} />
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-[1400px] rounded-[10px] border border-solo-linha bg-solo-papel-claro p-5">
          <p className="micro" style={{ color: "var(--ferro)" }}>
            Roadmap de integração
          </p>
          <h3
            className="display-s mt-1 text-solo-tinta"
            style={{ fontSize: 18 }}
          >
            Por que multi-canal é o moat
          </h3>
          <p className="body-s mt-2 max-w-3xl text-solo-tinta-suave">
            Um cidadão não escolhe onde fala — fala onde é mais fácil. O moat
            do JAZIDA é juntar fragmentos do mesmo cidadão de canais distintos
            (queixa formal na ouvidoria + áudio no WhatsApp + comentário no
            Instagram) e tratá-los como UMA conversa, com protocolo único e
            histórico contínuo. Empresa-tradicional precisa contratar 4
            ferramentas + 1 analista; aqui é 1 plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}

function ChannelCard({ channel: c }: { channel: Channel }) {
  const meta = STATUS_META[c.status];
  return (
    <article
      className="flex h-full flex-col gap-3 rounded-[10px] border bg-solo-papel-claro p-5"
      style={{ borderColor: meta.border, borderTopWidth: 3 }}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span style={{ color: meta.color }}>
            <Icon name={c.icon} size={22} />
          </span>
          <h3
            className="display-s text-solo-tinta"
            style={{ fontSize: 17 }}
          >
            {c.title}
          </h3>
        </div>
        <span
          className="strata-chip shrink-0"
          style={{
            color: meta.color,
            borderColor: meta.border,
            background: meta.bg,
            fontSize: 10,
          }}
        >
          [{meta.label}]
        </span>
      </header>

      <p className="body-s leading-relaxed text-solo-tinta-suave">
        {c.description}
      </p>

      {c.signalsCaptured !== undefined && (
        <div className="flex items-baseline gap-2 border-t border-solo-linha pt-3">
          <span className="micro text-solo-tinta-tenue">sinais 30d</span>
          <span className="mono-m font-medium" style={{ fontSize: 16 }}>
            {c.signalsCaptured.toLocaleString("pt-BR")}
          </span>
        </div>
      )}

      {(c.partner || c.technicalNote) && (
        <footer className="mt-auto border-t border-solo-linha pt-3">
          {c.partner && (
            <p className="caption text-ferro">{c.partner}</p>
          )}
          {c.technicalNote && (
            <p className="caption mt-1 italic text-solo-tinta-tenue">
              {c.technicalNote}
            </p>
          )}
        </footer>
      )}
    </article>
  );
}
