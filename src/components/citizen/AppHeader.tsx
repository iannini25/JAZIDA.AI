"use client";

// Header do app cidadao. Estilo Strata: hairline + glifo Jazida + microlabel cidade.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icons";

type AppHeaderProps = {
  title?: string;
  back?: string | true;
};

export function AppHeader({ title, back }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-solo-linha bg-solo-papel/95 px-5 py-4 backdrop-blur">
      {back && (
        typeof back === "string" ? (
          <Link
            href={back}
            aria-label="Voltar"
            className="flex h-9 w-9 items-center justify-center rounded-md text-solo-tinta hover:bg-solo-papel-fundo"
          >
            <Icon name="i-arr-l" size={18} />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.back()}
            className="flex h-9 w-9 items-center justify-center rounded-md text-solo-tinta hover:bg-solo-papel-fundo"
          >
            <Icon name="i-arr-l" size={18} />
          </button>
        )
      )}
      <Link
        href="/app"
        className="flex items-center gap-2 text-jazida-verde"
        aria-label="Inicio do JAZIDA"
      >
        <Icon name="i-jglyph" size={18} />
        <span className="display-s text-jazida-verde" style={{ fontSize: 18 }}>
          Jazida
        </span>
      </Link>
      {title ? (
        <span className="ml-auto micro text-solo-tinta-tenue">/ {title}</span>
      ) : (
        <span className="ml-auto micro text-solo-tinta-tenue">Mariana · MG</span>
      )}
    </header>
  );
}
