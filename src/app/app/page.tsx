"use client";

// /app — home do cidadao (pos-login). Mostra acoes disponiveis.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getStoredAuth, clearStoredAuth } from "@/lib/auth-storage";
import { getStoredCitizenName } from "@/lib/citizen-storage";
import { logout as apiLogout } from "@/lib/api/auth";

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
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-3xl">🌱</span>
          <span className="font-mono text-xs text-text-secondary">
            carregando seu canal...
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-widest text-brand-green">
            JAZIDA . Mariana, MG
          </p>
          <h1
            className="mt-2 text-3xl font-bold leading-tight text-text-primary"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Sua voz, sua cidade,
            <br />
            suas oportunidades.
          </h1>
          {citizenName && (
            <p className="mt-3 text-base text-text-primary">
              E ai, <strong>{citizenName}</strong>! To aqui contigo. Que cabeca
              hoje?
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-text-secondary hover:bg-gray-100"
        >
          Sair
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <BigButton
          href="/app/talento"
          emoji="🎯"
          title="Tenho um talento"
          subtitle="ou um sonho que quero realizar"
        />
        <BigButton
          href="/app/empreender"
          emoji="💡"
          title="Tenho uma ideia de negocio"
          subtitle="quero saber se vale a pena"
          badge="novo"
        />
        <BigButton
          href="/app/voz"
          emoji="📢"
          title="Quero reclamar / sugerir"
          subtitle="alguma coisa na cidade"
        />
        <BigButton
          href="/app/historia"
          emoji="📋"
          title="Ver minha historia"
          subtitle="o que ja foi feito por causa de voce"
        />
      </div>

      <p className="mt-auto rounded-2xl bg-brand-bg p-4 text-xs leading-relaxed text-text-secondary">
        O JAZIDA escuta cada cidadao e mostra pra mineradora o que voce ta
        dizendo. Ninguem fica de fora.
      </p>
    </main>
  );
}

function BigButton(props: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  badge?: string;
}) {
  return (
    <Link
      href={props.href}
      className="group relative flex min-h-[80px] items-center gap-4 rounded-2xl border-2 border-brand-green/15 bg-white p-4 transition-all hover:border-brand-green hover:shadow-md"
    >
      <span className="text-3xl" aria-hidden>
        {props.emoji}
      </span>
      <div className="flex-1">
        <h2 className="flex items-center gap-2 text-lg font-bold text-text-primary group-hover:text-brand-green">
          {props.title}
          {props.badge && (
            <span className="rounded-full bg-brand-green px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              {props.badge}
            </span>
          )}
        </h2>
        <p className="text-sm text-text-secondary">{props.subtitle}</p>
      </div>
      <span className="text-2xl text-brand-green">→</span>
    </Link>
  );
}
