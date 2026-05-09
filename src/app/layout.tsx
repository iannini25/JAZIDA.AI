import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "JAZIDA AI",
  description:
    "Plataforma de inteligencia comunitaria para cidades-mineracao brasileiras.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
