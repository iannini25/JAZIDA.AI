"use client";

// /app — home + onboarding modal + hacks de demo (?demo=maria|joao)

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  createCitizen,
  listCitizens,
  seedDemo,
} from "@/lib/api/citizen";
import {
  getStoredCitizenId,
  getStoredCitizenName,
  setStoredCitizen,
} from "@/lib/citizen-storage";
import type { CityId } from "@/types";

const MARIA_PREFILL =
  "alo, queria saber se minha filha de 17 anos consegue uma bolsa pra estudar enfermagem";
const JOAO_PREFILL =
  "o, esse po ta insuportavel, nao da pra deixar o carro na rua";

export default function CitizenHomePage() {
  return (
    <Suspense fallback={<BootSplash />}>
      <CitizenHome />
    </Suspense>
  );
}

function CitizenHome() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo");

  const [citizenName, setCitizenName] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [bootDone, setBootDone] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      // Hack de demo: forca cidadao + redireciona
      if (demo === "maria" || demo === "joao") {
        try {
          await seedDemo();
          const { citizens } = await listCitizens();
          const target =
            demo === "maria"
              ? citizens.find((c) =>
                  c.name.toLowerCase().includes("maria aparecida")
                ) ||
                citizens.find((c) =>
                  c.name.toLowerCase().startsWith("maria")
                )
              : citizens.find((c) =>
                  c.name.toLowerCase().includes("joao pedro")
                ) ||
                citizens.find((c) =>
                  c.name.toLowerCase().startsWith("joao")
                );
          if (target) {
            setStoredCitizen(target.id, target.name);
            const nextPath =
              demo === "maria"
                ? `/app/talento?prefill=${encodeURIComponent(MARIA_PREFILL)}`
                : `/app/voz?prefill=${encodeURIComponent(JOAO_PREFILL)}`;
            router.replace(nextPath);
            return;
          }
        } catch (err) {
          console.error("[home] demo bootstrap falhou:", err);
        }
      }

      // Caso normal: ja cadastrado?
      const id = getStoredCitizenId();
      if (id) {
        if (!cancelled) {
          setCitizenName(getStoredCitizenName());
          setBootDone(true);
        }
      } else {
        if (!cancelled) {
          setShowOnboarding(true);
          setBootDone(true);
        }
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [demo, router]);

  if (!bootDone) return <BootSplash />;

  return (
    <>
      <main className="flex flex-1 flex-col gap-8 px-6 py-10">
        <div>
          <p className="text-sm uppercase tracking-widest text-brand-green">
            JAZIDA · Mariana, MG
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

        <div className="flex flex-col gap-3">
          <BigButton
            href="/app/talento"
            emoji="🎯"
            title="Tenho um talento"
            subtitle="ou um sonho que quero realizar"
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

      <AnimatePresence>
        {showOnboarding && (
          <OnboardingModal
            onDone={(name) => {
              setCitizenName(name);
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function BootSplash() {
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

function BigButton(props: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={props.href}
      className="group flex min-h-[80px] items-center gap-4 rounded-2xl border-2 border-brand-green/15 bg-white p-4 transition-all hover:border-brand-green hover:shadow-md"
    >
      <span className="text-3xl" aria-hidden>
        {props.emoji}
      </span>
      <div className="flex-1">
        <h2 className="text-lg font-bold text-text-primary group-hover:text-brand-green">
          {props.title}
        </h2>
        <p className="text-sm text-text-secondary">{props.subtitle}</p>
      </div>
      <span className="text-2xl text-brand-green">→</span>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────
// Onboarding modal — pede nome + bairro na primeira visita
// ──────────────────────────────────────────────────────────
function OnboardingModal({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const cityId: CityId = "mariana";

  async function submit() {
    if (!name.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const citizen = await createCitizen({
        name: name.trim(),
        neighborhood: neighborhood.trim() || undefined,
        cityId,
      });
      setStoredCitizen(citizen.id, citizen.name);
      onDone(citizen.name.split(" ")[0]);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Nao deu pra te cadastrar agora."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 22 }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <p className="text-xs uppercase tracking-widest text-brand-green">
          Bem-vindo ao JAZIDA
        </p>
        <h3
          className="mt-1 text-xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Como posso te chamar?
        </h3>
        <p className="mt-1 text-sm text-text-secondary">
          So pra eu te tratar pelo nome. Sem cadastro, sem CPF.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
            Seu nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Maria"
              className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-text-primary">
            Seu bairro <span className="text-xs text-text-secondary">(opcional)</span>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="ex: Centro"
              className="h-12 rounded-xl border border-gray-200 bg-white px-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30"
            />
          </label>
          {err && <p className="text-sm text-accent-red">{err}</p>}
          <button
            type="button"
            disabled={loading || !name.trim()}
            onClick={submit}
            className="mt-1 flex min-h-[56px] items-center justify-center rounded-2xl bg-brand-green px-4 text-base font-semibold text-white disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Bora!"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
