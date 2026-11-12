import type { Metadata } from "next";

// No painel, instalar no celular cria o app "Painel Mone", que abre direto aqui.
export const metadata: Metadata = {
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Painel Mone", statusBarStyle: "black-translucent" },
};

// O acesso ao painel é barrado pelo src/proxy.ts e conferido de novo em cada ação de salvar.
export default function LayoutPainel({ children }: LayoutProps<"/painel">) {
  return <div className="mx-auto min-h-dvh max-w-md">{children}</div>;
}
