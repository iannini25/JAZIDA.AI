"use client";

// /app — home do cidadao (pos-login). Sistema visual Strata.
//
// Editorial em segunda pessoa: "{nome}, a gente te ouve.".
// Big-buttons com microlabel numerado, icone monoline e hairline.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth-storage";
import { getStoredCitizenName } from "@/lib/citizen-storage";
import { logout as apiLogout } from "@/lib/api/auth";
import { Icon, type IconName } from "@/components/ui/Icons";

export default function CitizenHomePage() {
  const router = useRouter();
  const [citizenName, setCitizenName] = useState<string | null>(null);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    const auth = getStoredAuth();
    if (!auth) {
      router.replace("/");
      return;
    }
    if (auth.role !== "cidadao") {
      router.replace("/dashboard");
      return;
    }
    setCitizenName(auth.displayName.split(" ")[0] || getStoredCitizenName());
    setBootDone(true);
  }, [router]);

  async function handleLogout() {
    await apiLogout();
    clearStoredAuth();
    router.replace("/");
  }

  if (!bootDone) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex flex-col items-center gap-3 text-center">
          <Icon name="i-estrato" size={28} className="text-jazida-verde" />
          <span className="mono-s text-solo-tinta-tenue">
            carregando seu canal…
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-10 px-6 py-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="micro" style={{ color: "var(--ferro)" }}>
            § Início {citizenName ? `· ${citizenName}` : ""}
          </p>
          <h1 className="display-l mt-3 text-solo-tinta" style={{ fontSize: 32 }}>
            {citizenName
              ? `${citizenName}, a gente te ouve.`
              : "A gente te ouve."}
          </h1>
          <p className="body-l mt-3 text-solo-tinta-suave">
            Escolha de onde quer começar. Sua fala vira sinal classificado, com
            prazo de resposta e protocolo seu.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="strata-btn strata-btn-outline-solo"
          style={{ height: 32, fontSize: 12, padding: "0 12px" }}
        >
          Sair
        </button>
      </header>

      <div className="flex flex-col gap-3">
        <BigButton
          href="/app/talento"
          icon="i-mira"
          label="§ 01"
          title="Tenho um talento"
          subtitle="Diga o que sabe fazer. A gente cruza com vagas, cursos e apoios reais da sua cidade."
        />
        <BigButton
          href="/app/empreender"
          icon="i-broto"
          label="§ 02"
          title="Tenho uma ideia de negócio"
          subtitle="Conta a ideia. A equipe de investimento social analisa e te retorna pelo WhatsApp."
        />
        <BigButton
          href="/app/voz"
          icon="i-meg"
          label="§ 03"
          title="Quero reclamar ou sugerir"
          subtitle="Conta o que tá ruim ou o que pode melhorar. Geramos protocolo e acompanhamos a resposta."
        />
        <BigButton
          href="/app/historia"
          icon="i-estela"
          label="§ 04"
          title="Ver minha história"
          subtitle="Linha do tempo do que você já mandou e o que a Vale fez por causa de você."
        />
      </div>

      <div className="rule" />

      <footer className="surface-solo p-4">
        <p className="caption text-solo-tinta-tenue">
          Lei Geral de Proteção de Dados · art. 7º. Sua fala é sua. Não
          compartilhamos identidade com a mineradora sem seu OK.
        </p>
      </footer>
    </main>
  );
}

function BigButton(props: {
  href: string;
  icon: IconName;
  label: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={props.href} className="strata-big-btn group">
      <div className="flex items-center justify-between">
        <span className="micro text-solo-tinta-tenue">{props.label}</span>
        <span className="text-jazida-verde">
          <Icon name={props.icon} size={22} />
        </span>
      </div>
      <h2 className="display-s text-solo-tinta" style={{ fontSize: 22 }}>
        {props.title}
      </h2>
      <div className="h-px w-8 bg-solo-linha" />
      <p className="body-s text-solo-tinta-suave">{props.subtitle}</p>
      <div className="mt-auto flex items-center justify-end gap-1.5 text-jazida-verde">
        <span className="text-[13px] font-medium">Continuar</span>
        <Icon name="i-arr" size={14} />
      </div>
    </Link>
  );
}
