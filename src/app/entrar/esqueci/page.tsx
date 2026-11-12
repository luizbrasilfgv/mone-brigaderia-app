import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { obterLoja } from "@/lib/dados";
import { LOJA } from "@/lib/loja";
import { PedirSenhaNova } from "./PedirSenhaNova";

export const metadata: Metadata = {
  title: "Esqueci a senha",
  manifest: "/painel.webmanifest",
  appleWebApp: { capable: true, title: "Painel Mone", statusBarStyle: "black-translucent" },
};

// Quem esquece a senha pede uma senha nova para a administração, pelo WhatsApp da loja.
export default function PaginaEsqueci({ searchParams }: PageProps<"/entrar/esqueci">) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-5 py-8">
      <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={72} height={72} className="rounded-full" loading="eager" />
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="font-display text-3xl font-semibold">Esqueci a senha</h1>
        <p className="text-[15px] leading-relaxed text-creme-200">
          Peça para a administração gerar uma senha nova. Ela chega pelo WhatsApp e, ao entrar, você cria outra senha.
        </p>
      </div>
      <Suspense>
        <Formulario searchParams={searchParams} />
      </Suspense>
      <Link href="/entrar" className="flex min-h-11 items-center text-sm font-bold text-dourado">
        Voltar para entrar
      </Link>
    </main>
  );
}

async function Formulario({ searchParams }: { searchParams: PageProps<"/entrar/esqueci">["searchParams"] }) {
  const { email } = await searchParams;
  // Depois do searchParams: o número é lido na hora da visita, não na compilação.
  const loja = await obterLoja();
  return <PedirSenhaNova emailInicial={typeof email === "string" ? email.slice(0, 190) : ""} whatsapp={loja.whatsapp} />;
}
