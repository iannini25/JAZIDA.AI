// Layout do Dashboard da Mineradora — desktop-first com sidebar lateral.
import "../globals.css";
import type { Metadata } from "next";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export const metadata: Metadata = {
  title: "JAZIDA · Dashboard da Mineradora",
  description:
    "Sentimento, alertas, agents ao vivo e relatorio ESG da operacao em Mariana.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-brand-bg text-text-primary">
      <DashboardSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
