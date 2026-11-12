import type { Metadata } from "next";
import { AvisoDoPainel } from "@/components/painel/comum";

// No painel, instalar no celular cria o app "Painel Mone", que abre direto aqui.
export const metadata: Metadata = {
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Painel Mone", statusBarStyle: "black" },
};

// O acesso ao painel é barrado pelo src/proxy.ts e conferido de novo em cada ação de salvar.
export default function LayoutPainel({ children }: LayoutProps<"/painel">) {
  return (
    <div className="mx-auto min-h-dvh max-w-md">
      {/* Aviso de "Salvar e sair", que aparece já na tela seguinte. */}
      <AvisoDoPainel />
      {children}
    </div>
  );
}
