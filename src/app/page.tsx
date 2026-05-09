// Landing minima — frontend real (citizen-app + dashboard) e responsabilidade
// das outras pessoas do time. Esta rota so confirma que o servidor subiu.

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-8 py-12 font-body">
      <h1
        className="mb-2 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "var(--brand-green)" }}
      >
        JAZIDA AI
      </h1>
      <p className="text-text-secondary">
        Backend ativo. Endpoints disponiveis em <code>/api/*</code>.
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-text-primary">Smoke test rapido</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
{`# popular DB
curl -X POST http://localhost:3000/api/demo/seed

# sentimento
curl http://localhost:3000/api/dashboard/sentiment

# stream de eventos (SSE)
curl -N http://localhost:3000/api/dashboard/agent-events/stream

# disparar cenario Maria
curl -X POST http://localhost:3000/api/demo/trigger/maria_enfermagem`}
        </pre>
      </section>
    </main>
  );
}
