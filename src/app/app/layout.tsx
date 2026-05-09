// Layout do App do Cidadao — Strata. Container max-w-md, papel cremoso.
import "../globals.css";
import type { Metadata } from "next";
import { IconSprite } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "JAZIDA — sua voz, sua cidade",
  description:
    "App do cidadão do JAZIDA AI: cadastre talento, mande queixa ou sugestão, veja o que a mineradora fez por causa de você.",
};

export default function CitizenAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-solo-papel-fundo text-solo-tinta">
      <IconSprite />
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-solo-papel">
        {children}
      </div>
    </div>
  );
}
