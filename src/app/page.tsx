import { connection } from "next/server";
import { Suspense } from "react";
import { Vitrine } from "@/components/vitrine/Vitrine";
import { listarCampanhas, listarCategorias, listarDoces, obterLoja } from "@/lib/dados";
import { minutoAtual } from "@/lib/horarios";

export default function PaginaVitrine() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-dvh max-w-md" />}>
      <Conteudo />
    </Suspense>
  );
}

async function Conteudo() {
  // Os doces vêm do banco na hora da visita (com cache), não do momento da publicação.
  await connection();
  // "Agora" e "hoje" (horário de Brasília) saem daqui, para a página já chegar com o
  // banner, os doces de campanha e o "Aberto agora" certos.
  const agora = minutoAtual();
  const [doces, campanhas, categorias, loja] = await Promise.all([listarDoces(), listarCampanhas(), listarCategorias(), obterLoja()]);
  return <Vitrine doces={doces} campanhas={campanhas} categorias={categorias} loja={loja} agora={agora} />;
}
