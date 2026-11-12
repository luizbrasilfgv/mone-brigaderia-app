import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Sacola } from "@/components/sacola/Sacola";
import { EsqueletoSacola } from "@/components/sacola/comum";
import { listarCampanhas, listarDoces, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

// A sacola fica só no celular de quem compra: a página só traz o cardápio do dia para
// conferir preços, opções, estoque e prazos. Sem analytics e fora do Google.
export const metadata: Metadata = { title: "Sua sacola", robots: { index: false, follow: false } };

export default function PaginaSacola() {
  return (
    <Suspense fallback={<EsqueletoSacola />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const agora = minutoAtual();
  const [doces, campanhas, loja] = await Promise.all([listarDoces(), listarCampanhas(), obterLoja()]);
  return <Sacola doces={doces} campanhas={campanhas} loja={loja} agora={agora} />;
}
