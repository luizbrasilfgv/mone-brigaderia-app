import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { Balcao } from "@/components/Balcao";
import { IconeVoltar } from "@/components/Icones";
import { enderecoDoSite } from "@/lib/auth";
import { listarCampanhas, listarDoces, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

export const metadata: Metadata = { title: "Balcão" };

export default function PaginaBalcao() {
  return (
    <>
      <Suspense>
        <Conteudo />
      </Suspense>
      {/* Volta discreta para quem abriu pelo Menu do painel (no app instalado não há barra
          de endereço). Sem login, o painel pede para entrar. */}
      <Link
        href="/painel"
        aria-label="Voltar ao painel"
        className="fixed top-[calc(10px+env(safe-area-inset-top))] left-[calc(10px+env(safe-area-inset-left))] z-10 flex h-11 items-center gap-1 rounded-full border border-creme/12 bg-cacau-950/60 pr-3.5 pl-2 text-xs font-semibold text-creme-400 opacity-70 backdrop-blur-sm transition-opacity hover:opacity-100 focus-visible:opacity-100"
      >
        <IconeVoltar tamanho={18} />
        Painel
      </Link>
    </>
  );
}

async function Conteudo() {
  await connection();
  const agora = minutoAtual();
  const [doces, campanhas, loja, endereco] = await Promise.all([listarDoces(), listarCampanhas(), obterLoja(), enderecoDoSite()]);
  return <Balcao doces={doces} campanhas={campanhas} loja={loja} agora={agora} endereco={endereco} />;
}
