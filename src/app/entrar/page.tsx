import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { bancoConfigurado } from "@/lib/banco";
import { painelConfigurado, sessaoValida } from "@/lib/auth";
import { LOJA } from "@/lib/loja";
import { FormularioEntrada } from "./FormularioEntrada";

export const metadata: Metadata = { title: "Entrar no painel" };

export default function PaginaEntrar() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-5">
      <Image src={LOJA.logo} alt={`Logo da ${LOJA.nome}`} width={88} height={88} className="rounded-full" priority />
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-display text-3xl font-semibold">Painel da loja</h1>
        <p className="text-sm text-creme-400">{LOJA.nome}</p>
      </div>
      <Suspense>
        <Conteudo />
      </Suspense>
    </main>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl bg-cacau-900 p-4 text-center text-sm leading-relaxed text-creme-200">{children}</p>;
}

async function Conteudo() {
  // Depende da configuração do servidor e do cookie da visita.
  await connection();
  if (!bancoConfigurado()) {
    return (
      <>
        <Aviso>O banco ainda não está configurado, então o painel funciona em modo demonstração, sem senha.</Aviso>
        <Link href="/painel" className="font-bold text-dourado">
          Abrir o painel
        </Link>
      </>
    );
  }
  if (!painelConfigurado()) {
    return <Aviso>Falta configurar PAINEL_SENHA e SESSAO_SEGREDO no servidor. Veja docs/publicar.md.</Aviso>;
  }
  if (await sessaoValida()) redirect("/painel");
  return <FormularioEntrada />;
}
