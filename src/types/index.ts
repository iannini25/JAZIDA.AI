// JAZIDA AI — tipos compartilhados (fonte da verdade do contrato)
// Frontend e backend importam daqui via @/types
//
// Estes tipos seguem 1:1 o `00_contexto_master.md` — qualquer divergencia
// e bug. Nao adicione campos no top-level sem alinhar com o master; campos
// extras locais (ex: status interno) ficam em modulos separados, nao aqui.

export type CityId = "mariana" | "itabira" | "paracatu" | "araxa";

// ──────────────────────────────────────────────────────────
// Auth & Usuarios
// ──────────────────────────────────────────────────────────
export type UserRole = "cidadao" | "funcionario";

export type User = {
  id: string;
  username: string;
  passwordHash: string; // hash simples (hackathon — nao usar em prod)
  role: UserRole;
  citizenId?: string; // se role=cidadao, vincula ao cidadao
  displayName: string;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  role: UserRole;
  expiresAt: string;
};

// ──────────────────────────────────────────────────────────
// Rate Limiting
// ──────────────────────────────────────────────────────────
export type RateLimitEntry = {
  userId: string;
  action: string; // "talent" | "complaint" | "idea"
  timestamps: string[]; // ISO timestamps das acoes
};

// ──────────────────────────────────────────────────────────
// Aprovacao de matches (Bussola -> Dashboard -> Cidadao)
// ──────────────────────────────────────────────────────────
export type MatchApprovalStatus = "pending" | "approved" | "rejected";

// ──────────────────────────────────────────────────────────
// Cidadao
// ──────────────────────────────────────────────────────────
export type Citizen = {
  id: string; // nanoid
  cityId: CityId;
  name: string;
  age?: number;
  neighborhood?: string;
  phone?: string;
  occupation?: string;
  createdAt: string; // ISO
};

// ──────────────────────────────────────────────────────────
// Talento (Talento agent + Bussola agent)
// ──────────────────────────────────────────────────────────
export type TalentType =
  | "skill"
  | "aspiration"
  | "best_at"
  | "want_to_learn";

export type BussolaMatch = {
  type: "course" | "job" | "entrepreneurship";
  title: string;
  description: string;
  duration?: string;
  cost?: string;
  link?: string;
  fitScore: number; // 0-1
};

export type TalentEntry = {
  id: string;
  citizenId: string;
  rawInput: string;
  type: TalentType;
  structured: {
    label: string;
    category: string;
    confidence: number; // 0-1
  };
  matches?: BussolaMatch[];
  matchApprovalStatus?: MatchApprovalStatus; // pending=aguardando aprovacao no dashboard
  matchApprovedBy?: string; // username de quem aprovou
  createdAt: string;
};

// ──────────────────────────────────────────────────────────
// Queixa / Sugestao (Voz)
// ──────────────────────────────────────────────────────────
export type ComplaintType = "complaint" | "suggestion";
export type ComplaintUrgency = "low" | "medium" | "high";
export type ComplaintImpact = "individual" | "collective";
export type ComplaintStatus = "open" | "in_progress" | "resolved";

export type Complaint = {
  id: string;
  citizenId: string;
  rawInput: string;
  type: ComplaintType;
  classification: {
    category: string;
    urgency: ComplaintUrgency;
    impact: ComplaintImpact;
    neighborhood?: string;
  };
  protocolNumber: string; // ex: "JZD-2026-00123"
  status: ComplaintStatus;
  resolvedAction?: string;
  createdAt: string;
};

// ──────────────────────────────────────────────────────────
// Eventos de agent (feed live do dashboard)
// ──────────────────────────────────────────────────────────
export type AgentName =
  | "Acolhida"
  | "Talento"
  | "Voz"
  | "Bussola"
  | "Replica"
  | "Pulsar"
  | "Pacto"
  | "Semente";

export type AgentEvent = {
  id: string;
  agentName: AgentName;
  action: string; // texto humano: "Classificou aspiracao: enfermagem"
  citizenId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
  timestamp: string;
};

// ──────────────────────────────────────────────────────────
// Sentimento (Pulsar)
// ──────────────────────────────────────────────────────────
export type SentimentSnapshot = {
  current: number; // -1 a +1
  trend: "up" | "down" | "stable";
  topThemes: { label: string; sentiment: number; count: number }[];
  byNeighborhood: { name: string; sentiment: number }[];
  generatedAt: string;
};

