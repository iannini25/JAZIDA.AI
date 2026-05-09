// Seed: 5 cidadaos pre-populados de Mariana (MG) conforme `00_contexto_master.md`.
// Idempotente — pode chamar varias vezes sem duplicar.

import {
  db,
  emitAgentEvent,
  genProtocolNumber,
  newId,
  nowIso,
  saveDb,
} from "@/lib/db";
import type {
  Alert,
  Citizen,
  Complaint,
  TalentEntry,
} from "@/types";

const CITY = "mariana" as const;

function makeCitizen(name: string, fields: Partial<Citizen>): Citizen {
  return {
    id: newId(),
    cityId: CITY,
    name,
    createdAt: nowIso(),
    ...fields,
  };
}

export function runSeed(): {
  citizens: Citizen[];
  talents: TalentEntry[];
  complaints: Complaint[];
  alerts: Alert[];
} {
  // Idempotente
  if (db.citizens.length > 0) {
    return {
      citizens: db.citizens,
      talents: db.talents,
      complaints: db.complaints,
      alerts: db.alerts,
    };
  }

  // 5 cidadaos do master
  const maria = makeCitizen("Maria Aparecida", {
    age: 47,
    neighborhood: "Santo Antonio",
    occupation: "Dona de casa",
    phone: "+5531999990001",
  });

  const joao = makeCitizen("Joao Pedro Silva", {
    age: 38,
    neighborhood: "Centro",
    occupation: "Padeiro",
    phone: "+5531999990002",
  });

  const ana = makeCitizen("Ana Lucia Ferreira", {
    age: 34,
    neighborhood: "Cabanas",
    occupation: "Professora",
    phone: "+5531999990003",
  });

  const carlos = makeCitizen("Carlos Eduardo Souza", {
    age: 67,
    neighborhood: "Santa Cruz",
    occupation: "Mineiro aposentado",
    phone: "+5531999990004",
  });

  const beatriz = makeCitizen("Beatriz Oliveira", {
    age: 19,
    neighborhood: "Cabanas",
    occupation: "Estudante",
    phone: "+5531999990005",
  });

  db.citizens.push(maria, joao, ana, carlos, beatriz);

  // Talento da Maria — pesquisa pra filha de 17 anos (cenario 1 do master)
  const talentMaria: TalentEntry = {
    id: newId(),
    citizenId: maria.id,
    rawInput:
      "alo, queria saber se minha filha de 17 anos consegue uma bolsa pra estudar enfermagem",
    type: "aspiration",
    structured: {
      label: "enfermagem",
      category: "saude",
      confidence: 0.92,
    },
    matches: [
      {
        type: "course",
        title: "Curso Tecnico em Enfermagem - SENAI Mariana",
        description:
          "24 meses, com bolsa integral via Vale Fundacao. Estagio supervisionado no Hospital Monsenhor Horta.",
        duration: "24 meses",
        cost: "Bolsa Vale Fundacao - R$ 0",
        fitScore: 0.95,
      },
      {
        type: "job",
        title: "Auxiliar de Enfermagem - Hospital Monsenhor Horta",
        description: "CLT, 8 vagas abertas. Plantao 12x36.",
        cost: "Salario inicial R$ 1.850 + beneficios",
        fitScore: 0.78,
      },
      {
        type: "entrepreneurship",
        title: "Sebrae Saude Domiciliar",
        description:
          "Programa de microempreendedorismo em cuidados domiciliares (6 meses).",
        duration: "6 meses",
        cost: "Gratuito",
        fitScore: 0.62,
      },
    ],
    createdAt: nowIso(),
  };

  // Talento de Beatriz — quer aprender programacao
  const talentBeatriz: TalentEntry = {
    id: newId(),
    citizenId: beatriz.id,
    rawInput:
      "Sempre quis aprender a programar, fazer um app que ajude a cidade.",
    type: "want_to_learn",
    structured: {
      label: "programacao",
      category: "tecnologia",
      confidence: 0.88,
    },
    matches: [
      {
        type: "course",
        title: "Logica de Programacao - SENAI Mariana",
        description:
          "Curso introdutorio de 3 meses, presencial em Mariana.",
        duration: "3 meses",
        cost: "Gratuito (bolsa Pronatec)",
        fitScore: 0.9,
      },
    ],
    createdAt: nowIso(),
  };

  db.talents.push(talentMaria, talentBeatriz);

  // Queixa do Joao — poeira no Centro (cenario 2 do master)
  const complaintJoao: Complaint = {
    id: newId(),
    citizenId: joao.id,
    rawInput:
      "o, esse po ta insuportavel, nao da pra deixar o carro na rua",
    type: "complaint",
    classification: {
      category: "ar/poeira",
      urgency: "medium",
      impact: "collective",
      neighborhood: "Centro",
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };

  // Mais 7 queixas de poeira no Centro pra Pulsar detectar tendencia (8 total = +40%)
  const proxyComplaints: Complaint[] = Array.from({ length: 7 }).map((_, i) => ({
    id: newId(),
    citizenId: [maria.id, ana.id, carlos.id, joao.id][i % 4],
    rawInput: [
      "Poeira nao para. Tive que fechar a janela toda hora.",
      "A roupa no varal fica preta de fuligem.",
      "Minha filha esta com tosse seca, suspeito que seja a poeira.",
      "Comercio do centro perdendo cliente por causa do po.",
      "Limpo o balcao da padaria a cada 2h. Nunca foi assim.",
      "Detonacao de manha cedo levantou poeira ate aqui.",
      "Caminhao da mineradora passa cheio e larga material no asfalto.",
    ][i],
    type: "complaint",
    classification: {
      category: "ar/poeira",
      urgency: i < 3 ? "high" : "medium",
      impact: "collective",
      neighborhood: "Centro",
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  }));

  // Sugestao da Ana
  const suggestionAna: Complaint = {
    id: newId(),
    citizenId: ana.id,
    rawInput:
      "Devia ter um curso de gastronomia local pra mulheres do bairro, com receita da terra.",
    type: "suggestion",
    classification: {
      category: "educacao-publica",
      urgency: "low",
      impact: "collective",
      neighborhood: "Cabanas",
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };

  // Queixa de Carlos — caminhoes de madrugada
  const complaintCarlos: Complaint = {
    id: newId(),
    citizenId: carlos.id,
    rawInput:
      "Os caminhao passam de madrugada e tremem a casa toda. Crianca nao dorme.",
    type: "complaint",
    classification: {
      category: "ruido",
      urgency: "medium",
      impact: "collective",
      neighborhood: "Santa Cruz",
    },
    protocolNumber: genProtocolNumber(),
    status: "open",
    createdAt: nowIso(),
  };

  db.complaints.push(
    complaintJoao,
    ...proxyComplaints,
    suggestionAna,
    complaintCarlos
  );

  // Alerta inicial do Vigia (master nao tem 'vigia' como agentName,
  // entao o alerta vai como Alert do dashboard com level=alert)
  const alertPoeira: Alert = {
    id: newId(),
    level: "alert",
    title: "Centro: poeira escalando",
    description:
      "8 queixas relacionadas a ar/poeira no bairro Centro nas ultimas 24h (+40% vs base).",
    recommendedAction:
      "Reduzir frequencia de detonacao no turno da manha e aumentar molhagem das vias.",
    createdAt: nowIso(),
  };
  db.alerts.push(alertPoeira);

  // Eventos de agent representativos (agentName capitalizado conforme master)
  emitAgentEvent({
    id: newId(),
    agentName: "Talento",
    citizenId: maria.id,
    action: "Estruturou aspiracao: enfermagem (saude, conf 0.92)",
    payload: { talentId: talentMaria.id },
    timestamp: nowIso(),
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Bussola",
    citizenId: maria.id,
    action: "3 matches gerados (SENAI, Hospital Monsenhor Horta, Sebrae)",
    payload: { talentId: talentMaria.id, count: 3 },
    timestamp: nowIso(),
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Voz",
    citizenId: joao.id,
    action: "Classificou queixa: ar/poeira, Centro, urgencia media",
    payload: { complaintId: complaintJoao.id },
    timestamp: nowIso(),
  });
  emitAgentEvent({
    id: newId(),
    agentName: "Pulsar",
    action: "Tema 'ar/poeira' subiu 40% no Centro (8 sinais em 24h)",
    payload: { theme: "ar/poeira", neighborhood: "Centro", deltaPct: 40 },
    timestamp: nowIso(),
  });

  saveDb();

  return {
    citizens: db.citizens,
    talents: db.talents,
    complaints: db.complaints,
    alerts: db.alerts,
  };
}
