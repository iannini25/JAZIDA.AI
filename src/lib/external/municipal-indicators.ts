// Indicadores municipais externos (dados publicos: IBGE Cidades + INEP +
// ANM CFEM + DataSUS). Hash hardcoded — em producao seria fetch periodico
// das fontes oficiais.
//
// Fontes que serao integradas no roadmap:
//   - IBGE Cidades (https://cidades.ibge.gov.br/) — IDH, populacao, PIB
//   - INEP — IDEB, evasao escolar, taxa de analfabetismo
//   - ANM (https://sistemas.anm.gov.br/arrecadacao/) — CFEM por municipio
//   - DataSUS — mortalidade, doencas respiratorias, saneamento
//   - Tesouro Transparente — receitas e despesas municipais

import type { CityId } from "@/types";

export type MunicipalIndicators = {
  cityId: CityId;
  populacao: number;
  idh: number; // 0-1
  ideb: number; // 0-10 (anos finais ensino fundamental)
  pibMunicipal: number; // R$
  evasaoEscolar: number; // 0-1 (taxa de abandono ensino medio)
  cfemAnualReceived: number; // R$ (CFEM repassada ao municipio no ultimo ano)
  saneamentoBasico: number; // 0-1 (% de domicilios com agua encanada e esgoto tratado)
  doencasRespiratorias: number; // taxa por 100k habitantes (DataSUS)
  dependenciaMineral: number; // 0-1 (% do PIB que vem direto da mineracao)
  // metadados
  ibgeCode: string;
  uf: string;
  populacaoEstimadaIBGE: number;
  lastUpdated: string;
};

const INDICATORS: Record<CityId, MunicipalIndicators> = {
  mariana: {
    cityId: "mariana",
    populacao: 60_104,
    idh: 0.742,
    ideb: 5.4,
    pibMunicipal: 1_980_000_000,
    evasaoEscolar: 0.087,
    cfemAnualReceived: 38_500_000,
    saneamentoBasico: 0.71,
    doencasRespiratorias: 412,
    dependenciaMineral: 0.62,
    ibgeCode: "3140100",
    uf: "MG",
    populacaoEstimadaIBGE: 62_404,
    lastUpdated: "2025-12-01",
  },
  itabira: {
    cityId: "itabira",
    populacao: 119_174,
    idh: 0.756,
    ideb: 5.6,
    pibMunicipal: 4_120_000_000,
    evasaoEscolar: 0.076,
    cfemAnualReceived: 89_300_000,
    saneamentoBasico: 0.78,
    doencasRespiratorias: 385,
    dependenciaMineral: 0.71,
    ibgeCode: "3131307",
    uf: "MG",
    populacaoEstimadaIBGE: 121_004,
    lastUpdated: "2025-12-01",
  },
  paracatu: {
    cityId: "paracatu",
    populacao: 95_187,
    idh: 0.744,
    ideb: 5.2,
    pibMunicipal: 2_640_000_000,
    evasaoEscolar: 0.092,
    cfemAnualReceived: 41_700_000,
    saneamentoBasico: 0.69,
    doencasRespiratorias: 358,
    dependenciaMineral: 0.55,
    ibgeCode: "3147006",
    uf: "MG",
    populacaoEstimadaIBGE: 96_402,
    lastUpdated: "2025-12-01",
  },
  araxa: {
    cityId: "araxa",
    populacao: 105_512,
    idh: 0.772,
    ideb: 5.8,
    pibMunicipal: 3_180_000_000,
    evasaoEscolar: 0.069,
    cfemAnualReceived: 67_900_000,
    saneamentoBasico: 0.83,
    doencasRespiratorias: 297,
    dependenciaMineral: 0.48,
    ibgeCode: "3103504",
    uf: "MG",
    populacaoEstimadaIBGE: 107_310,
    lastUpdated: "2025-12-01",
  },
};

export function getMunicipalIndicators(
  cityId: CityId
): MunicipalIndicators | null {
  return INDICATORS[cityId] || null;
}

export function listAllIndicators(): MunicipalIndicators[] {
  return Object.values(INDICATORS);
}

// Helpers de formatacao em PT-BR pra economizar codigo no UI.
export function formatBRL(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (value >= 1_000_000_000) return `R$ ${(value / 1_000_000_000).toFixed(1)} bi`;
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)} mi`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return `R$ ${value.toLocaleString("pt-BR")}`;
}

export function formatPct(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
