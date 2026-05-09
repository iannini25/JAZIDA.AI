"use client";

// Header reutilizavel das telas internas do app (com botao voltar opcional).
import Link from "next/link";
import { useRouter } from "next/navigation";

type AppHeaderProps = {
  title?: string;
  back?: string | true; // se string vai pra rota; se true usa router.back()
};

export function AppHeader({ title, back }: AppHeaderProps) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">
      {back && (
        typeof back === "string" ? (
          <Link
            href={back}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary hover:bg-gray-100"
          >
            <ArrowLeft />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-primary hover:bg-gray-100"
          >
            <ArrowLeft />
          </button>
        )
      )}
      <Link
        href="/app"
        className="flex items-center gap-2 text-brand-green"
        aria-label="Inicio do JAZIDA"
      >
        <Logo />
        <span className="text-sm font-bold tracking-wide" style={{ fontFamily: "var(--font-display)" }}>
          JAZIDA
        </span>
      </Link>
      {title && (
        <span className="ml-auto text-sm font-semibold text-text-secondary">
          {title}
        </span>
      )}
    </header>
  );
}

function ArrowLeft() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function Logo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 2 L4 8 V20 H20 V8 Z" />
      <path d="M9 14 H15" />
      <path d="M9 18 H15" />
    </svg>
  );
}