// ──────────────────────────────────────────────────────────
// Alertas (Vigia — entrega via dashboard como Alert)
// ──────────────────────────────────────────────────────────
export type Alert = {
  id: string;
  level: "warning" | "alert" | "critical";
  title: string;
  description: string;
  recommendedAction: string;
  createdAt: string;
};

// ──────────────────────────────────────────────────────────
// ESG report (Pacto)
// ──────────────────────────────────────────────────────────
export type ESGFramework = "CSRD" | "CVM59" | "GRI" | "ICMM";

export type ESGReportFragment = {
  section: string; // ex: "Engajamento Comunitario"
  framework: ESGFramework;
  content: string; // texto gerado (markdown)
  evidence: { type: string; reference: string }[];
};

// ──────────────────────────────────────────────────────────
// Empreendedorismo / Just Transition (Semente)
// ──────────────────────────────────────────────────────────
export type BusinessCategory =
  | "comercio/alimentacao"
  | "comercio/varejo"
  | "servicos/beleza"
  | "servicos/saude"
  | "servicos/educacao"
  | "servicos/manutencao"
  | "industria/artesanato"
  | "agricultura"
  | "tecnologia"
  | "transporte"
  | "turismo"
  | "moda/costura"
  | "construcao"
  | "outro";

export type LegalForm = "MEI" | "ME" | "EI" | "EIRELI";

export type BusinessIdeaStructured = {
  title: string;
  category: BusinessCategory | string;
  description: string;
  targetCustomer: string;
  estimatedCapex: { min: number; max: number };
  estimatedMonthlyRevenue: { min: number; max: number };
  estimatedPaybackMonths: number;
  suggestedLegalForm: LegalForm;
};

export type MarketAnalysis = {
  demandSignal: {
    score: number; // 0-100
    evidence: string;
    relatedTalents: number;
  };
  competitionLevel: "none" | "low" | "medium" | "saturated";
  competitionEvidence: string;
  localContentMatch?: {
    potential: boolean;
    description: string;
  };
};

export type IdeaVerdictLevel = "go" | "adjust" | "pivot";

export type IdeaVerdict = {
  score: number; // 0-100
  level: IdeaVerdictLevel;
  headline: string;
  reasoning: string;
};

export type ActionStep = {
  order: number;
  title: string;
  description: string;
  estimatedTime: string;
  link?: string;
};

export type FundingOpportunity = {
  name: string;
  type: "grant" | "loan" | "training";
  amount?: string;
  eligibility: string;
  contactInfo?: string;
};

export type ActionPlan = {
  nextSteps: ActionStep[];
  fundingOpportunities: FundingOpportunity[];
};

export type BusinessIdeaStatus =
  | "pending"
  | "analyzed"
  | "submitted_to_funding";

export type BusinessIdea = {
  id: string;
  citizenId: string;
  rawInput: string;
  structured: BusinessIdeaStructured;
  marketAnalysis: MarketAnalysis;
  verdict: IdeaVerdict;
  actionPlan: ActionPlan;
  status: BusinessIdeaStatus;
  createdAt: string;
};

// Para agregacao no dashboard
export type OpportunityAggregate = {
  category: string;
  pendingIdeasCount: number;
  highFitCount: number;
  totalCapexNeeded: { min: number; max: number };
  topIdeas: BusinessIdea[];
};

// ──────────────────────────────────────────────────────────
// Replica (mensagens aprovadas para envio)
// Nao esta no master como tipo principal — usado internamente.
// ──────────────────────────────────────────────────────────
export type ReplicaMessage = {
  id: string;
  citizenId: string;
  trigger: "complaint_resolved" | "talent_matched" | "manual";
  triggerId?: string;
  message: string;
  approvedBy?: string;
  status: "draft" | "approved" | "sent";
  createdAt: string;
  sentAt?: string;
};

// ──────────────────────────────────────────────────────────
// Timeline / historico do cidadao
// ──────────────────────────────────────────────────────────
export type HistoryItem =
  | { kind: "talent"; data: TalentEntry }
  | { kind: "complaint"; data: Complaint }
  | { kind: "replica"; data: ReplicaMessage }
  | { kind: "idea"; data: BusinessIdea };

export type CitizenHistory = {
  citizen: Citizen;
  items: HistoryItem[];
};

// ──────────────────────────────────────────────────────────
// Cenarios de demo
// ──────────────────────────────────────────────────────────
export type DemoScenario =
  | "maria_enfermagem"
  | "joaozinho_poeira"
  | "beatriz_costura";
