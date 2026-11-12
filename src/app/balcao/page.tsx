import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { Balcao } from "@/components/Balcao";
import { enderecoDoSite } from "@/lib/auth";
import { listarCampanhas, listarDoces, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

export const metadata: Metadata = { title: "Balcão" };

export default function PaginaBalcao() {
  return (
    <Suspense>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  await connection();
  const agora = minutoAtual();
  const [doces, campanhas, loja, endereco] = await Promise.all([listarDoces(), listarCampanhas(), obterLoja(), enderecoDoSite()]);
  return <Balcao doces={doces} campanhas={campanhas} loja={loja} agora={agora} endereco={endereco} />;
}
