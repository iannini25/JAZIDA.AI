// Layout do Dashboard — Strata Subsolo. Sidebar lateral + tinta escura.
import "../globals.css";
import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { IconSprite } from "@/components/ui/Icons";

export const metadata: Metadata = {
  title: "JAZIDA · Painel da mineradora",
  description:
    "Painel de inteligencia territorial: sentimento, alertas, agentes, ESG.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark-scope flex min-h-screen w-full">
      <IconSprite />
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
