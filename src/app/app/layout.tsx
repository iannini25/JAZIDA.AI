// Layout do App do Cidadao — mobile-first, container max-w-md centralizado.
import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JAZIDA — sua voz, sua cidade",
  description:
    "App do cidadao do JAZIDA AI: cadastre talento, mande queixa ou sugestao, veja o que a mineradora fez por causa de voce.",
};

export default function CitizenAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-white shadow-sm">
        {children}
      </div>
    </div>
  );
}
