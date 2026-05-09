import "./globals.css";
import type { Metadata } from "next";
import { Newsreader, Inter_Tight, JetBrains_Mono } from "next/font/google";

// Sistema visual Strata — 3 fontes:
//   Newsreader  : display editorial (manchetes)
//   Inter Tight : body condensado com carater
//   JetBrains   : mono pra IDs, protocolos, timestamps, codigo
const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"],
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "JAZIDA AI",
  description:
    "Plataforma de inteligencia territorial para cidades-mineracao brasileiras.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body className="font-body">{children}</body>
    </html>
  );
}
