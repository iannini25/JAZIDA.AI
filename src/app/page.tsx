// Landing root — redireciona pro app do cidadao por default.
// Dashboard e backend tem seus proprios paths.

import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <div>
        <p className="text-sm uppercase tracking-widest text-brand-green">
          JAZIDA AI
        </p>
        <h1
          className="mt-2 text-4xl font-bold text-text-primary"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Sua voz, sua cidade, suas oportunidades.
        </h1>
        <p className="mt-2 text-text-secondary">
          Plataforma multi-agent de inteligencia comunitaria pra cidades-mineracao no Brasil.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Surface href="/app" emoji="📱" title="App do Cidadao" subtitle="cadastrar talento, mandar queixa" />
        <Surface href="/dashboard" emoji="📊" title="Dashboard" subtitle="(em construcao pelas outras pessoas)" />
        <Surface href="/api/dashboard/sentiment" emoji="🛠️" title="API" subtitle="REST + SSE em /api/*" />
      </div>

      <section className="rounded-2xl bg-white p-5 text-sm">
        <h2 className="text-lg font-semibold text-text-primary">Demo rapido</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-text-primary">
          <li>
            <Link className="text-brand-green underline" href="/app?demo=maria">
              /app?demo=maria
            </Link>
            {" — "}cadastra Maria e ja vai pra tela de talento com texto
            pre-preenchido
          </li>
          <li>
            <Link className="text-brand-green underline" href="/app?demo=joao">
              /app?demo=joao
            </Link>
            {" — "}cadastra Joao e vai pra tela de voz com queixa de poeira
          </li>
        </ul>
      </section>
    </main>
  );
}

function Surface(props: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={props.href}
      className="group flex min-h-[112px] flex-col gap-2 rounded-2xl border-2 border-brand-green/15 bg-white p-4 transition-all hover:border-brand-green hover:shadow-md"
    >
      <span className="text-2xl" aria-hidden>
        {props.emoji}
      </span>
      <h3 className="text-base font-bold text-text-primary group-hover:text-brand-green">
        {props.title}
      </h3>
      <p className="text-xs text-text-secondary">{props.subtitle}</p>
    </Link>
  );
}
